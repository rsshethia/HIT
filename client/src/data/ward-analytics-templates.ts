// ---------------------------------------------------------------------------
// Ward Analytics kit — PID x PV1 questions over RAW HL7, answered locally.
// Architecture: ONE foundation mart (parsed once from RAW HL7 with the
// fn_GetHL7Field parse layer from HIT SQL Builder) + thin per-question
// views. Scheduled refresh (5-15 min) is the default freshness mechanism;
// the trigger template only enqueues new IDs, never runs analytics inline.
// Targets: SQL Server (T-SQL), PostgreSQL (plpgsql), MySQL 8.
// ---------------------------------------------------------------------------

export type WardPlatform = "sqlserver" | "postgresql" | "mysql";

export interface WardConfig {
  platform: WardPlatform;
  martSchema: string;      // ignored on MySQL (no schemas; tables unqualified)
  sourceTable: string;     // RAW HL7 landing table
  sourceColumn: string;    // column holding the full HL7 message
  idColumn: string;        // PK of the landing table
  locWard: number;         // 1-based ^-component of PV1-3 = ward (point of care)
  locRoom: number;         // 1-based ^-component of PV1-3 = room
  locBed: number;          // 1-based ^-component of PV1-3 = bed
  dayStartHour: number;    // business-hours window, e.g. 8-18
  dayEndHour: number;
  readmitDays: number;     // default 28
}

export const DEFAULT_WARD_CONFIG: WardConfig = {
  platform: "sqlserver",
  martSchema: "mart",
  sourceTable: "dbo.RawHL7",
  sourceColumn: "RawMessage",
  idColumn: "MessageID",
  locWard: 1,
  locRoom: 2,
  locBed: 3,
  dayStartHour: 8,
  dayEndHour: 18,
  readmitDays: 28,
};

export type QuestionKind = "Aggregate" | "Row-level";

export interface WardQuestion {
  id: string;
  group: "Flow & capacity" | "People" | "Throughput & discharge";
  question: string;
  why: string;
  kind: QuestionKind;
  grain: string;
  fields: string;
}

// -- Question catalog ---------------------------------------------------------
export const WARD_QUESTIONS: WardQuestion[] = [
  { id: "los", group: "Flow & capacity", question: "How long do patients stay in each ward / room / bed?", why: "Rising LOS clogs beds downstream. Median resists long-stay outliers; compare both.", kind: "Aggregate", grain: "One row per discharged visit (A01->A03 on PV1-19).", fields: "MSH-9, PV1-3, PV1-19, PV1-44, PV1-45" },
  { id: "turnover", group: "Flow & capacity", question: "Which beds and rooms turn over fastest or slowest?", why: "Slow turnover flags cleaning, staffing, or discharge-lounge bottlenecks.", kind: "Aggregate", grain: "Discharges per bed over the period.", fields: "MSH-9, PV1-3, PV1-19, PV1-45" },
  { id: "census", group: "Flow & capacity", question: "How full is each ward right now?", why: "Live census proxy for bed meetings. Reconcile against PAS; missed messages drift it.", kind: "Aggregate", grain: "Latest message per open visit.", fields: "MSH-9, PV1-3, PV1-19, PV1-44, PV1-45" },
  { id: "boarding", group: "Flow & capacity", question: "How long do admitted patients board in ED?", why: "Boarding hours are the purest access-block signal.", kind: "Aggregate", grain: "ED admit -> first ward transfer (A02) per visit.", fields: "MSH-9, PV1-3, PV1-19, PV1-44" },
  { id: "afterhours", group: "Flow & capacity", question: "How many admissions and discharges happen after hours?", why: "After-hours volume argues for evening/weekend staffing.", kind: "Aggregate", grain: "Admit/discharge events by hour of day.", fields: "MSH-9, PV1-44, PV1-45" },
  { id: "transfers", group: "Flow & capacity", question: "Where do transfers cluster (from ward -> to ward)?", why: "Heavy pairs reveal specialty pathways or placement friction.", kind: "Aggregate", grain: "A02 events with prior location per visit.", fields: "MSH-9, PV1-3, PV1-19" },
  { id: "age", group: "People", question: "What is the average age on each ward and service?", why: "Age mix drives acuity, falls risk, and discharge complexity.", kind: "Aggregate", grain: "Admitted visits with DOB present.", fields: "PID-7, PV1-3, PV1-10, PV1-19, PV1-44" },
  { id: "longstay", group: "People", question: "Who are this week's long-stay outliers (above ward P90)?", why: "Named list for discharge-planning rounds. Identified data: restrict access.", kind: "Row-level", grain: "Open visits exceeding their ward's 90th percentile LOS.", fields: "PID-3, PID-5, PV1-3, PV1-19, PV1-44" },
  { id: "readmit", group: "People", question: "Which patients returned within N days of discharge?", why: "Early returns spotlight discharge quality and follow-up gaps.", kind: "Row-level", grain: "Discharge followed by a new admission for the same MRN.", fields: "PID-3, PID-5, PV1-19, PV1-44, PV1-45" },
  { id: "doctor", group: "People", question: "What is each attending doctor's current census and caseload mix?", why: "Workload balance across consultants; pairs with LOS for outlier review.", kind: "Aggregate", grain: "Open visits per PV1-7 with age/sex mix.", fields: "PID-7, PID-8, PV1-7, PV1-19" },
  { id: "beforenoon", group: "Throughput & discharge", question: "What share of discharges happen before noon, by ward?", why: "Morning discharges free beds for afternoon admissions.", kind: "Aggregate", grain: "A03 events by discharge hour.", fields: "MSH-9, PV1-3, PV1-45" },
  { id: "disposition", group: "Throughput & discharge", question: "Where do discharges go (home, aged care, AMA, deceased)?", why: "AMA and failed-placement rates are quality signals worth trending.", kind: "Aggregate", grain: "A03 events by PV1-36 disposition.", fields: "MSH-9, PV1-3, PV1-36" },
];

