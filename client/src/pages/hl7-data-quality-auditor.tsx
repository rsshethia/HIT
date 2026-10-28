import { useMemo, useState } from "react";
import { usePageMeta } from "@/hooks/use-page-meta";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { ArrowLeft, Copy, Download, ClipboardCheck, ShieldCheck } from "lucide-react";
import { V2_FHIR_SAMPLES } from "@/data/v2-to-fhir-samples";
import {
  comp, firstSegment, getField, messageType, parseDTM, parseMessage,
  segmentsOf, splitMessages,
} from "@/lib/hl7-parse";

type Platform = "sqlserver" | "postgres" | "mysql";
type Severity = "Blocker" | "Warning" | "Info";

interface Issue {
  severity: Severity;
  rule: string;
  detail: string;
  messageIndex: number;
}

interface AuditConfig {
  table: string;
  column: string;
  platform: Platform;
}

const VALID_PV12 = ["I", "O", "E", "P", "R", "B", "N", "C", "D", "T", "U"];

function auditText(input: string): { score: number; issues: Issue[]; messageCount: number; deductions: number } {
  const chunks = splitMessages(input).slice(0, 50);
  const issues: Issue[] = [];
  const seenControlIds = new Set<string>();
  let deductions = 0;
  const hit = (severity: Severity, rule: string, detail: string, messageIndex: number, cost: number) => {
    issues.push({ severity, rule, detail, messageIndex });
    deductions += cost;
  };

  chunks.forEach((chunk, idx) => {
    const n = idx + 1;
    const msg = parseMessage(chunk);
    const msh = firstSegment(msg, "MSH");
    if (!msh) {
      hit("Blocker", "MSH present", "No MSH segment — not a valid HL7 message.", n, 10);
      return;
    }
    const mType = messageType(msg);
    if (mType === "UNKNOWN") hit("Warning", "MSH-9 message type", "MSH-9 is blank or unparseable.", n, 3);

    const controlId = getField(msh, 10);
    if (!controlId) hit("Blocker", "MSH-10 control ID", "Message Control ID is blank — duplicates cannot be detected.", n, 10);
    else if (seenControlIds.has(controlId)) hit("Warning", "Duplicate MSH-10", `Control ID "${controlId}" already seen — likely a resend, not a new event.`, n, 3);
    else seenControlIds.add(controlId);

    const pid = firstSegment(msg, "PID");
    if (!pid) hit("Blocker", "PID present", "No PID segment — patient linkage impossible.", n, 10);
    else {
      if (!comp(getField(pid, 3), 1)) hit("Blocker", "PID-3 patient ID", "Primary patient identifier is blank.", n, 10);
      if (!comp(getField(pid, 5), 1)) hit("Warning", "PID-5 patient name", "Family name is blank — matching and display suffer.", n, 3);
      const dob = getField(pid, 7);
      if (dob && !parseDTM(dob)) hit("Warning", "PID-7 birth date", `"${dob}" is not a valid DTM (expect YYYYMMDD).`, n, 3);
      if (!getField(pid, 8)) hit("Info", "PID-8 sex", "Administrative sex is blank — defaults to unknown downstream.", n, 1);
      if (!comp(getField(pid, 11), 1) && !comp(getField(pid, 11), 3)) hit("Info", "PID-11 address", "No street or city — catchment mapping will skip this record.", n, 1);
    }

    const pv1 = firstSegment(msg, "PV1");
    if (/^ADT/.test(mType) && !pv1) hit("Blocker", "PV1 present", `${mType} without PV1 — no visit context.`, n, 10);
    if (pv1) {
      const cls = getField(pv1, 2);
      if (!cls) hit("Warning", "PV1-2 patient class", "Patient class is blank.", n, 3);
      else if (!VALID_PV12.includes(cls.toUpperCase())) hit("Warning", "PV1-2 patient class", `"${cls}" is not a standard patient class — mappings will default.`, n, 3);
      if (!getField(pv1, 3)) hit("Info", "PV1-3 location", "Assigned location is blank — ward analytics will bucket as unknown.", n, 1);
      if (!comp(getField(pv1, 19), 1)) hit("Warning", "PV1-19 visit number", "Visit number is blank — encounter linkage is weak.", n, 3);
      const admit = parseDTM(getField(pv1, 44));
      const discharge = parseDTM(getField(pv1, 45));
      if (getField(pv1, 44) && !admit) hit("Warning", "PV1-44 admit date", "Admit DTM is unparseable.", n, 3);
      if (admit && discharge && admit > discharge) hit("Blocker", "Chronology", `Discharge (${discharge}) is before admit (${admit}).`, n, 10);
    }

    segmentsOf(msg, "OBX").forEach((obx, i) => {
      if (!getField(obx, 5)) hit("Info", `OBX[${i + 1}] value`, "Observation value is blank.", n, 1);
      if (!getField(obx, 6) && /^[A-Z]/.test(getField(obx, 2))) hit("Info", `OBX[${i + 1}] units`, "Coded observation has no units.", n, 1);
    });
    segmentsOf(msg, "DG1").forEach((dg1, i) => {
      if (!comp(getField(dg1, 3), 1) && !comp(getField(dg1, 3), 2)) hit("Warning", `DG1[${i + 1}] diagnosis`, "Diagnosis code and text are both blank.", n, 3);
    });
    const unknown = Array.from(new Set(msg.segments.map((s) => s.name))).filter((s) => !/^(MSH|EVN|PID|PV1|PV2|OBX|OBR|ORC|DG1|NK1|NTE|AL1|IN1|GT1|SCH)$/.test(s));
    unknown.forEach((s) => hit("Info", "Unhandled segment", `${s} is present — converters pass it through unmapped.`, n, 1));
  });

  const score = Math.max(0, 100 - deductions);
  return { score, issues, messageCount: chunks.length, deductions };
}

