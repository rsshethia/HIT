// eReferral Starter Kit — pure logic, no DOM access.
// Story: "Forms go missing on a daily basis leaving patients without
// appointments." Scores a service's referral maturity and maps a sample
// REF_I12 to FHIR ServiceRequest so teams see the target state.

export type Platform = "sqlserver" | "postgres" | "mysql";

export interface EreferralQuestion {
  id: string;
  question: string;
  weight: number;
  fix: string;
  toolHref: string;
  toolLabel: string;
}

export const QUESTIONS: EreferralQuestion[] = [
  {
    id: "capture",
    question: "Every referral is captured in a system — none live only on paper, fax or in an inbox.",
    weight: 20,
    fix: "Start a single referral register (even a shared list) so nothing exists only on paper. Every referral gets an ID and a date.",
    toolHref: "/hl7-sql-builder",
    toolLabel: "HL7 SQL Builder",
  },
  {
    id: "track",
    question: "You can list every open referral and see its status (received, triaged, booked, completed).",
    weight: 20,
    fix: "Add a status column and review the open list weekly. Use the tracking SQL below as a starter.",
    toolHref: "/hl7-sql-builder",
    toolLabel: "HL7 SQL Builder",
  },
  {
    id: "ack",
    question: "Senders get an acknowledgement — GPs know their referral arrived and was accepted or redirected.",
    weight: 15,
    fix: "Agree one acknowledgement path (secure message, phone log, portal status) and record it against the referral.",
    toolHref: "/v2-to-fhir-converter",
    toolLabel: "V2 → FHIR Converter",
  },
  {
    id: "structured",
    question: "Referrals carry structured essentials: patient ID, reason, urgency, specialty, sender details.",
    weight: 15,
    fix: "Reject-or-query incomplete referrals with a standard checklist. Map fields to RF1/PID segments (see the sample below).",
    toolHref: "/hl7-data-quality-auditor",
    toolLabel: "Data-Quality Auditor",
  },
  {
    id: "triage",
    question: "Urgency categories are defined and triage happens within an agreed timeframe.",
    weight: 10,
    fix: "Publish triage timeframes (e.g. urgent 2 days, routine 2 weeks) and measure compliance monthly.",
    toolHref: "/hl7-ward-analytics",
    toolLabel: "Ward Analytics",
  },
  {
    id: "secure",
    question: "Referrals move by secure messaging or system integration — not fax, post or personal email.",
    weight: 10,
    fix: "Count fax referrals for one month (the strategy targets zero fax machines), then move the top sender to secure messaging.",
    toolHref: "/message-trace",
    toolLabel: "MessageTrace",
  },
  {
    id: "mhr",
    question: "Summaries and outcomes flow back to My Health Record and the GP (closing the loop).",
    weight: 5,
    fix: "Check what your discharge/separation summary carries today, then map it to FHIR for sharing.",
    toolHref: "/v2-to-fhir-converter",
    toolLabel: "V2 → FHIR Converter",
  },
  {
    id: "deidentify",
    question: "Referral data shared for planning is de-identified first.",
    weight: 5,
    fix: "Generate de-identified extracts inside your own database before sharing demand analyses.",
    toolHref: "/hl7-deidentify-sql",
    toolLabel: "De-Identify SQL",
  },
];

export interface Gap {
  question: EreferralQuestion;
}

export function scoreEreferral(answers: Record<string, boolean>): { score: number; gaps: Gap[] } {
  let earned = 0;
  const total = QUESTIONS.reduce((n, q) => n + q.weight, 0);
  const gaps: Gap[] = [];
  for (const q of QUESTIONS) {
    if (answers[q.id]) earned += q.weight;
    else gaps.push({ question: q });
  }
  gaps.sort((a, b) => b.question.weight - a.question.weight);
  return { score: Math.round((earned / total) * 100), gaps };
}