// -- Platform expression helpers ----------------------------------------------
// fn access: dbo.fn_GetHL7Field(msg, 'PID-3', 'FIRST', NULL, 0) on T-SQL,
// fn_GetHL7Field(msg, ...) on PostgreSQL and MySQL.
const FN = (cfg: WardConfig) => (cfg.platform === "sqlserver" ? "dbo.fn_GetHL7Field" : "fn_GetHL7Field");
const F = (cfg: WardConfig, msg: string, field: string) => `${FN(cfg)}(${msg}, '${field}', 'FIRST', NULL, 0)`;
const T = (cfg: WardConfig, name: string) =>
  cfg.platform === "sqlserver" ? `[${cfg.martSchema}].[${name}]`
  : cfg.platform === "postgresql" ? `"${cfg.martSchema}"."${name}"`
  : `\`${name}\``;

const DT = (cfg: WardConfig, expr: string) => {
  // Pad short values (date-only 'YYYYMMDD') so fixed-position parsing never fails.
  if (cfg.platform === "sqlserver") {
    const p = `SUBSTRING(${expr}+'00000000000000',`;
    return `TRY_CONVERT(DATETIME2, ${p}1,4)+'-'+${p}5,2)+'-'+${p}7,2)+' '+${p}9,2)+':'+${p}11,2)+':'+${p}13,2))`;
  }
  if (cfg.platform === "postgresql") return `TO_TIMESTAMP(NULLIF(RPAD(${expr},14,'0'),''), 'YYYYMMDDHH24MISS')`;
  return `STR_TO_DATE(NULLIF(${expr},''), '%Y%m%d%H%i%s')`;
};
const D = (cfg: WardConfig, expr: string) => {
  if (cfg.platform === "sqlserver") return `TRY_CONVERT(DATE, SUBSTRING(${expr},1,4)+'-'+SUBSTRING(${expr},5,2)+'-'+SUBSTRING(${expr},7,2))`;
  if (cfg.platform === "postgresql") return `TO_DATE(NULLIF(${expr},''), 'YYYYMMDD')`;
  return `STR_TO_DATE(NULLIF(${expr},''), '%Y%m%d')`;
};
const LOC = (cfg: WardConfig, expr: string, n: number) => {
  // T-SQL: PARSENAME counts from the RIGHT and caps at 4 parts, so a facility
  // 4th component would shift positions. XML split counts from the left like
  // SPLIT_PART / SUBSTRING_INDEX. (Assumes no & < > in location strings.)
  if (cfg.platform === "sqlserver") return `CAST('<x>'+REPLACE(${expr},'^','</x><x>')+'</x>' AS XML).value('/x[${n}][1]','NVARCHAR(100)')`;
  if (cfg.platform === "postgresql") return `SPLIT_PART(${expr},'^',${n})`;
  return `SUBSTRING_INDEX(SUBSTRING_INDEX(${expr},'^',${n}),'^',-1)`;
};
const LOS_DAYS = (cfg: WardConfig, a: string, d: string) => {
  if (cfg.platform === "sqlserver") return `DATEDIFF(MINUTE, ${a}, ${d})/1440.0`;
  if (cfg.platform === "postgresql") return `EXTRACT(EPOCH FROM (${d} - ${a}))/86400.0`;
  return `TIMESTAMPDIFF(MINUTE, ${a}, ${d})/1440.0`;
};
const HOUR = (cfg: WardConfig, expr: string) => {
  if (cfg.platform === "sqlserver") return `DATEPART(HOUR, ${expr})`;
  if (cfg.platform === "postgresql") return `EXTRACT(HOUR FROM ${expr})`;
  return `HOUR(${expr})`;
};
const AGE_YRS = (cfg: WardConfig, dob: string, ref: string) => {
  if (cfg.platform === "sqlserver")
    return `DATEDIFF(YEAR, ${dob}, ${ref}) - CASE WHEN DATEADD(YEAR, DATEDIFF(YEAR, ${dob}, ${ref}), ${dob}) > ${ref} THEN 1 ELSE 0 END`;
  if (cfg.platform === "postgresql") return `DATE_PART('year', AGE(${ref}, ${dob}))`;
  return `TIMESTAMPDIFF(YEAR, ${dob}, ${ref})`;
};
const TOP = (cfg: WardConfig, n: number) => (cfg.platform === "sqlserver" ? `TOP ${n} ` : "");
const LIMIT = (cfg: WardConfig, n: number) => (cfg.platform === "sqlserver" ? "" : ` LIMIT ${n}`);
// Newest-message-first ordering that is NULL-safe on all platforms
// (T-SQL has no NULLS LAST; bare DESC would rank NULL datetimes first).
const RECENT = "CASE WHEN message_dt IS NULL THEN 1 ELSE 0 END, message_dt DESC, message_id DESC";
const RUNLOS = (cfg: WardConfig, admitRef: string) => {
  if (cfg.platform === "sqlserver") return `DATEDIFF(MINUTE, ${admitRef}, SYSDATETIME())/1440.0`;
  if (cfg.platform === "postgresql") return `EXTRACT(EPOCH FROM (NOW() - ${admitRef}))/86400.0`;
  return `TIMESTAMPDIFF(MINUTE, ${admitRef}, NOW())/1440.0`;
};

