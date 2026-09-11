// ---------------------------------------------------------------------------
// GeoKit SA2 templates — PID-11 Street Address → SA2 inside the hospital's own
// SQL Server. All scripts target SQL Server 2019+ and are idempotent.
// Public reference data (G-NAF Core + ABS ASGS) is downloaded by the DBA
// inside their own network; no patient address ever leaves the database.
// ---------------------------------------------------------------------------

export type GeoKitInputMode = "Auto" | "National" | "PerState";

export interface GeoKitConfig {
  refSchema: string;
  martSchema: string;
  states: string[];
  asgsEdition: "2021" | "2026";
  sourceTable: string;
  idColumn: string;
  inputMode: GeoKitInputMode;
  gnafPath: string;
}

export const DEFAULT_GEOKIT_CONFIG: GeoKitConfig = {
  refSchema: "ref",
  martSchema: "mart",
  states: ["NSW"],
  asgsEdition: "2026",
  sourceTable: "dbo.RawHL7",
  idColumn: "MessageID",
  inputMode: "Auto",
  gnafPath: "",
};

export const ASGS_YEAR_COL = { "2021": "2021", "2026": "2026" } as const;

export const GNAF_LINKS = [
  { label: "G-NAF Core (data.gov.au, quarterly, CC-BY 4.0)", url: "https://data.gov.au/data/dataset/19432f89-dc3a-4ef3-b943-5326ef1dbecc" },
  { label: "G-NAF Core docs (Geoscape)", url: "https://docs.geoscape.com.au/projects/gnafcore_info/en/stable/" },
];

export const ASGS_LINKS = [
  { label: "ABS ASGS Ed.3 (2021) digital boundaries", url: "https://www.abs.gov.au/statistics/standards/australian-statistical-geography-standard-asgs/edition-3-july-2021-june-2026/access-and-downloads/digital-boundary-files" },
  { label: "ABS ASGS Ed.4 (2026) digital boundaries", url: "https://www.abs.gov.au/statistics/standards/australian-statistical-geography-standard-asgs/edition-4-july-2026-june-2031/access-and-downloads/digital-boundary-files" },
  { label: "ABS geospatial web services", url: "https://www.abs.gov.au/statistics/standards/australian-statistical-geography-standard-asgs/edition-4-july-2026-june-2031/access-and-downloads/geospatial-web-services" },
];

const stateList = (cfg: GeoKitConfig) => cfg.states.join(", ");
const yy = (cfg: GeoKitConfig) => (cfg.asgsEdition === "2026" ? "2026" : "2021");

// Canonical ADDRESS_KEY rule — MUST match dbo.GeoKit_Normalize (T-SQL) and
// Normalize-GeoKey (loader PS) exactly:
// UPPER -> strip punctuation , . / - ; : ' " ( ) -> drop ONE leading unit
// clause (UNIT 5 / LEVEL 2 / FLAT 3 ...) -> whole-token abbreviations ->
// collapse spaces. In-browser trial matches what SQL will match.
const GEO_UNIT_TOKENS = new Set(["UNIT", "LEVEL", "FLAT", "APARTMENT", "APT", "SUITE", "SHOP", "LOT"]);
const GEO_ABBREV: Record<string, string> = {
  STREET: "ST", ROAD: "RD", AVENUE: "AVE", AV: "AVE", DRIVE: "DR", LANE: "LN",
  COURT: "CT", PLACE: "PL", CRESCENT: "CRES", TERRACE: "TCE", PARADE: "PDE",
  BOULEVARD: "BLVD", HIGHWAY: "HWY", CLOSE: "CL",
};