export function buildActionPlan(score: number, gaps: Gap[]): string {
  const lines = [
    "# eReferral Readiness (HIT Starter Kit)",
    "",
    `- Readiness score: ${score}/100`,
    `- Gaps to fix: ${gaps.length} of ${QUESTIONS.length}`,
    "",
    "## Fix in this order (biggest impact first)",
  ];
  gaps.forEach((g, i) => lines.push(`${i + 1}. ${g.question.question}`, `   Fix: ${g.question.fix}`, `   Tool: ${g.question.toolLabel} (${g.question.toolHref})`, ""));
  if (!gaps.length) lines.push("No gaps — your referrals are trackable, structured and closing the loop. Re-run quarterly.");
  return lines.join("\n");
}

export const SAMPLE_REF = [
  "MSH|^~\\&|GP_SYS|FAMILY_CLINIC|HOSP_SYS|CITY_HOSP|20260310100000+1100||REF^I12|REF00001|P|2.5",
  "RF1|OUTCARD_ROUTINE|Routine|CARD^CARDIOLOGY^CLINIC|20260310100000+1100||||GP_SHAW",
  "PID|||PT10001^^^CITY_HOSP^MR||CITIZEN^ALEX^J||19900514|M",
  "OBX|1|TX|-note^REFERRAL_NOTES^L||Exertional chest tightness 3 months, ECG borderline, please assess||||||F",
].join("\n");

export interface FieldMapRow {
  v2: string;
  fhir: string;
  value: string;
}

export const REF_TO_FHIR_MAP: FieldMapRow[] = [
  { v2: "RF1-1 → ServiceRequest.category", fhir: "ServiceRequest.category", value: "OUTCARD_ROUTINE — outpatient, routine" },
  { v2: "RF1-3 → ServiceRequest.code / performer", fhir: "ServiceRequest.performer", value: "CARDIOLOGY clinic — who should act" },
  { v2: "RF1-4 → ServiceRequest.authoredOn", fhir: "ServiceRequest.authoredOn", value: "2026-03-10 — when sent (track waits from here)" },
  { v2: "RF1-8 → ServiceRequest.requester", fhir: "ServiceRequest.requester", value: "GP_SHAW — the sender, for acknowledgements" },
  { v2: "PID-3 → ServiceRequest.subject", fhir: "ServiceRequest.subject", value: "PT10001 — the patient (link, don't retype)" },
  { v2: "OBX-5 → ServiceRequest.note", fhir: "ServiceRequest.note", value: "Clinical notes travel with the referral, not on a cover sheet" },
  { v2: "Status → ServiceRequest.status", fhir: "ServiceRequest.status", value: "active → on-hold → completed — the tracking list your fax machine never had" },
];

function quoteIdent(p: Platform, name: string): string {
  return p === "mysql" ? `\`${name}\`` : `"${name}"`;
}

export function buildReferralSql(table: string, platform: Platform): string {
  const t = quoteIdent(platform, table);
  const header = `-- HIT eReferral Tracking Starter — ${platform}\n-- Table: ${table}\n-- Expects columns: referral_id, received_date, status, specialty, source (fax/paper/secure/system).\n-- Read-only SELECTs. Adapt column names to yours.\n`;
  const days = (col: string) =>
    platform === "sqlserver" ? `DATEDIFF(day, ${col}, GETDATE())`
    : platform === "postgres" ? `CURRENT_DATE - ${col}::date`
    : `DATEDIFF(CURDATE(), ${col})`;
  return `${header}
-- 1. Open referrals by status (your tracking list)
SELECT status, COUNT(*) AS open_referrals
FROM ${t}
WHERE status IN ('received','triaged','booked')
GROUP BY status ORDER BY open_referrals DESC;

-- 2. Stale referrals: open longer than 14 days (triage breach candidates)
SELECT referral_id, specialty, status, received_date,
       ${days("received_date")} AS days_open
FROM ${t}
WHERE status IN ('received','triaged','booked')
  AND ${days("received_date")} > 14
ORDER BY days_open DESC;

-- 3. Fax/paper share (the strategy targets zero fax machines)
SELECT source, COUNT(*) AS referrals,
       ROUND(100.0 * COUNT(*) / (SELECT COUNT(*) FROM ${t}), 1) AS pct
FROM ${t} GROUP BY source ORDER BY referrals DESC;`;
}