// -- Foundation mart ------------------------------------------------------------
export function buildMartSql(cfg: WardConfig): string {
  // MySQL has no schemas: a dotted default like dbo.RawHL7 would misparse as db.table.
  const mysqlBase = (s: string) => `\`${s.replace(/`/g, "").split(".").pop() ?? s}\``;
  const src = cfg.platform === "sqlserver" ? cfg.sourceTable
    : cfg.platform === "postgresql" ? cfg.sourceTable : mysqlBase(cfg.sourceTable);
  const col = cfg.platform === "mysql" ? `\`${cfg.sourceColumn}\`` : `${cfg.sourceColumn}`;
  const id = cfg.platform === "mysql" ? `\`${cfg.idColumn}\`` : `${cfg.idColumn}`;
  const f = (field: string) => F(cfg, `s.${col}`, field);
  const admit = DT(cfg, f("PV1-44"));
  const disch = DT(cfg, f("PV1-45"));
  const dob = D(cfg, f("PID-7"));
  const msgdt = DT(cfg, f("MSH-7"));
  const loc = f("PV1-3");
  const tbl = T(cfg, "VisitEvents");
  const q = T(cfg, "WardMart_Queue");

  const ddl = cfg.platform === "sqlserver"
    ? `IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = N'${cfg.martSchema}') EXEC(N'CREATE SCHEMA [${cfg.martSchema}]');
IF OBJECT_ID(N'${tbl}', N'U') IS NULL
CREATE TABLE ${tbl} (
  message_id INT IDENTITY PRIMARY KEY, source_id INT NOT NULL,
  control_id NVARCHAR(50) NOT NULL UNIQUE, msg_type NVARCHAR(20) NULL,
  mrn NVARCHAR(50) NULL, dob DATE NULL, sex NVARCHAR(10) NULL,
  visit_no NVARCHAR(50) NULL, admit_dt DATETIME2 NULL, disch_dt DATETIME2 NULL,
  ward NVARCHAR(100) NULL, room NVARCHAR(50) NULL, bed NVARCHAR(50) NULL,
  service NVARCHAR(100) NULL, doctor NVARCHAR(100) NULL,
  admit_source NVARCHAR(100) NULL, disch_disp NVARCHAR(100) NULL,
  message_dt DATETIME2 NULL, processed_at DATETIME2 NOT NULL DEFAULT SYSDATETIME()
);
IF OBJECT_ID(N'${q}', N'U') IS NULL
CREATE TABLE ${q} (source_id INT PRIMARY KEY, enqueued_at DATETIME2 NOT NULL DEFAULT SYSDATETIME());`
    : cfg.platform === "postgresql"
    ? `CREATE SCHEMA IF NOT EXISTS "${cfg.martSchema}";
CREATE TABLE IF NOT EXISTS ${tbl} (
  message_id SERIAL PRIMARY KEY, source_id INT NOT NULL,
  control_id VARCHAR(50) NOT NULL UNIQUE, msg_type VARCHAR(20),
  mrn VARCHAR(50), dob DATE, sex VARCHAR(10),
  visit_no VARCHAR(50), admit_dt TIMESTAMP, disch_dt TIMESTAMP,
  ward VARCHAR(100), room VARCHAR(50), bed VARCHAR(50),
  service VARCHAR(100), doctor VARCHAR(100),
  admit_source VARCHAR(100), disch_disp VARCHAR(100),
  message_dt TIMESTAMP, processed_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS ${q} (source_id INT PRIMARY KEY, enqueued_at TIMESTAMP NOT NULL DEFAULT NOW());`
    : `CREATE TABLE IF NOT EXISTS ${tbl} (
  message_id INT AUTO_INCREMENT PRIMARY KEY, source_id INT NOT NULL,
  control_id VARCHAR(50) NOT NULL UNIQUE, msg_type VARCHAR(20),
  mrn VARCHAR(50), dob DATE, sex VARCHAR(10),
  visit_no VARCHAR(50), admit_dt DATETIME, disch_dt DATETIME,
  ward VARCHAR(100), room VARCHAR(50), bed VARCHAR(50),
  service VARCHAR(100), doctor VARCHAR(100),
  admit_source VARCHAR(100), disch_disp VARCHAR(100),
  message_dt DATETIME, processed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS ${q} (source_id INT PRIMARY KEY, enqueued_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP);`;

  const insHead = cfg.platform === "sqlserver"
    ? `CREATE OR ALTER PROCEDURE ${T(cfg, "usp_WardMart_Refresh")} AS\nBEGIN\n  SET NOCOUNT ON;`
    : cfg.platform === "postgresql"
    ? `CREATE OR REPLACE FUNCTION ${T(cfg, "usp_wardmart_refresh")}() RETURNS VOID AS $$\nBEGIN`
    : `DELIMITER //\nDROP PROCEDURE IF EXISTS usp_WardMart_Refresh //\nCREATE PROCEDURE usp_WardMart_Refresh()\nBEGIN`;
  const insTail = cfg.platform === "sqlserver" ? `END` : cfg.platform === "postgresql" ? `END; $$ LANGUAGE plpgsql;` : `END //\nDELIMITER ;`;

  return `-- Ward Analytics kit — 00 foundation mart (${cfg.platform})
-- Parse RAW HL7 ONCE into ${tbl}. Requires fn_GetHL7Field (HIT SQL Builder, Step 0).
-- Assumes segment lines end with CR; source feeds with CRLF are normalized below.
-- Idempotent: re-runnable, skips already-loaded MSH-10 control IDs.
${ddl}

${insHead}
  INSERT INTO ${tbl}
    (source_id, control_id, msg_type, mrn, dob, sex, visit_no,
     admit_dt, disch_dt, ward, room, bed, service, doctor,
     admit_source, disch_disp, message_dt)
  SELECT s.${id}, ${f("MSH-10")}, LEFT(${f("MSH-9")}, 7),
    ${f("PID-3")}, ${dob}, ${f("PID-8")}, ${f("PV1-19")},
    ${admit}, ${disch},
    ${LOC(cfg, loc, cfg.locWard)}, ${LOC(cfg, loc, cfg.locRoom)}, ${LOC(cfg, loc, cfg.locBed)},
    ${f("PV1-10")}, ${f("PV1-7")}, ${f("PV1-14")}, ${f("PV1-36")}, ${msgdt}
  FROM ${src} s
  WHERE NOT EXISTS (SELECT 1 FROM ${tbl} m WHERE m.control_id = ${f("MSH-10")})
    AND ${f("MSH-9")} LIKE 'ADT^A%';
${insTail}
`;
}