export function normalizeKeyJs(parts: { num?: string; street?: string; suburb?: string; state?: string; postcode?: string }): string {
  const raw = [parts.num ?? "", parts.street ?? "", parts.suburb ?? "", parts.state ?? "", parts.postcode ?? ""].join(" ");
  const tokens = raw
    .toUpperCase()
    .replace(/[.,;:'"()/-]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 0);
  let start = 0;
  if (tokens.length >= 1 && GEO_UNIT_TOKENS.has(tokens[0])) start = 2;
  return tokens
    .slice(start)
    .map((t) => GEO_ABBREV[t] ?? t)
    .join(" ");
}

// -- Script 01: pre-req / permission check -----------------------------------
export function buildPrereqSql(cfg: GeoKitConfig): string {
  return `-- GeoKit SA2 — 01 pre-requisite check (read-only, safe to run)
-- Target scope: ${stateList(cfg)} | ASGS ${cfg.asgsEdition}
SELECT @@VERSION AS SqlVersion;
SELECT HAS_PERMS_BY_NAME(NULL, NULL, 'CREATE SCHEMA') AS CanCreateSchema,
       HAS_PERMS_BY_NAME(NULL, NULL, 'CREATE TABLE') AS CanCreateTable,
       HAS_PERMS_BY_NAME(NULL, NULL, 'CREATE PROCEDURE') AS CanCreateProc;
-- Space check: full national lite load ~2-4 GB. One state ~0.5-1 GB.
-- Sample trial (bundled CSV) needs < 5 MB.
SELECT DB_NAME() AS DatabaseName;
`;
}

// -- Script 02: create reference + mart tables --------------------------------
export function buildCreateTablesSql(cfg: GeoKitConfig): string {
  const R = cfg.refSchema;
  const M = cfg.martSchema;
  const y = yy(cfg);
  return `-- GeoKit SA2 — 02 create tables (idempotent, re-runnable)
-- Scope: ${stateList(cfg)} | ASGS ${cfg.asgsEdition}
IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = N'${R}') EXEC(N'CREATE SCHEMA [${R}]');
IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = N'${M}') EXEC(N'CREATE SCHEMA [${M}]');
GO

-- Trimmed G-NAF Core: one row per principal address. LAT/LON stay in [${R}] only.
IF OBJECT_ID(N'[${R}].[GNAF_CORE_LITE]', N'U') IS NULL
BEGIN
  CREATE TABLE [${R}].[GNAF_CORE_LITE] (
    ADDRESS_KEY      NVARCHAR(300)  NOT NULL,
    ADDRESS_DETAIL_PID NVARCHAR(20) NOT NULL,
    STATE_ABBR       CHAR(3)        NOT NULL,
    POSTCODE         CHAR(4)        NOT NULL,
    LATITUDE         DECIMAL(10,8)  NULL,
    LONGITUDE        DECIMAL(11,8)  NULL,
    MB_CODE_${y}     CHAR(11)       NOT NULL,
    ASGS_EDITION     CHAR(4)        NOT NULL DEFAULT('${y}'),
    CONSTRAINT PK_GNAF_CORE_LITE PRIMARY KEY (ADDRESS_KEY)
  );
  CREATE INDEX IX_GNAF_STATE_POSTCODE ON [${R}].[GNAF_CORE_LITE] (STATE_ABBR, POSTCODE);
END
GO

-- ABS Mesh Block -> SA lookup (tiny table, ~350k rows national).
IF OBJECT_ID(N'[${R}].[ASGS_MB_TO_SA]', N'U') IS NULL
BEGIN
  CREATE TABLE [${R}].[ASGS_MB_TO_SA] (
    MB_CODE_${y}  CHAR(11)     NOT NULL PRIMARY KEY,
    SA1_CODE_${y} CHAR(11)     NOT NULL,
    SA2_CODE_${y} CHAR(9)      NOT NULL,
    SA2_NAME_${y} NVARCHAR(50) NOT NULL,
    SA3_CODE_${y} CHAR(5)      NOT NULL,
    SA3_NAME_${y} NVARCHAR(50) NOT NULL,
    SA4_CODE_${y} CHAR(3)      NOT NULL,
    STATE_NAME    NVARCHAR(50) NOT NULL
  );
  CREATE INDEX IX_MB_SA2 ON [${R}].[ASGS_MB_TO_SA] (SA2_CODE_${y});
END
GO

-- Postcode fallback for addresses missing from G-NAF (less precise, flagged).
IF OBJECT_ID(N'[${R}].[POSTCODE_TO_SA2]', N'U') IS NULL
BEGIN
  CREATE TABLE [${R}].[POSTCODE_TO_SA2] (
    POSTCODE    CHAR(4)      NOT NULL,
    STATE_ABBR  CHAR(3)      NOT NULL,
    SA2_CODE_${y} CHAR(9)    NOT NULL,
    SA2_NAME_${y} NVARCHAR(50) NOT NULL,
    CONSTRAINT PK_POSTCODE_TO_SA2 PRIMARY KEY (POSTCODE, STATE_ABBR)
  );
END
GO

-- De-identified output: the ONLY table analysts / PowerBI may read.
-- Deliberately NO street, NO PID-11 raw, NO lat/lon.
IF OBJECT_ID(N'[${M}].[Visit_Catchment]', N'U') IS NULL
BEGIN
  CREATE TABLE [${M}].[Visit_Catchment] (
    SourceID      INT           NOT NULL PRIMARY KEY,
    ServiceCode   NVARCHAR(50)  NULL,
    VisitType     NVARCHAR(50)  NULL,
    DoctorID      NVARCHAR(50)  NULL,
    SA2_CODE      CHAR(9)       NULL,
    SA2_NAME      NVARCHAR(50)  NULL,
    GeocodeStatus NVARCHAR(20)  NOT NULL DEFAULT('PENDING'),
    GeocodedAt    DATETIME2     NOT NULL DEFAULT(SYSDATETIME())
  );
END
GO
`;
}

// -- Script 03: normalize function + geocode procedure -------------------------
export function buildProcSql(cfg: GeoKitConfig): string {
  const R = cfg.refSchema;
  const M = cfg.martSchema;
  const y = yy(cfg);
  return `-- GeoKit SA2 — 04 normalize function + geocode procedure (SQL Server 2019+)
-- Writes ONLY SA2_CODE/SA2_NAME + status into [${M}].[Visit_Catchment].

IF OBJECT_ID(N'dbo.GeoKit_Normalize', N'FN') IS NOT NULL DROP FUNCTION dbo.GeoKit_Normalize;
GO
CREATE FUNCTION dbo.GeoKit_Normalize(
  @Num NVARCHAR(50), @Street NVARCHAR(100), @Suburb NVARCHAR(100),
  @State NVARCHAR(10), @Postcode NVARCHAR(10)
)
RETURNS NVARCHAR(300)
AS
BEGIN
  -- Canonical rule (must match normalizeKeyJs + Normalize-GeoKey):
  -- UPPER, strip punctuation, drop ONE leading unit clause, whole-token
  -- abbreviations (space-padded REPLACE = word boundaries), collapse spaces.
  DECLARE @s NVARCHAR(300) = UPPER(LTRIM(RTRIM(
    COALESCE(@Num,N'') + N' ' + COALESCE(@Street,N'') + N' ' +
    COALESCE(@Suburb,N'') + N' ' + COALESCE(@State,N'') + N' ' + COALESCE(@Postcode,N''))));
  SET @s = REPLACE(REPLACE(REPLACE(REPLACE(@s, N',', N' '), N'.', N' '), N'/', N' '), N'-', N' ');
  SET @s = REPLACE(REPLACE(REPLACE(REPLACE(@s, N';', N' '), N':', N' '), N'''', N' '), N'"', N' ');
  SET @s = REPLACE(REPLACE(@s, N'(', N' '), N')', N' ');
  -- leading unit clause: "UNIT 5 20 HIGH ST..." -> "20 HIGH ST..."
  DECLARE @sp1 INT = CHARINDEX(N' ', @s + N' ');
  IF LEFT(@s, @sp1 - 1) IN (N'UNIT',N'LEVEL',N'FLAT',N'APARTMENT',N'APT',N'SUITE',N'SHOP',N'LOT')
  BEGIN
    SET @s = LTRIM(SUBSTRING(@s, @sp1 + 1, 800));
    SET @sp1 = CHARINDEX(N' ', @s + N' ');
    SET @s = LTRIM(SUBSTRING(@s, @sp1 + 1, 800));
  END
  SET @s = N' ' + @s + N' ';
  SET @s = REPLACE(@s, N' STREET ', N' ST ');   SET @s = REPLACE(@s, N' ROAD ', N' RD ');
  SET @s = REPLACE(@s, N' AVENUE ', N' AVE ');  SET @s = REPLACE(@s, N' AV ', N' AVE ');
  SET @s = REPLACE(@s, N' DRIVE ', N' DR ');    SET @s = REPLACE(@s, N' LANE ', N' LN ');
  SET @s = REPLACE(@s, N' COURT ', N' CT ');    SET @s = REPLACE(@s, N' PLACE ', N' PL ');
  SET @s = REPLACE(@s, N' CRESCENT ', N' CRES '); SET @s = REPLACE(@s, N' PARADE ', N' PDE ');
  SET @s = REPLACE(@s, N' TERRACE ', N' TCE '); SET @s = REPLACE(@s, N' BOULEVARD ', N' BLVD ');
  SET @s = REPLACE(@s, N' HIGHWAY ', N' HWY '); SET @s = REPLACE(@s, N' CLOSE ', N' CL ');
  WHILE CHARINDEX(N'  ', @s) > 0 SET @s = REPLACE(@s, N'  ', N' ');
  RETURN LTRIM(RTRIM(@s));
END
GO

IF OBJECT_ID(N'dbo.usp_GeocodeVisitToSA2', N'P') IS NOT NULL DROP PROCEDURE dbo.usp_GeocodeVisitToSA2;
GO
CREATE PROCEDURE dbo.usp_GeocodeVisitToSA2
  @SourceID  INT,
  @AddrNum   NVARCHAR(50),  -- PID-11.1 street number
  @Street    NVARCHAR(100), -- PID-11 street name (+ type)
  @Suburb    NVARCHAR(100), -- PID-11.3
  @State     NVARCHAR(10),  -- PID-11.4
  @Postcode  NVARCHAR(10),  -- PID-11.5
  @Service   NVARCHAR(50) = NULL, -- PV1 derived, optional
  @VisitType NVARCHAR(50) = NULL,
  @DoctorID  NVARCHAR(50) = NULL  -- PV1-7 derived, optional
AS
BEGIN
  SET NOCOUNT ON;
  DECLARE @key NVARCHAR(300) = dbo.GeoKit_Normalize(@AddrNum, @Street, @Suburb, @State, @Postcode);
  DECLARE @mb  CHAR(11) = NULL;
  DECLARE @sa2 CHAR(9)  = NULL;
  DECLARE @sa2n NVARCHAR(50) = NULL;
  DECLARE @status NVARCHAR(20);
  -- State as 3-letter abbreviation (PID-11.4 may be 'NSW' or 'New South Wales').
  DECLARE @stAbbr CHAR(3) = CASE
    WHEN UPPER(LTRIM(RTRIM(@State))) IN (N'NSW',N'VIC',N'QLD',N'SA',N'WA',N'TAS',N'NT',N'ACT') THEN UPPER(LTRIM(RTRIM(@State)))
    WHEN UPPER(LTRIM(RTRIM(@State))) LIKE N'NEW SOUTH%' THEN N'NSW'
    WHEN UPPER(LTRIM(RTRIM(@State))) LIKE N'VICTORIA%' THEN N'VIC'
    WHEN UPPER(LTRIM(RTRIM(@State))) LIKE N'QUEENSLAND' THEN N'QLD'
    WHEN UPPER(LTRIM(RTRIM(@State))) LIKE N'SOUTH AUSTRAL%' THEN N'SA'
    WHEN UPPER(LTRIM(RTRIM(@State))) LIKE N'WESTERN AUSTRAL%' THEN N'WA'
    WHEN UPPER(LTRIM(RTRIM(@State))) LIKE N'TASMANIA%' THEN N'TAS'
    WHEN UPPER(LTRIM(RTRIM(@State))) LIKE N'NORTHERN TERR%' THEN N'NT'
    WHEN UPPER(LTRIM(RTRIM(@State))) LIKE N'AUSTRALIAN CAP%' THEN N'ACT'
    ELSE UPPER(LEFT(LTRIM(RTRIM(COALESCE(@State,N''))), 3)) END;

  -- PO Box / GPO / Locked Bag can never map to a residence SA2.
  IF COALESCE(UPPER(@Street),N'') LIKE N'%PO BOX%' OR COALESCE(UPPER(@Street),N'') LIKE N'%GPO%' OR COALESCE(UPPER(@Street),N'') LIKE N'%LOCKED BAG%' OR @Suburb IS NULL OR LTRIM(RTRIM(@Suburb)) = N''
  BEGIN
    SET @status = N'UNMATCHED';
  END
  ELSE
  BEGIN
    -- 1) Exact match on normalized key.
    SELECT TOP 1 @mb = MB_CODE_${y} FROM [${R}].[GNAF_CORE_LITE] WHERE ADDRESS_KEY = @key;
    IF @mb IS NOT NULL SET @status = N'EXACT';
    ELSE
    BEGIN
      -- 2) Fuzzy fallback: same state + postcode, street-fragment match.
      -- Guarded: fragment < 4 chars would match everything, so skip to postcode.
      DECLARE @frag NVARCHAR(20) = LEFT(dbo.GeoKit_Normalize(NULL, @Street, NULL, NULL, NULL), 6);
      SET @frag = REPLACE(REPLACE(REPLACE(@frag, N'[', N'[[]'), N'%', N'[%]'), N'_', N'[_]');
      IF LEN(@frag) >= 4
        SELECT TOP 1 @mb = g.MB_CODE_${y}
        FROM [${R}].[GNAF_CORE_LITE] g
        WHERE g.STATE_ABBR = @stAbbr
          AND g.POSTCODE = RIGHT(N'0000' + REPLACE(REPLACE(@Postcode, N' ', N''), N'-', N''), 4)
          AND @key LIKE N'%' + @frag + N'%'
        ORDER BY g.ADDRESS_KEY;
      IF @mb IS NOT NULL SET @status = N'FUZZY';
      ELSE
      BEGIN
        -- 3) Postcode fallback within the same state (flagged as less precise).
        SELECT TOP 1 @sa2 = SA2_CODE_${y}, @sa2n = SA2_NAME_${y}
        FROM [${R}].[POSTCODE_TO_SA2]
        WHERE POSTCODE = RIGHT(N'0000' + REPLACE(REPLACE(@Postcode, N' ', N''), N'-', N''), 4)
          AND STATE_ABBR = @stAbbr;
        IF @sa2 IS NOT NULL SET @status = N'POSTCODE_ONLY';
        ELSE SET @status = N'UNMATCHED';
      END
    END
    -- Resolve Mesh Block -> SA2 for EXACT/FUZZY paths.
    IF @mb IS NOT NULL
      SELECT @sa2 = SA2_CODE_${y}, @sa2n = SA2_NAME_${y}
      FROM [${R}].[ASGS_MB_TO_SA] WHERE MB_CODE_${y} = @mb;
  END

  -- Upsert de-identified row only. Raw address / lat-lon are never written here.
  IF EXISTS (SELECT 1 FROM [${M}].[Visit_Catchment] WHERE SourceID = @SourceID)
    UPDATE [${M}].[Visit_Catchment]
    SET ServiceCode = @Service, VisitType = @VisitType, DoctorID = @DoctorID,
        SA2_CODE = @sa2, SA2_NAME = @sa2n, GeocodeStatus = @status, GeocodedAt = SYSDATETIME()
    WHERE SourceID = @SourceID;
  ELSE
    INSERT INTO [${M}].[Visit_Catchment]
      (SourceID, ServiceCode, VisitType, DoctorID, SA2_CODE, SA2_NAME, GeocodeStatus)
    VALUES (@SourceID, @Service, @VisitType, @DoctorID, @sa2, @sa2n, @status);
END
GO

-- Least-privilege: analysts read mart only. They must NOT see [${R}].[GNAF_CORE_LITE] lat/lon.
/*
CREATE ROLE GeoAnalyst;
GRANT SELECT ON [${M}].[Visit_Catchment] TO GeoAnalyst;
-- Do NOT grant SELECT on [${R}].[GNAF_CORE_LITE].
*/
`;
}

// -- Script 04: verification + sample analytics ---------------------------------
export function buildVerifySql(cfg: GeoKitConfig): string {
  const R = cfg.refSchema;
  const M = cfg.martSchema;
  const src = cfg.sourceTable;
  const id = cfg.idColumn;
  return `-- GeoKit SA2 — 05 verify + sample analytics
-- A) Reference tables loaded?
SELECT 'GNAF_CORE_LITE' AS Tbl, COUNT(*) AS Rows FROM [${R}].[GNAF_CORE_LITE]
UNION ALL SELECT 'ASGS_MB_TO_SA', COUNT(*) FROM [${R}].[ASGS_MB_TO_SA]
UNION ALL SELECT 'POSTCODE_TO_SA2', COUNT(*) FROM [${R}].[POSTCODE_TO_SA2];

-- B) 5-minute trial on the bundled sample rows (edit values to your state):
EXEC dbo.usp_GeocodeVisitToSA2 @SourceID=1, @AddrNum=N'182', @Street=N'Church St', @Suburb=N'Parramatta', @State=N'NSW', @Postcode=N'2150', @Service=N'ED', @VisitType=N'Emergency', @DoctorID=N'DR001';
EXEC dbo.usp_GeocodeVisitToSA2 @SourceID=2, @AddrNum=N'1', @Street=N'PO Box 100', @Suburb=N'Sydney', @State=N'NSW', @Postcode=N'2000', @Service=N'Cardiology', @VisitType=N'Outpatient', @DoctorID=N'DR002';
SELECT * FROM [${M}].[Visit_Catchment] WHERE SourceID IN (1, 2);

-- C) Match-rate report (target: EXACT+FUZZY > 90%):
SELECT GeocodeStatus, COUNT(*) AS N,
  CAST(100.0 * COUNT(*) / NULLIF(SUM(COUNT(*)) OVER (), 0) AS DECIMAL(5,2)) AS Pct
FROM [${M}].[Visit_Catchment] GROUP BY GeocodeStatus ORDER BY N DESC;

-- D) Catchment analytics (small-cell suppression: hide counts < 5):
SELECT SA2_CODE, SA2_NAME, ServiceCode, COUNT(*) AS Visits
FROM [${M}].[Visit_Catchment]
WHERE SA2_CODE IS NOT NULL
GROUP BY SA2_CODE, SA2_NAME, ServiceCode
HAVING COUNT(*) >= 5
ORDER BY Visits DESC;

SELECT SA2_CODE, SA2_NAME, DoctorID, COUNT(*) AS Visits
FROM [${M}].[Visit_Catchment]
WHERE SA2_CODE IS NOT NULL
GROUP BY SA2_CODE, SA2_NAME, DoctorID
HAVING COUNT(*) >= 5
ORDER BY Visits DESC;

-- E) Optional backfill skeleton over your RAW HL7 table (adapt PID-11 parsing):
/*
SELECT TOP 5 [${id}] FROM ${src};
-- EXEC dbo.usp_GeocodeVisitToSA2 ... once per row via cursor/batch, parsing PID-11 first.
*/
`;
}

// -- Script 03: production reference-data loader ---------------------------------
// Dependency-free PowerShell 5.1: bcp.exe + .NET SqlClient only (no SqlServer
// module, no Excel needed — DBA saves the ABS allocation .xlsx as CSV once).
// Accepts a single national G-NAF Core PSV, a folder of per-state PSV files,
// or Auto-detect. -DryRun validates parsing with zero DB writes.
export function buildLoaderPs1(cfg: GeoKitConfig): string {
  const R = cfg.refSchema;
  const y = yy(cfg);
  const states = cfg.states.join(",");
  const mode = cfg.inputMode;
  const gpath = cfg.gnafPath || (mode === "PerState" ? "C:\\GeoKit\\gnaf-states" : "C:\\GeoKit\\GNAF_CORE.psv");
  const L: string[] = [
    "# GeoKit SA2 — 03 reference-data loader (production, idempotent, re-runnable)",
    "# Run from an admin workstation with DB access. PUBLIC data in, never PHI out.",
    "# Expects script 02 (create tables) already run. Re-run quarterly: MERGE keeps it idempotent.",
    "#",
    "# G-NAF Core source : single national pipe-separated PSV, or a folder of per-state",
    "#                     PSV files (same header). Filter: ALIAS_PRINCIPAL='P' + selected states.",
    "# ABS source        : ASGS Ed.4 (2026) Mesh Block ALLOCATION xlsx (MB_2026_AUST, ~28 MB),",
    "#                     saved once as CSV. Do NOT use the 191 MB shapefile — no GIS tools needed.",
    "# Requires          : Windows PowerShell 5.1+, bcp.exe on PATH, ~1 GB free per state.",
    "# Attribution       : see README. G-NAF (c) Geoscape Australia (CC-BY 4.0 EULA); bounds (c) ABS.",
    "param(",
    "  [string]$SqlInstance = 'YOUR-SERVER',",
    "  [string]$Database   = 'YOUR-DB',",
    "  [string]$States     = '" + states + "',",
    "  [ValidateSet('Auto','National','PerState')][string]$InputMode = '" + mode + "',",
    "  [string]$GnafPath   = '" + gpath.replace(/'/g, "''") + "',",
    "  [string]$MbCsv      = 'C:\\GeoKit\\MB_2026_AUST.csv',",
    "  [string]$SampleLiteCsv = '',",
    "  [string]$WorkDir    = (Join-Path $env:TEMP 'geokit-sa2'),",
    "  [int]$BatchSize     = 100000,",
    "  [int]$DryRunRows    = 10000,",
    "  [switch]$DryRun,",
    "  [switch]$Force,",
    "  [switch]$SkipSmokeTest",
    ")",
    "$ErrorActionPreference = 'Stop'",
    "New-Item -ItemType Directory -Force -Path $WorkDir | Out-Null",
    "try { Start-Transcript -Path (Join-Path $WorkDir 'geokit-load.log') -Append | Out-Null } catch { Write-Host '[geokit] transcript unavailable, continuing.' }",
    "",
    "function Write-GeoLog([string]$m) { Write-Host ('[geokit] ' + $m) }",
    "",
    "# --- Normalize: MUST match dbo.GeoKit_Normalize + normalizeKeyJs exactly. ---",
    "# Rule: UPPER, strip punctuation , . / - ; : ' \" ( ), drop ONE leading unit",
    "# clause (UNIT 5 / LEVEL 2 / ...), whole-token abbreviations, collapse spaces.",
    "# Map lives INSIDE the function so it works in any scope (incl. -DryRun, dot-sourcing).",
    "function Normalize-GeoKey([string]$num, [string]$street, [string]$suburb, [string]$state, [string]$postcode) {",
    "  $abbrev = @{ STREET='ST'; ROAD='RD'; AVENUE='AVE'; AV='AVE'; DRIVE='DR';",
    "    LANE='LN'; COURT='CT'; PLACE='PL'; CRESCENT='CRES'; TCE='TCE'; TERRACE='TCE';",
    "    PARADE='PDE'; BOULEVARD='BLVD'; HIGHWAY='HWY'; CLOSE='CL' }",
    "  $unit = @('UNIT','LEVEL','FLAT','APARTMENT','APT','SUITE','SHOP','LOT')",
    "  $s = ((($num + ' ' + $street + ' ' + $suburb + ' ' + $state + ' ' + $postcode)).ToUpper())",
    "  foreach ($ch in @(',', '.', '/', '-', ';', ':', \"'\", '\"', '(', ')')) { $s = $s.Replace($ch, ' ') }",
    "  $toks = @($s -split '\\s+' | Where-Object { $_ -ne '' })",
    "  $start = 0",
    "  if ($toks.Count -ge 1 -and ($unit -contains $toks[0])) { $start = 2 }",
    "  $words = @()",
    "  for ($i = $start; $i -lt $toks.Count; $i++) {",
    "    if ($abbrev.ContainsKey($toks[$i])) { $words += $abbrev[$toks[$i]] } else { $words += $toks[$i] }",
    "  }",
    "  return ($words -join ' ')",
    "}",
    "",
    "# --- Minimal SQL helper over .NET SqlClient (no modules required). ---",
    "function Invoke-GeoSql([string]$sql, [int]$timeout = 600) {",
    "  $cs = 'Server=' + $SqlInstance + ';Database=' + $Database + ';Integrated Security=True;'",
    "  $con = New-Object System.Data.SqlClient.SqlConnection($cs)",
    "  $con.Open()",
    "  try {",
    "    $cmd = $con.CreateCommand(); $cmd.CommandText = $sql; $cmd.CommandTimeout = $timeout",
    "    $r = $cmd.ExecuteReader()",
    "    $out = @()",
    "    while ($r.Read()) { $row = @{}; for ($i = 0; $i -lt $r.FieldCount; $i++) { $row[$r.GetName($i)] = $r.GetValue($i) }; $out += $row }",
    "    $r.Close(); return $out",
    "  } finally { $con.Close() }",
    "}",
    "function Invoke-GeoNonQuery([string]$sql, [int]$timeout = 3600) {",
    "  $cs = 'Server=' + $SqlInstance + ';Database=' + $Database + ';Integrated Security=True;'",
    "  $con = New-Object System.Data.SqlClient.SqlConnection($cs)",
    "  $con.Open()",
    "  try { $cmd = $con.CreateCommand(); $cmd.CommandText = $sql; $cmd.CommandTimeout = $timeout; return $cmd.ExecuteNonQuery() }",
    "  finally { $con.Close() }",
    "}",
    "",
    "# --- 0. Prereqs ---",
    "Write-GeoLog ('Mode=' + $InputMode + ' States=' + $States + ' ASGS=" + y + " DryRun=' + $DryRun)",
    "if (-not $DryRun -and -not (Get-Command bcp.exe -ErrorAction SilentlyContinue)) { throw 'bcp.exe not found on PATH (not needed for -DryRun). Install SQL Server Command Line Utilities.' }",
    "$wantStates = $States -split ',' | ForEach-Object { $_.Trim().ToUpper() } | Where-Object { $_ -ne '' }",
    "if ($wantStates.Count -eq 0) { throw 'No states selected. Pass -States \"NSW,VIC\".' }",
    "if ($DryRun) { Write-GeoLog ('DRY RUN: parsing first ' + $DryRunRows + ' rows per file, no DB writes.') }",
    "else {",
    "  $ping = Invoke-GeoSql 'SELECT @@VERSION AS v' 30",
    "  Write-GeoLog 'DB connection OK.'",
    "  Invoke-GeoNonQuery @'",
    "IF OBJECT_ID(N'[" + R + "].[_stg_gnaf]', N'U') IS NULL CREATE TABLE [" + R + "].[_stg_gnaf] (",
    "  ADDRESS_KEY NVARCHAR(300) NOT NULL, ADDRESS_DETAIL_PID NVARCHAR(20) NOT NULL,",
    "  STATE_ABBR CHAR(3) NOT NULL, POSTCODE CHAR(4) NOT NULL,",
    "  LATITUDE NVARCHAR(20) NULL, LONGITUDE NVARCHAR(20) NULL, MB_CODE_" + y + " CHAR(11) NOT NULL);",
    "IF OBJECT_ID(N'[" + R + "].[_stg_mb]', N'U') IS NULL CREATE TABLE [" + R + "].[_stg_mb] (",
    "  MB_CODE_" + y + " CHAR(11) NOT NULL, SA1_CODE_" + y + " CHAR(11) NOT NULL,",
    "  SA2_CODE_" + y + " CHAR(9) NOT NULL, SA2_NAME_" + y + " NVARCHAR(50) NOT NULL,",
    "  SA3_CODE_" + y + " CHAR(5) NOT NULL, SA3_NAME_" + y + " NVARCHAR(50) NOT NULL,",
    "  SA4_CODE_" + y + " CHAR(3) NOT NULL, STATE_NAME NVARCHAR(50) NOT NULL);",
    "-- Rerun-safe: empty staging first so a resumed run can never double-load rows",
    "-- (duplicate ADDRESS_KEY in staging would fail the MERGE below).",
    "TRUNCATE TABLE [" + R + "].[_stg_gnaf]; TRUNCATE TABLE [" + R + "].[_stg_mb];",
    "'@ | Out-Null",
    "}",
    "",
    "# --- 1. Resolve G-NAF input files (skipped in -SampleLiteCsv trial mode) ---",
    "if ($SampleLiteCsv -eq '') {",
    "$gnafFiles = @()",
    "$resolved = $InputMode",
    "if ($InputMode -eq 'Auto') {",
    "  if (Test-Path $GnafPath -PathType Container) { $resolved = 'PerState' }",
    "  elseif (Test-Path $GnafPath -PathType Leaf) { $resolved = 'National' }",
    "  else { throw ('GnafPath not found: ' + $GnafPath + '. Pass -GnafPath to a .psv file or a folder of .psv files.') }",
    "  Write-GeoLog ('Auto-detected input mode: ' + $resolved)",
    "}",
    "if ($resolved -eq 'National') {",
    "  if (-not (Test-Path $GnafPath -PathType Leaf)) { throw ('National PSV not found: ' + $GnafPath) }",
    "  $gnafFiles = @($GnafPath)",
    "} else {",
    "  if (-not (Test-Path $GnafPath -PathType Container)) { throw ('State folder not found: ' + $GnafPath) }",
    "  # NOTE: -Include is ignored without a wildcard in the path, so filter by extension explicitly.",
    "  $gnafFiles = Get-ChildItem -LiteralPath $GnafPath -File | Where-Object { @('.psv','.txt','.csv') -contains $_.Extension.ToLower() } | Sort-Object Name | ForEach-Object { $_.FullName }",
    "  if ($gnafFiles.Count -eq 0) { throw ('No .psv/.txt/.csv files in ' + $GnafPath) }",
    "  Write-GeoLog ('Per-state files: ' + ($gnafFiles -join ', '))",
    "}",
    "} else { Write-GeoLog 'Sample-lite mode: G-NAF file resolution skipped.' }",
    "",
    "# --- 2. Stream-parse G-NAF PSV -> trimmed TSV batches -> bcp -> staging ---",
    "# G-NAF Core header incl: ADDRESS_DETAIL_PID|...|NUMBER_FIRST|NUMBER_LAST|STREET_NAME|",
    "# STREET_TYPE|STREET_SUFFIX|LOCALITY_NAME|STATE|POSTCODE|...|MB_CODE|ALIAS_PRINCIPAL|...|LONGITUDE|LATITUDE",
    "$needCols = @('ADDRESS_DETAIL_PID','NUMBER_FIRST','NUMBER_LAST','STREET_NAME','STREET_TYPE','STREET_SUFFIX','LOCALITY_NAME','STATE','POSTCODE','MB_CODE','ALIAS_PRINCIPAL','LONGITUDE','LATITUDE')",
    "$grandKept = 0; $grandSkipState = 0; $grandSkipAlias = 0; $stateCounts = @{}",
    "$batch = New-Object System.Collections.Generic.List[string]",
    "$batchNo = 0",
    "function Flush-GeoBatch {",
    "  if ($batch.Count -eq 0) { return }",
    "  if ($DryRun) { $batch.Clear(); return }",
    "  $batchNo++",
    "  $tsv = Join-Path $WorkDir ('gnaf_batch_' + $batchNo + '.tsv')",
    "  [System.IO.File]::WriteAllLines($tsv, $batch)",
    "  if (-not $DryRun) {",
    "    & bcp.exe '[" + R + "].[_stg_gnaf]' in $tsv -S $SqlInstance -d $Database -T -c -t \"`t\" -b 10000 | Out-Null",
    "    if ($LASTEXITCODE -ne 0) { throw ('bcp failed for batch ' + $batchNo) }",
    "  }",
    "  $batch.Clear()",
    "}",
    "if ($SampleLiteCsv -eq '') {",
    "foreach ($f in $gnafFiles) {",
    "  Write-GeoLog ('Parsing ' + $f)",
    "  $sr = [System.IO.File]::OpenText($f)",
    "  $header = $sr.ReadLine()",
    "  if ($null -eq $header) { $sr.Close(); Write-GeoLog ('EMPTY file, skipped: ' + $f); continue }",
    "  $h = $header -split '\\|'",
    "  $idx = @{}; for ($i = 0; $i -lt $h.Count; $i++) { $idx[$h[$i].Trim().ToUpper()] = $i }",
    "  foreach ($c in $needCols) { if (-not $idx.ContainsKey($c)) { $sr.Close(); throw ('Missing column ' + $c + ' in ' + $f) } }",
    "  $rows = 0; $kept = 0; $shown = 0; $raggedPad = 0; $raggedCut = 0",
    "  while (($line = $sr.ReadLine()) -ne $null) {",
    "    $rows++",
    "    if ($DryRun -and $rows -gt $DryRunRows) { break }",
    "    $p = $line.Split('|')",
    "    if ($p.Count -lt $h.Count) { $p += @('') * ($h.Count - $p.Count); $raggedPad++ }",
    "    elseif ($p.Count -gt $h.Count) { $p = $p[0..($h.Count - 1)]; $raggedCut++ }",
    "    if ($p[$idx['ALIAS_PRINCIPAL']] -ne 'P') { $grandSkipAlias++; continue }",
    "    $st = $p[$idx['STATE']].Trim().ToUpper()",
    "    if ($wantStates -notcontains $st) { $grandSkipState++; continue }",
    "    $num  = ($p[$idx['NUMBER_FIRST']].Trim() + ' ' + $p[$idx['NUMBER_LAST']].Trim()).Trim()",
    "    $stName = ($p[$idx['STREET_NAME']].Trim() + ' ' + $p[$idx['STREET_TYPE']].Trim() + ' ' + $p[$idx['STREET_SUFFIX']].Trim()).Trim()",
    "    $key = Normalize-GeoKey $num $stName $p[$idx['LOCALITY_NAME']] $st $p[$idx['POSTCODE']]",
    "    $mb = $p[$idx['MB_CODE']].Trim()",
    "    if ($key -eq '' -or $mb -eq '') { continue }",
    "    if ($DryRun -and $shown -lt 5) { Write-GeoLog ('SAMPLE KEY: ' + $key + '  MB=' + $mb); $shown++ }",
    "    $batch.Add(($key + \"`t\" + $p[$idx['ADDRESS_DETAIL_PID']].Trim() + \"`t\" + $st + \"`t\" + $p[$idx['POSTCODE']].Trim() + \"`t\" + $p[$idx['LATITUDE']].Trim() + \"`t\" + $p[$idx['LONGITUDE']].Trim() + \"`t\" + $mb))",
    "    $kept++; $grandKept++",
    "    if ($stateCounts.ContainsKey($st)) { $stateCounts[$st]++ } else { $stateCounts[$st] = 1 }",
    "    if ($batch.Count -ge $BatchSize -and -not $DryRun) { Flush-GeoBatch }",
    "  }",
    "  $sr.Close()",
    "  Write-GeoLog ('File done: rows=' + $rows + ' kept=' + $kept + ' padded=' + $raggedPad + ' truncated=' + $raggedCut)",
    "}",
    "}",
    "else {",
    "  # --- 2b. Sample-lite fast path: pre-trimmed CSV (bundled 5-minute trial). ---",
    "  # Header: ADDRESS_KEY,ADDRESS_DETAIL_PID,STATE_ABBR,POSTCODE,LATITUDE,LONGITUDE,MB_CODE_" + y + " (,ASGS_EDITION).",
    "  Write-GeoLog ('Sample-lite CSV mode: ' + $SampleLiteCsv)",
    "  if (-not (Test-Path $SampleLiteCsv -PathType Leaf)) { throw ('Sample CSV not found: ' + $SampleLiteCsv) }",
    "  $lite = @(Import-Csv -LiteralPath $SampleLiteCsv)",
    "  if ($lite.Count -eq 0) { throw ('Sample CSV is empty: ' + $SampleLiteCsv) }",
    "  $lcols = @($lite[0].PSObject.Properties.Name)",
    "  $mbLite = @('MB_CODE_" + y + "','MB_CODE_COL') | Where-Object { $lcols -contains $_ } | Select-Object -First 1",
    "  if ($null -eq $mbLite) { throw 'Sample CSV needs column MB_CODE_" + y + " (or MB_CODE_COL).' }",
    "  foreach ($c in @('ADDRESS_KEY','STATE_ABBR')) { if ($lcols -notcontains $c) { throw ('Sample CSV missing column ' + $c) } }",
    "  $lshown = 0",
    "  foreach ($r in $lite) {",
    "    $lst = ($r.STATE_ABBR).Trim().ToUpper()",
    "    if ($wantStates -notcontains $lst) { $grandSkipState++; continue }",
    "    $lmb = $r.PSObject.Properties[$mbLite].Value",
    "    if ([string]::IsNullOrWhiteSpace($r.ADDRESS_KEY) -or [string]::IsNullOrWhiteSpace($lmb)) { continue }",
    "    if ($DryRun -and $lshown -lt 5) { Write-GeoLog ('SAMPLE KEY: ' + $r.ADDRESS_KEY + '  MB=' + $lmb); $lshown++ }",
    "    $batch.Add(($r.ADDRESS_KEY.Trim() + \"`t\" + $r.ADDRESS_DETAIL_PID + \"`t\" + $lst + \"`t\" + $r.POSTCODE + \"`t\" + $r.LATITUDE + \"`t\" + $r.LONGITUDE + \"`t\" + $lmb.Trim()))",
    "    $grandKept++",
    "    if ($stateCounts.ContainsKey($lst)) { $stateCounts[$lst]++ } else { $stateCounts[$lst] = 1 }",
    "    if ($batch.Count -ge $BatchSize -and -not $DryRun) { Flush-GeoBatch }",
    "  }",
    "  Write-GeoLog ('Sample-lite done: kept=' + $grandKept)",
    "}",
    "Flush-GeoBatch",
    "Write-GeoLog ('G-NAF kept=' + $grandKept + ' skipped-alias=' + $grandSkipAlias + ' skipped-state=' + $grandSkipState)",
    "foreach ($s in $stateCounts.Keys | Sort-Object) { Write-GeoLog ('STATE ' + $s + ' staged rows=' + $stateCounts[$s]) }",
    "if ($DryRun) { Write-GeoLog 'DRY RUN complete — no DB writes. Re-run without -DryRun to load.'; try { Stop-Transcript | Out-Null } catch {}; return }",
    "",
    "# --- 3. Resume-safe MERGE staging -> GNAF_CORE_LITE (per state) ---",
    "foreach ($s in $wantStates) {",
    "  $already = (Invoke-GeoSql (\"SELECT COUNT(*) AS n FROM [" + R + "].[GNAF_CORE_LITE] WHERE STATE_ABBR='\" + $s + \"'\")).n",
    "  if ($already -gt 0 -and -not $Force) { Write-GeoLog ('State ' + $s + ' already has ' + $already + ' rows — skipped (pass -Force to reload).'); continue }",
    "  Write-GeoLog ('Merging state ' + $s + ' ...')",
    "  $merge = 'MERGE [" + R + "].[GNAF_CORE_LITE] AS t WITH (HOLDLOCK) USING (SELECT ADDRESS_KEY, ADDRESS_DETAIL_PID, STATE_ABBR, POSTCODE, TRY_CAST(LATITUDE AS DECIMAL(10,8)) AS LATITUDE, TRY_CAST(LONGITUDE AS DECIMAL(11,8)) AS LONGITUDE, MB_CODE_" + y + " FROM [" + R + "].[_stg_gnaf] WHERE STATE_ABBR=''' + $s + ''') AS s (ADDRESS_KEY, ADDRESS_DETAIL_PID, STATE_ABBR, POSTCODE, LATITUDE, LONGITUDE, MB_CODE_" + y + ") ON t.ADDRESS_KEY = s.ADDRESS_KEY WHEN MATCHED THEN UPDATE SET ADDRESS_DETAIL_PID=s.ADDRESS_DETAIL_PID, POSTCODE=s.POSTCODE, LATITUDE=s.LATITUDE, LONGITUDE=s.LONGITUDE, MB_CODE_" + y + "=s.MB_CODE_" + y + ", ASGS_EDITION=''" + y + "'' WHEN NOT MATCHED THEN INSERT (ADDRESS_KEY, ADDRESS_DETAIL_PID, STATE_ABBR, POSTCODE, LATITUDE, LONGITUDE, MB_CODE_" + y + ", ASGS_EDITION) VALUES (s.ADDRESS_KEY, s.ADDRESS_DETAIL_PID, s.STATE_ABBR, s.POSTCODE, s.LATITUDE, s.LONGITUDE, s.MB_CODE_" + y + ", ''" + y + "'');'",
    "  Invoke-GeoNonQuery $merge | Out-Null",
    "}",
    "Invoke-GeoNonQuery 'TRUNCATE TABLE [" + R + "].[_stg_gnaf];' | Out-Null",
    "",
    "# --- 4. ABS Mesh Block allocation CSV -> ASGS_MB_TO_SA (expects 2026 header) ---",
    "# Header: MB_CODE_2026,SA1_CODE_2026,SA2_CODE_2026,SA2_NAME_2026,SA3_CODE_2026,",
    "# SA3_NAME_2026,SA4_CODE_2026,SA4_NAME_2026,...,STATE_NAME_2026,...",
    "if (-not (Test-Path $MbCsv -PathType Leaf)) { throw ('MB CSV not found: ' + $MbCsv + '. Save MB_2026_AUST.xlsx as CSV first.') }",
    "Write-GeoLog ('Loading MB allocation ' + $MbCsv)",
    "$mb = Import-Csv -LiteralPath $MbCsv",
    "$mbTsv = Join-Path $WorkDir 'mb_trim.tsv'",
    "$mblines = New-Object System.Collections.Generic.List[string]",
    "foreach ($r in $mb) {",
    "  $code = $r.'MB_CODE_" + y + "'",
    "  if ([string]::IsNullOrWhiteSpace($code)) { continue }",
    "  $mblines.Add(($code.Trim() + \"`t\" + $r.'SA1_CODE_" + y + "'.Trim() + \"`t\" + $r.'SA2_CODE_" + y + "'.Trim() + \"`t\" + $r.'SA2_NAME_" + y + "'.Trim() + \"`t\" + $r.'SA3_CODE_" + y + "'.Trim() + \"`t\" + $r.'SA3_NAME_" + y + "'.Trim() + \"`t\" + $r.'SA4_CODE_" + y + "'.Trim() + \"`t\" + $r.'STATE_NAME_" + y + "'.Trim()))",
    "}",
    "[System.IO.File]::WriteAllLines($mbTsv, $mblines)",
    "& bcp.exe '[" + R + "].[_stg_mb]' in $mbTsv -S $SqlInstance -d $Database -T -c -t \"`t\" -b 10000 | Out-Null",
    "if ($LASTEXITCODE -ne 0) { throw 'bcp failed for MB staging' }",
    "Invoke-GeoNonQuery @'",
    "MERGE [" + R + "].[ASGS_MB_TO_SA] AS t WITH (HOLDLOCK) USING [" + R + "].[_stg_mb] AS s",
    "  ON t.MB_CODE_" + y + " = s.MB_CODE_" + y + "",
    "  WHEN MATCHED THEN UPDATE SET SA1_CODE_" + y + "=s.SA1_CODE_" + y + ", SA2_CODE_" + y + "=s.SA2_CODE_" + y + ",",
    "    SA2_NAME_" + y + "=s.SA2_NAME_" + y + ", SA3_CODE_" + y + "=s.SA3_CODE_" + y + ", SA3_NAME_" + y + "=s.SA3_NAME_" + y + ",",
    "    SA4_CODE_" + y + "=s.SA4_CODE_" + y + ", STATE_NAME=s.STATE_NAME",
    "  WHEN NOT MATCHED THEN INSERT (MB_CODE_" + y + ", SA1_CODE_" + y + ", SA2_CODE_" + y + ", SA2_NAME_" + y + ",",
    "    SA3_CODE_" + y + ", SA3_NAME_" + y + ", SA4_CODE_" + y + ", STATE_NAME)",
    "  VALUES (s.MB_CODE_" + y + ", s.SA1_CODE_" + y + ", s.SA2_CODE_" + y + ", s.SA2_NAME_" + y + ",",
    "    s.SA3_CODE_" + y + ", s.SA3_NAME_" + y + ", s.SA4_CODE_" + y + ", s.STATE_NAME);",
    "TRUNCATE TABLE [" + R + "].[_stg_mb];",
    "'@ | Out-Null",
    "",
    "# --- 5. Postcode fallback = dominant SA2 per postcode (rebuilt each run) ---",
    "Invoke-GeoNonQuery @'",
    "TRUNCATE TABLE [" + R + "].[POSTCODE_TO_SA2];",
    "WITH ranked AS (",
    "  SELECT g.POSTCODE, g.STATE_ABBR, m.SA2_CODE_" + y + ", m.SA2_NAME_" + y + ", COUNT(*) AS n,",
    "    ROW_NUMBER() OVER (PARTITION BY g.POSTCODE, g.STATE_ABBR ORDER BY COUNT(*) DESC) AS rn",
    "  FROM [" + R + "].[GNAF_CORE_LITE] g JOIN [" + R + "].[ASGS_MB_TO_SA] m ON m.MB_CODE_" + y + " = g.MB_CODE_" + y + "",
    "  GROUP BY g.POSTCODE, g.STATE_ABBR, m.SA2_CODE_" + y + ", m.SA2_NAME_" + y + "",
    ")",
    "INSERT INTO [" + R + "].[POSTCODE_TO_SA2] (POSTCODE, STATE_ABBR, SA2_CODE_" + y + ", SA2_NAME_" + y + ")",
    "SELECT POSTCODE, STATE_ABBR, SA2_CODE_" + y + ", SA2_NAME_" + y + " FROM ranked WHERE rn = 1;",
    "'@ | Out-Null",
    "",
    "# --- 6. Finalize: indexes, stats, counts, smoke test ---",
    "Invoke-GeoNonQuery @'",
    "IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name='IX_GNAF_STATE_POSTCODE' AND object_id=OBJECT_ID(N'[" + R + "].[GNAF_CORE_LITE]'))",
    "  CREATE INDEX IX_GNAF_STATE_POSTCODE ON [" + R + "].[GNAF_CORE_LITE] (STATE_ABBR, POSTCODE);",
    "UPDATE STATISTICS [" + R + "].[GNAF_CORE_LITE]; UPDATE STATISTICS [" + R + "].[ASGS_MB_TO_SA];",
    "'@ | Out-Null",
    "$counts = Invoke-GeoSql 'SELECT (SELECT COUNT(*) FROM [" + R + "].[GNAF_CORE_LITE]) AS gnaf, (SELECT COUNT(*) FROM [" + R + "].[ASGS_MB_TO_SA]) AS mb, (SELECT COUNT(*) FROM [" + R + "].[POSTCODE_TO_SA2]) AS pc'",
    "Write-GeoLog ('FINAL COUNTS gnaf=' + $counts.gnaf + ' mb=' + $counts.mb + ' postcode=' + $counts.pc)",
    "if (-not $SkipSmokeTest) {",
    "  $t = Invoke-GeoSql \"SELECT TOP 3 ADDRESS_KEY, MB_CODE_" + y + " FROM [" + R + "].[GNAF_CORE_LITE] WHERE STATE_ABBR='\" + $wantStates[0] + \"'\"",
    "  foreach ($row in $t) { Write-GeoLog ('SMOKE loaded key: ' + $row.ADDRESS_KEY) }",
    "  Write-GeoLog 'Smoke OK. Next: run script 04 (proc) then 05 (verify).'",
    "}",
    "Write-GeoLog 'Done.'",
    "try { Stop-Transcript | Out-Null } catch {}",
  ];
  return L.join("\r\n") + "\r\n";
}

export function buildReadme(cfg: GeoKitConfig): string {
  const modeLine = cfg.inputMode === "National"
    ? "Single national G-NAF Core PSV"
    : cfg.inputMode === "PerState"
      ? "Folder of per-state PSV files"
      : "Auto-detect: single .psv file OR folder of per-state files";
  return `# GeoKit SA2 — PID-11 to SA2 inside your SQL Server (5-minute DBA hand-off)
Scope: ${stateList(cfg)} | ASGS Ed.4 (${cfg.asgsEdition}, latest) | Schemas: ${cfg.refSchema} / ${cfg.martSchema}
G-NAF input: ${modeLine}${cfg.gnafPath ? ` (${cfg.gnafPath})` : ""}

## What this is
Turns patient street address (PID-11) into SA2 boundary codes for catchment maps
(patients by service / visit type / attending doctor) WITHOUT exposing exact addresses.
LAT/LON stay in [${cfg.refSchema}] and are never written to the analyst table.

## Run order (all scripts idempotent, re-runnable quarterly)
1. 01_prereq-check.sql — 30 seconds, read-only.
2. 02_create-tables.sql — creates ${cfg.refSchema} + ${cfg.martSchema} tables (ASGS ${cfg.asgsEdition} columns).
3. Sample trial (no big download) — the loader reads the bundled lite CSVs directly:
   .\\03_load-reference.ps1 -SqlInstance YOUR-SERVER -Database YOUR-DB -SampleLiteCsv .\\sample-GNAF-1000.csv -MbCsv .\\sample-MB-to-SA.csv -DryRun
   then re-run without -DryRun to load, then run 04 + 05 scripts and confirm EXACT match.
4. 03_load-reference.ps1 — big quarterly load, then MERGE (idempotent):
   .\\03_load-reference.ps1 -SqlInstance YOUR-SERVER -Database YOUR-DB -DryRun        # validate first, zero DB writes
   .\\03_load-reference.ps1 -SqlInstance YOUR-SERVER -Database YOUR-DB                # full load
   Per-state folder?  -InputMode PerState -GnafPath C:\\GeoKit\\gnaf-states
   Single national file? -InputMode National -GnafPath C:\\GeoKit\\GNAF_CORE.psv
   Resume skips already-loaded states; pass -Force to reload.
   ABS step: save MB_${cfg.asgsEdition}_AUST.xlsx as CSV first (one Save-As, no GIS tools), pass -MbCsv.
5. 04_create-proc.sql — normalize function + usp_GeocodeVisitToSA2.
6. 05_verify.sql — match-rate + sample catchment queries (suppression >= 5).

## Privacy rules
- Analysts get SELECT on [${cfg.martSchema}].[Visit_Catchment] ONLY.
- Never grant SELECT on [${cfg.refSchema}].[GNAF_CORE_LITE] (contains lat/lon).
- Never send PID-11 to an external geocoding API.
- Attribution: Incorporates G-NAF (c) Geoscape Australia, licensed Commonwealth of Australia (CC-BY 4.0 EULA); boundaries (c) ABS.

## Refresh
Quarterly: re-run loader (MERGE upserts, no duplicates), rebuild indexes, re-process UNMATCHED rows.
Pin one ASGS edition per reporting year; record it in ASGS_EDITION.
Beta note: T-SQL generated for SQL Server 2019+; DBA acceptance run (scripts 01+05) required.
`;
}

export function buildAllInOneSql(cfg: GeoKitConfig): string {
  return [
    buildPrereqSql(cfg),
    buildCreateTablesSql(cfg),
    buildProcSql(cfg),
    buildVerifySql(cfg),
  ].join("\nGO\n");
}

// Tiny synthetic sample so hospitals can trial without the 5GB download.
// Columns track the selected ASGS edition (2026 default).
export function buildSampleGnafCsv(cfg: GeoKitConfig): string {
  const y = yy(cfg);
  return `ADDRESS_KEY,ADDRESS_DETAIL_PID,STATE_ABBR,POSTCODE,LATITUDE,LONGITUDE,MB_CODE_${y},ASGS_EDITION
182 CHURCH ST PARRAMATTA NSW 2150,GANSW711121522,NSW,2150,-33.81618626,151.00456800,MBNSW1000001,${y}
10 SMITH ST PARRAMATTA NSW 2150,GANSW700000001,NSW,2150,-33.81500000,151.00050000,MBNSW1000002,${y}
1 HIGH ST PENRITH NSW 2750,GANSW700000002,NSW,2750,-33.75100000,150.69000000,MBNSW2000001,${y}
`;
}

export function buildSampleMbCsv(cfg: GeoKitConfig): string {
  const y = yy(cfg);
  return `MB_CODE_${y},SA1_CODE_${y},SA2_CODE_${y},SA2_NAME_${y},SA3_CODE_${y},SA3_NAME_${y},SA4_CODE_${y},STATE_NAME_${y}
MBNSW1000001,SA1PARRA001,101021007,Parramatta - North,10102,Parramatta,101,Sydney - Parramatta
MBNSW1000002,SA1PARRA002,101021007,Parramatta - North,10102,Parramatta,101,Sydney - Parramatta
MBNSW2000001,SA1PENR001,102011009,Penrith - South,10201,Penrith,102,Sydney - Outer West
`;
}

export function buildSamplePostcodeCsv(cfg: GeoKitConfig): string {
  const y = yy(cfg);
  return `POSTCODE,STATE_ABBR,SA2_CODE_${y},SA2_NAME_${y}
2150,NSW,101021007,Parramatta - North
2750,NSW,102011009,Penrith - South
2000,NSW,101021007,Parramatta - North
`;
}

// Back-compat constants (2026 default config).
export const SAMPLE_GNAF_CSV = buildSampleGnafCsv(DEFAULT_GEOKIT_CONFIG);
export const SAMPLE_MB_CSV = buildSampleMbCsv(DEFAULT_GEOKIT_CONFIG);
export const SAMPLE_POSTCODE_CSV = buildSamplePostcodeCsv(DEFAULT_GEOKIT_CONFIG);