function quoteIdent(p: Platform, name: string): string {
  return p === "mysql" ? `\`${name}\`` : `"${name}"`;
}

function buildAuditSql(cfg: AuditConfig): string {
  const t = quoteIdent(cfg.platform, cfg.table);
  const c = quoteIdent(cfg.platform, cfg.column);
  const header = `-- HIT HL7 Data-Quality Audit — ${cfg.platform}\n-- Table: ${cfg.table}  Column: ${cfg.column}\n-- Run in your own database. Read-only SELECTs; no PHI leaves your server.\n`;
  if (cfg.platform === "sqlserver") {
    return `${header}
-- 1. Messages missing a patient identifier (PID-3 blank)
SELECT COUNT(*) AS missing_pid3
FROM ${t}
WHERE CHARINDEX('|', ${c}) = 0
   OR ${c} NOT LIKE '%PID|%' OR ${c} LIKE '%PID||||%';

-- 2. Duplicate Message Control IDs (MSH-10 resends)
-- CHECKSUM groups safely on large text; MIN(LEFT(...)) shows one sample.
SELECT CHECKSUM(${c}) AS msg_checksum, COUNT(*) AS occurrences,
       MIN(LEFT(CAST(${c} AS NVARCHAR(4000)), 120)) AS sample_message
FROM ${t} GROUP BY CHECKSUM(${c}) HAVING COUNT(*) > 1;

-- 3. ADT messages with no PV1 segment
SELECT COUNT(*) AS adt_without_pv1
FROM ${t}
WHERE ${c} LIKE '%ADT^A%' AND ${c} NOT LIKE '%PV1|%';

-- 4. Discharge before admit (string-compare YYYYMMDDHHMMSS — verify locally)
-- Tip: for row-level precision, land messages with HIT HL7 SQL Builder first,
-- then compare AdmitDateTime < DischargeDateTime on the parsed mart.`;
  }
  if (cfg.platform === "postgres") {
    return `${header}
-- 1. Messages missing a patient identifier (PID-3 blank)
SELECT COUNT(*) AS missing_pid3
FROM ${t}
WHERE position('PID|' IN ${c}) = 0 OR ${c} LIKE '%PID||||%';

-- 2. Exact-duplicate raw messages (probable MSH-10 resends)
SELECT LEFT(${c}, 120) AS sample_message, COUNT(*) AS occurrences
FROM ${t} GROUP BY 1 HAVING COUNT(*) > 1;

-- 3. ADT messages with no PV1 segment
SELECT COUNT(*) AS adt_without_pv1
FROM ${t}
WHERE ${c} LIKE '%ADT^A%' AND position('PV1|' IN ${c}) = 0;

-- 4. Discharge before admit: land with HIT HL7 SQL Builder, then compare
-- parsed AdmitDateTime < DischargeDateTime on the mart.`;
  }
  return `${header}
-- 1. Messages missing a patient identifier (PID-3 blank)
SELECT COUNT(*) AS missing_pid3
FROM ${t}
WHERE LOCATE('PID|', ${c}) = 0 OR ${c} LIKE '%PID||||%';

-- 2. Exact-duplicate raw messages (probable MSH-10 resends)
SELECT LEFT(${c}, 120) AS sample_message, COUNT(*) AS occurrences
FROM ${t} GROUP BY 1 HAVING COUNT(*) > 1;

-- 3. ADT messages with no PV1 segment
SELECT COUNT(*) AS adt_without_pv1
FROM ${t}
WHERE ${c} LIKE '%ADT^A%' AND LOCATE('PV1|', ${c}) = 0;

-- 4. Discharge before admit: land with HIT HL7 SQL Builder, then compare
-- parsed AdmitDateTime < DischargeDateTime on the mart.`;
}