// -- Per-question SQL ------------------------------------------------------------
export function buildQuestionSql(cfg: WardConfig, qid: string): string {
  const t = T(cfg, "VisitEvents");
  const los = LOS_DAYS(cfg, "admit_dt", "disch_dt");
  const hr = (c: string) => HOUR(cfg, c);
  const top = TOP(cfg, 100);
  const lim = LIMIT(cfg, 100);
  switch (qid) {
    case "los": {
      // Median must aggregate over raw rows: a window over GROUPed rows would
      // see one row per ward and error (non-grouped columns in OVER/ORDER BY).
      const body = cfg.platform === "mysql"
        ? `WITH ranked AS (
  SELECT ward, ${los} AS los_days,
    ROW_NUMBER() OVER (PARTITION BY ward ORDER BY ${los}) AS rn,
    COUNT(*) OVER (PARTITION BY ward) AS n
  FROM ${t} WHERE admit_dt IS NOT NULL AND disch_dt IS NOT NULL AND visit_no IS NOT NULL
)
SELECT ward, COUNT(*) AS stays,
  ROUND(AVG(los_days), 1) AS avg_los_days,
  ROUND(AVG(CASE WHEN rn IN (FLOOR((n+1)/2), CEIL((n+1)/2)) THEN los_days END), 1) AS median_los_days
FROM ranked GROUP BY ward ORDER BY stays DESC${lim};`
        : `WITH base AS (
  SELECT COALESCE(ward,'(blank)') AS ward, ${los} AS los_days
  FROM ${t} WHERE admit_dt IS NOT NULL AND disch_dt IS NOT NULL AND visit_no IS NOT NULL
),
med AS (
  SELECT ward, PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY los_days) AS median_los_days
  FROM base GROUP BY ward
)
SELECT ${top}b.ward, COUNT(*) AS stays,
  ROUND(AVG(b.los_days), 1) AS avg_los_days,
  ROUND(MAX(m.median_los_days), 1) AS median_los_days
FROM base b JOIN med m ON m.ward = b.ward
GROUP BY b.ward ORDER BY stays DESC${lim};`;
      return `-- Q: How long do patients stay in each ward / room / bed?\n${body}`;
    }
    case "turnover":
      return `-- Q: Which beds and rooms turn over fastest or slowest?\nSELECT ${top}ward, room, bed, COUNT(*) AS discharges\nFROM ${t}\nWHERE disch_dt IS NOT NULL AND bed IS NOT NULL AND bed <> ''\nGROUP BY ward, room, bed\nHAVING COUNT(*) >= 5\nORDER BY discharges DESC${lim};`;
    case "census":
      // Open = latest message per visit has no discharge. Excludes A03/A11
      // explicitly: a cancel-admit arriving out of order must not resurrect.
      return `-- Q: How full is each ward right now? (latest message per open visit)\nWITH latest AS (\n  SELECT *, ROW_NUMBER() OVER (PARTITION BY visit_no ORDER BY ${RECENT}) AS rn\n  FROM ${t} WHERE visit_no IS NOT NULL AND visit_no <> ''\n)\nSELECT ${top}ward, COUNT(*) AS current_patients\nFROM latest WHERE rn = 1 AND disch_dt IS NULL AND msg_type NOT IN ('ADT^A03','ADT^A11')\nGROUP BY ward ORDER BY current_patients DESC${lim};`;
    case "boarding": {
      // '%ED' would also match 'BED'/'MED': test exact 'ED' or EMERG* instead,
      // symmetrically on both sides so the ward leg can never equal the ED leg.
      const isEd = `(UPPER(ward) = 'ED' OR UPPER(ward) LIKE '%EMERG%')`;
      const notEd = `(UPPER(ward) <> 'ED' AND UPPER(ward) NOT LIKE '%EMERG%')`;
      return `-- Q: How long do admitted patients board in ED?\nWITH ed AS (\n  SELECT visit_no, MIN(admit_dt) AS ed_admit\n  FROM ${t} WHERE ${isEd} AND admit_dt IS NOT NULL GROUP BY visit_no\n),\nward_move AS (\n  SELECT visit_no, MIN(admit_dt) AS ward_admit\n  FROM ${t} WHERE ${notEd} AND admit_dt IS NOT NULL GROUP BY visit_no\n)\nSELECT ${top}COUNT(*) AS boarded_stays,\n  ROUND(AVG(${LOS_DAYS(cfg, "e.ed_admit", "w.ward_admit")}), 1) AS avg_boarding_days\nFROM ed e JOIN ward_move w ON w.visit_no = e.visit_no AND w.ward_admit > e.ed_admit${lim};`;
    }
    case "afterhours":
      return `-- Q: How many admissions and discharges happen after hours (${cfg.dayStartHour}:00-${cfg.dayEndHour}:00 is business hours)?\nSELECT ${top}CASE WHEN ${hr("admit_dt")} BETWEEN ${cfg.dayStartHour} AND ${cfg.dayEndHour - 1} THEN 'business-hours' ELSE 'after-hours' END AS period,\n  COUNT(*) AS admissions\nFROM ${t} WHERE admit_dt IS NOT NULL\nGROUP BY CASE WHEN ${hr("admit_dt")} BETWEEN ${cfg.dayStartHour} AND ${cfg.dayEndHour - 1} THEN 'business-hours' ELSE 'after-hours' END${lim};`;
    case "transfers":
      return `-- Q: Where do transfers cluster (from ward -> to ward)?\nWITH ordered AS (\n  SELECT visit_no, ward, message_dt,\n    LAG(ward) OVER (PARTITION BY visit_no ORDER BY message_dt, message_id) AS from_ward\n  FROM ${t} WHERE msg_type = 'ADT^A02'\n)\nSELECT ${top}from_ward, ward AS to_ward, COUNT(*) AS transfers\nFROM ordered WHERE from_ward IS NOT NULL AND from_ward <> ward\nGROUP BY from_ward, ward\nHAVING COUNT(*) >= 3\nORDER BY transfers DESC${lim};`;
    case "age":
      return `-- Q: What is the average age on each ward and service?\nSELECT ${top}ward, service, COUNT(*) AS patients,\n  ROUND(AVG(${AGE_YRS(cfg, "dob", "admit_dt")}), 1) AS avg_age\nFROM ${t}\nWHERE dob IS NOT NULL AND admit_dt IS NOT NULL\nGROUP BY ward, service\nHAVING COUNT(*) >= 5\nORDER BY patients DESC${lim};`;
    case "longstay": {
      // P90 comes from COMPLETED stays (comparing open stays to themselves is
      // self-referential). Running LOS is measured against the current time.
      const runlos = RUNLOS(cfg, "o.admit_dt");
      const p90agg = cfg.platform === "mysql"
        ? null
        : `PERCENTILE_CONT(0.9) WITHIN GROUP (ORDER BY los_days)`;
      const body = cfg.platform === "mysql"
        ? `WITH completed AS (\n  SELECT ward, ${los} AS los_days FROM ${t}\n  WHERE admit_dt IS NOT NULL AND disch_dt IS NOT NULL\n),\nranked AS (\n  SELECT ward, los_days, ROW_NUMBER() OVER (PARTITION BY ward ORDER BY los_days) AS rn,\n    COUNT(*) OVER (PARTITION BY ward) AS n FROM completed\n),\np90 AS (SELECT ward, AVG(CASE WHEN rn = CEIL(n*0.9) THEN los_days END) AS p90_los FROM ranked GROUP BY ward),\nopen AS (\n  SELECT mrn, visit_no, ward, admit_dt, ROW_NUMBER() OVER (PARTITION BY visit_no ORDER BY ${RECENT}) AS rn\n  FROM ${t} WHERE visit_no IS NOT NULL AND visit_no <> '' AND admit_dt IS NOT NULL AND disch_dt IS NULL AND msg_type NOT IN ('ADT^A03','ADT^A11')\n)\nSELECT ${top}o.mrn, o.visit_no, o.ward, ROUND(${runlos},1) AS los_days_so_far, ROUND(p.p90_los,1) AS ward_p90_completed\nFROM open o JOIN p90 p ON p.ward = o.ward OR (p.ward IS NULL AND o.ward IS NULL)\nWHERE o.rn = 1 AND ${runlos} > p.p90_los\nORDER BY ${runlos} DESC${lim};`
        : `WITH completed AS (\n  SELECT COALESCE(ward,'(blank)') AS ward, ${los} AS los_days FROM ${t}\n  WHERE admit_dt IS NOT NULL AND disch_dt IS NOT NULL\n),\np90 AS (\n  SELECT ward, ${p90agg} AS p90_los FROM completed GROUP BY ward\n),\nopen AS (\n  SELECT mrn, visit_no, COALESCE(ward,'(blank)') AS ward, admit_dt,\n    ROW_NUMBER() OVER (PARTITION BY visit_no ORDER BY ${RECENT}) AS rn\n  FROM ${t} WHERE visit_no IS NOT NULL AND visit_no <> '' AND admit_dt IS NOT NULL AND disch_dt IS NULL AND msg_type NOT IN ('ADT^A03','ADT^A11')\n)\nSELECT ${top}o.mrn, o.visit_no, o.ward, ROUND(${runlos},1) AS los_days_so_far, ROUND(p.p90_los,1) AS ward_p90_completed\nFROM open o JOIN p90 p ON p.ward = o.ward\nWHERE o.rn = 1 AND ${runlos} > p.p90_los\nORDER BY ${runlos} DESC${lim};`;
      return `-- Q: Who are this week's long-stay outliers? (ROW-LEVEL: restrict access)\n${body}`;
    }
    case "readmit":
      return `-- Q: Which patients returned within ${cfg.readmitDays} days of discharge? (ROW-LEVEL: restrict access)\nWITH discharges AS (\n  SELECT DISTINCT mrn, visit_no, disch_dt FROM ${t}\n  WHERE disch_dt IS NOT NULL AND mrn IS NOT NULL AND mrn <> ''\n),\nadmits AS (\n  SELECT DISTINCT mrn, visit_no, admit_dt FROM ${t}\n  WHERE admit_dt IS NOT NULL AND mrn IS NOT NULL AND mrn <> ''\n)\nSELECT ${top}d.mrn, d.visit_no AS prior_visit, a.visit_no AS return_visit,\n  d.disch_dt, a.admit_dt\nFROM discharges d JOIN admits a ON a.mrn = d.mrn AND a.visit_no <> d.visit_no\n  AND a.admit_dt > d.disch_dt\n  AND a.admit_dt <= ${cfg.platform === "sqlserver" ? `DATEADD(DAY, ${cfg.readmitDays}, d.disch_dt)` : cfg.platform === "postgresql" ? `d.disch_dt + INTERVAL '${cfg.readmitDays} days'` : `DATE_ADD(d.disch_dt, INTERVAL ${cfg.readmitDays} DAY)`}\nORDER BY a.admit_dt DESC${lim};`;
    case "doctor":
      return `-- Q: What is each attending doctor's current census and caseload mix?\nWITH latest AS (\n  SELECT *, ROW_NUMBER() OVER (PARTITION BY visit_no ORDER BY ${RECENT}) AS rn\n  FROM ${t} WHERE visit_no IS NOT NULL AND visit_no <> ''\n)\nSELECT ${top}doctor, COUNT(*) AS current_patients,\n  ROUND(AVG(${AGE_YRS(cfg, "dob", "admit_dt")}), 1) AS avg_age\nFROM latest\nWHERE rn = 1 AND disch_dt IS NULL AND msg_type NOT IN ('ADT^A03','ADT^A11') AND doctor IS NOT NULL AND doctor <> ''\nGROUP BY doctor\nORDER BY current_patients DESC${lim};`;
    case "beforenoon":
      return `-- Q: What share of discharges happen before noon, by ward?\nSELECT ${top}ward, COUNT(*) AS discharges,\n  SUM(CASE WHEN ${hr("disch_dt")} < 12 THEN 1 ELSE 0 END) AS before_noon,\n  ROUND(100.0 * SUM(CASE WHEN ${hr("disch_dt")} < 12 THEN 1 ELSE 0 END) / COUNT(*), 1) AS pct_before_noon\nFROM ${t} WHERE disch_dt IS NOT NULL\nGROUP BY ward\nHAVING COUNT(*) >= 5\nORDER BY pct_before_noon DESC${lim};`;
    case "disposition":
      return `-- Q: Where do discharges go (home, aged care, AMA, deceased)?\nSELECT ${top}ward, COALESCE(disch_disp,'(blank)') AS disposition, COUNT(*) AS discharges\nFROM ${t} WHERE disch_dt IS NOT NULL\nGROUP BY ward, COALESCE(disch_disp,'(blank)')\nORDER BY ward, discharges DESC${lim};`;
    default:
      return `-- Unknown question id: ${qid}`;
  }
}

// -- Refresh scheduling + trigger -------------------------------------------------
export function buildRefreshJob(cfg: WardConfig): string {
  const proc = cfg.platform === "sqlserver" ? `${T(cfg, "usp_WardMart_Refresh")}`
    : cfg.platform === "postgresql" ? `${T(cfg, "usp_wardmart_refresh")}()` : `usp_WardMart_Refresh()`;
  if (cfg.platform === "sqlserver")
    return `-- Ward Analytics kit — freshness: SQL Agent job every 10 minutes (default; primary mechanism).\n-- Replace YOUR_DATABASE with the database that holds the ${cfg.martSchema} schema.\nUSE msdb;\nEXEC dbo.sp_add_job @job_name = N'WardMart Refresh';\nEXEC dbo.sp_add_jobstep @job_name = N'WardMart Refresh', @step_name = N'Refresh mart',\n  @subsystem = N'TSQL', @command = N'EXEC ${proc};', @database_name = N'YOUR_DATABASE';\nEXEC dbo.sp_add_schedule @schedule_name = N'Every 10 min', @freq_type = 4, @freq_interval = 1,\n  @freq_subday_type = 4, @freq_subday_interval = 10;\nEXEC dbo.sp_attach_schedule @job_name = N'WardMart Refresh', @schedule_name = N'Every 10 min';\nEXEC dbo.sp_add_jobserver @job_name = N'WardMart Refresh';`;
  if (cfg.platform === "postgresql")
    return `-- Ward Analytics kit — freshness: cron every 10 minutes calling the refresh function.\n-- Add to the postgres user's crontab (adjust connection string):\n-- */10 * * * * psql "$DATABASE_URL" -c "SELECT ${proc};" >> /var/log/wardmart.log 2>&1`;
  return `-- Ward Analytics kit — freshness: MySQL EVENT every 10 minutes.\nSET GLOBAL event_scheduler = ON;\nCREATE EVENT IF NOT EXISTS ev_wardmart_refresh\nON SCHEDULE EVERY 10 MINUTE\nDO CALL ${proc};`;
}