function buildReport(score: number, messageCount: number, issues: Issue[]): string {
  const by = (s: string) => issues.filter((i) => i.severity === s);
  const lines = [
    "# HL7 Feed Quality Report (HIT Auditor)",
    "",
    `- Messages audited: ${messageCount}`,
    `- Health score: ${score}/100`,
    `- Blockers: ${by("Blocker").length} | Warnings: ${by("Warning").length} | Info: ${by("Info").length}`,
    "",
    "## Issues (fix at source, in this order)",
  ];
  issues.forEach((i) => lines.push(`- [${i.severity}] msg #${i.messageIndex} — ${i.rule}: ${i.detail}`));
  if (!issues.length) lines.push("- No issues found. Feed is clean for this rule set.");
  return lines.join("\n");
}

function downloadBlob(filename: string, content: string, type = "text/plain") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

const SEV_CLASS: Record<Severity, "default" | "secondary" | "destructive" | "outline"> = {
  Blocker: "destructive",
  Warning: "secondary",
  Info: "outline",
};

export default function Hl7DataQualityAuditor() {
  usePageMeta("/hl7-data-quality-auditor");
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [input, setInput] = useState(
    [V2_FHIR_SAMPLES[0], V2_FHIR_SAMPLES[4]].map((s) => s.message).join("\n")
  );
  const [table, setTable] = useState("RawHl7");
  const [column, setColumn] = useState("MessageText");
  const [platform, setPlatform] = useState<Platform>("sqlserver");

  const audit = useMemo(() => auditText(input), [input]);
  const sql = useMemo(() => buildAuditSql({ table: table || "RawHl7", column: column || "MessageText", platform }), [table, column, platform]);
  const report = useMemo(() => buildReport(audit.score, audit.messageCount, audit.issues), [audit]);

  const copy = (text: string, msg: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied", description: msg });
  };

  return (
    <div className="bg-neutral-50 min-h-[calc(100vh-4rem)]">
      <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <Button variant="ghost" size="sm" className="mb-6 text-gray-500" onClick={() => setLocation("/resources")}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Resources
        </Button>

        <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-primary/10 rounded-lg"><ClipboardCheck className="w-7 h-7 text-primary" /></div>
              <div>
                <h1 className="text-3xl font-extrabold text-gray-900">HL7 Data-Quality Auditor</h1>
                <p className="text-lg text-primary font-medium">Fix the feed before you trust the dashboard.</p>
              </div>
            </div>
            <p className="mt-3 text-gray-600 max-w-3xl">
              Paste up to 50 synthetic messages for an instant health score, or generate read-only
              audit SQL for your own database. 100% local — nothing is uploaded.
            </p>
            <div className="flex flex-wrap gap-2 mt-4">
              <Badge variant={audit.score >= 90 ? "secondary" : audit.score >= 70 ? "outline" : "destructive"} className="text-sm">
                Score: {audit.score}/100
              </Badge>
              <Badge variant="secondary">{audit.messageCount} message(s)</Badge>
              <Badge variant="secondary">{audit.issues.filter((i) => i.severity === "Blocker").length} blockers</Badge>
              <Badge variant="secondary"><ShieldCheck className="w-3 h-3 mr-1" /> Synthetic data only</Badge>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button size="lg" variant="outline" onClick={() => copy(report, "Audit report copied.")}>
              <Copy className="w-5 h-5 mr-2" /> Copy report
            </Button>
            <Button size="lg" onClick={() => { downloadBlob("hl7-quality-report.md", report); toast({ title: "Download started", description: "hl7-quality-report.md" }); }}>
              <Download className="w-5 h-5 mr-2" /> Report
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {V2_FHIR_SAMPLES.map((s) => (
            <Button key={s.id} variant="outline" size="sm" onClick={() => setInput(s.message)} title={s.description}>
              {s.label}
            </Button>
          ))}
          <Button variant="outline" size="sm" onClick={() => setInput([V2_FHIR_SAMPLES[0], V2_FHIR_SAMPLES[4]].map((s) => s.message).join("\n"))}>
            Clean + problem pair
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">1 · Paste messages (max 50, synthetic only)</CardTitle>
            </CardHeader>
            <CardContent>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                spellCheck={false}
                rows={16}
                className="w-full rounded border bg-slate-950 p-3 font-mono text-[11px] leading-relaxed text-slate-100"
              />
              <p className="mt-2 text-xs text-gray-500">
                Scoring: Blocker −10 · Warning −3 · Info −1. Every deduction links to a rule below.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">2 · Issues ({audit.issues.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[380px] pr-2">
                <div className="space-y-2">
                  {audit.issues.map((issue, i) => (
                    <div key={i} className="p-2.5 border rounded-lg text-sm">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant={SEV_CLASS[issue.severity]} className="text-[10px">{issue.severity}</Badge>
                        <span className="text-xs font-semibold text-gray-900">{issue.rule}</span>
                        <span className="text-[10px] text-gray-400 ml-auto">msg #{issue.messageIndex}</span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">{issue.detail}</p>
                    </div>
                  ))}
                  {!audit.issues.length && <p className="text-sm text-gray-500">No issues found. Feed is clean for this rule set.</p>}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">3 · Run it nightly in your database (read-only SQL)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              <div>
                <Label htmlFor="dq-table">Table</Label>
                <Input id="dq-table" value={table} onChange={(e) => setTable(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="dq-col">RAW message column</Label>
                <Input id="dq-col" value={column} onChange={(e) => setColumn(e.target.value)} />
              </div>
              <div>
                <Label>Platform</Label>
                <Select value={platform} onValueChange={(v) => setPlatform(v as Platform)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sqlserver">SQL Server</SelectItem>
                    <SelectItem value="postgres">PostgreSQL</SelectItem>
                    <SelectItem value="mysql">MySQL 8</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <ScrollArea className="h-56 rounded border bg-slate-950 p-3">
              <pre className="text-[11px] leading-relaxed text-slate-100 whitespace-pre-wrap font-mono">{sql}</pre>
            </ScrollArea>
            <div className="flex gap-2 mt-3">
              <Button variant="outline" size="sm" onClick={() => copy(sql, "Audit SQL copied.")}>
                <Copy className="h-3 w-3 mr-1" /> Copy SQL
              </Button>
              <Button variant="outline" size="sm" onClick={() => { downloadBlob(`hl7-audit-${platform}.sql`, sql); toast({ title: "Download started", description: `hl7-audit-${platform}.sql` }); }}>
                <Download className="h-3 w-3 mr-1" /> Download .sql
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