export function buildTriggerSql(cfg: WardConfig): string {
  const src = cfg.platform === "sqlserver" ? cfg.sourceTable : cfg.platform === "postgresql" ? cfg.sourceTable : `\`${cfg.sourceTable.replace(/`/g, "").split(".").pop() ?? cfg.sourceTable}\``;
  const id = cfg.platform === "mysql" ? `\`${cfg.idColumn}\`` : `${cfg.idColumn}`;
  const q = T(cfg, "WardMart_Queue");
  const warn = `-- WARNING: this trigger ONLY enqueues new row IDs for the scheduled job.\n-- Never put analytics or parsing inside a trigger on a production feed table.`;
  if (cfg.platform === "sqlserver")
    return `${warn}\nCREATE OR ALTER TRIGGER [${cfg.martSchema}].[trg_WardMart_Enqueue]\nON ${src}\nAFTER INSERT AS\nBEGIN\n  SET NOCOUNT ON;\n  INSERT INTO ${q} (source_id)\n  SELECT i.${id} FROM inserted i\n  WHERE NOT EXISTS (SELECT 1 FROM ${q} x WHERE x.source_id = i.${id});\nEND`;
  if (cfg.platform === "postgresql")
    return `${warn}\nCREATE OR REPLACE FUNCTION ${T(cfg, "trg_wardmart_enqueue")}() RETURNS TRIGGER AS $$\nBEGIN\n  INSERT INTO ${q} (source_id) VALUES (NEW.${id}) ON CONFLICT DO NOTHING;\n  RETURN NEW;\nEND; $$ LANGUAGE plpgsql;\nDROP TRIGGER IF EXISTS trg_wardmart_enqueue ON ${src};\nCREATE TRIGGER trg_wardmart_enqueue AFTER INSERT ON ${src}\nFOR EACH ROW EXECUTE FUNCTION ${T(cfg, "trg_wardmart_enqueue")}();`;
  return `${warn}\nDELIMITER //\nDROP TRIGGER IF EXISTS trg_wardmart_enqueue //\nCREATE TRIGGER trg_wardmart_enqueue AFTER INSERT ON ${src}\nFOR EACH ROW\nBEGIN\n  INSERT IGNORE INTO ${q} (source_id) VALUES (NEW.${id});\nEND //\nDELIMITER ;`;
}

// -- Fixtures (docs + self-test) ----------------------------------------------------
export const WARD_FIXTURES = [
  { label: "A01 admit 4W-12-A (MRN 1001, visit V9001, 2026-09-01 09:00)", mrn: "1001", visit: "V9001", type: "ADT^A01", ward: "4W", los_days: null as number | null },
  { label: "A02 transfer 4W -> 5E (same visit, 2026-09-03 14:00)", mrn: "1001", visit: "V9001", type: "ADT^A02", ward: "5E", los_days: null },
  { label: "A03 discharge 5E (2026-09-06 10:30)", mrn: "1001", visit: "V9001", type: "ADT^A03", ward: "5E", los_days: 5.06 },
  { label: "A04 ED registration (MRN 1002, visit V9002)", mrn: "1002", visit: "V9002", type: "ADT^A04", ward: "ED", los_days: null },
  { label: "A01 readmit 4W within 28d (MRN 1001, visit V9003, 2026-09-20)", mrn: "1001", visit: "V9003", type: "ADT^A01", ward: "4W", los_days: null },
];

export function buildAllWardSql(cfg: WardConfig, qids: string[]): string {
  // GO is a SQL Server batch separator only; PG/MySQL would choke on it.
  const sep = cfg.platform === "sqlserver" ? "\nGO\n" : "\n\n";
  return [buildMartSql(cfg), ...qids.map((q) => buildQuestionSql(cfg, q))].join(sep);
}
