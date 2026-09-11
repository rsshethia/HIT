import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  ArrowLeft, Copy, Download, BedDouble, ShieldAlert, Database,
  Clock, TriangleAlert, FlaskConical,
} from "lucide-react";
import {
  DEFAULT_WARD_CONFIG, WARD_QUESTIONS, WARD_FIXTURES,
  buildAllWardSql, buildMartSql, buildQuestionSql,
  buildRefreshJob, buildTriggerSql,
  type WardConfig, type WardPlatform,
} from "@/data/ward-analytics-templates";

function downloadBlob(filename: string, content: string, type = "text/plain") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function ScriptBlock({ title, script, filename, onCopy }: { title: string; script: string; filename: string; onCopy: (t: string) => void }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center justify-between gap-2">
          <span>{title}</span>
          <span className="flex gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={() => onCopy(script)}>
              <Copy className="h-3 w-3 mr-1" /> Copy
            </Button>
            <Button variant="outline" size="sm" onClick={() => downloadBlob(filename, script)}>
              <Download className="h-3 w-3 mr-1" /> {filename}
            </Button>
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-56 rounded border bg-slate-950 p-3">
          <pre className="text-[11px] leading-relaxed text-slate-100 whitespace-pre-wrap font-mono">{script}</pre>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

const GROUPS = ["Flow & capacity", "People", "Throughput & discharge"] as const;

export default function HL7WardAnalytics() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [cfg, setCfg] = useState<WardConfig>(DEFAULT_WARD_CONFIG);
  const [selected, setSelected] = useState<string[]>(["los", "census", "age", "beforenoon"]);

  const copy = (text: string, msg = "Copied to clipboard.") => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied", description: msg });
  };

  const toggle = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const num = (v: string, min: number, fb: number) => {
    const n = parseInt(v, 10);
    return Number.isFinite(n) && n >= min ? n : fb;
  };

  const mart = useMemo(() => buildMartSql(cfg), [cfg]);
  const job = useMemo(() => buildRefreshJob(cfg), [cfg]);
  const trigger = useMemo(() => buildTriggerSql(cfg), [cfg]);
  const all = useMemo(() => buildAllWardSql(cfg, selected), [cfg, selected]);

  const downloadAll = () => {
    downloadBlob(`ward-analytics-${cfg.platform}.sql`, all);
    toast({ title: "Download started", description: "Foundation mart + selected questions." });
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
              <div className="p-2 bg-primary/10 rounded-lg"><BedDouble className="w-7 h-7 text-primary" /></div>
              <div>
                <h1 className="text-3xl font-extrabold text-gray-900">Ward Analytics: PID × PV1</h1>
                <p className="text-lg text-primary font-medium">Twelve copy-paste answers from your RAW HL7.</p>
              </div>
            </div>
            <p className="mt-3 text-gray-600 max-w-3xl">
              Pick the questions, point at your RAW HL7 table, run locally. One foundation mart is parsed once;
              every question is a thin view on top. Freshness comes from a scheduled refresh every 5–15 minutes —
              never analytics inside a trigger.
            </p>
            <div className="flex flex-wrap gap-2 mt-4">
              <Badge variant="secondary">SQL Server + PostgreSQL + MySQL 8</Badge>
              <Badge variant="secondary"><Database className="w-3 h-3 mr-1" /> 1 mart + N views</Badge>
              <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" /> Scheduled refresh</Badge>
              <Badge variant="outline"><ShieldAlert className="w-3 h-3 mr-1" /> Row-level scripts are identified data</Badge>
            </div>
          </div>
          <Button size="lg" onClick={downloadAll} className="shrink-0 shadow-md" disabled={selected.length === 0}>
            <Download className="w-5 h-5 mr-2" /> Download selected SQL
          </Button>
        </div>

        <Card className="mb-6 border-amber-300">
          <CardContent className="pt-4 text-sm text-gray-700 flex gap-2">
            <TriangleAlert className="w-4 h-4 mt-0.5 shrink-0 text-amber-600" />
            <span><strong>Step 0 — parse layer required.</strong> These scripts call <code className="font-mono text-xs bg-gray-100 px-1 rounded">fn_GetHL7Field</code>.
            Don&apos;t have it? Generate it in <button className="text-primary hover:underline" onClick={() => setLocation("/hl7-sql-builder")}>HL7 SQL Builder</button>, run that first, then come back.</span>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader><CardTitle className="text-base">1. Configure your environment (scripts update live)</CardTitle></CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-4">
            <div>
              <Label className="text-xs">Platform</Label>
              <Select value={cfg.platform} onValueChange={(v) => setCfg({ ...cfg, platform: v as WardPlatform })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="sqlserver">SQL Server</SelectItem>
                  <SelectItem value="postgresql">PostgreSQL</SelectItem>
                  <SelectItem value="mysql">MySQL 8 (views + events)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Mart schema (ignored on MySQL)</Label>
              <Input value={cfg.martSchema} onChange={(e) => setCfg({ ...cfg, martSchema: e.target.value || "mart" })} />
            </div>
            <div>
              <Label className="text-xs">RAW HL7 table</Label>
              <Input value={cfg.sourceTable} onChange={(e) => setCfg({ ...cfg, sourceTable: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs">Message column / ID column</Label>
              <div className="flex gap-2">
                <Input value={cfg.sourceColumn} onChange={(e) => setCfg({ ...cfg, sourceColumn: e.target.value })} />
                <Input value={cfg.idColumn} onChange={(e) => setCfg({ ...cfg, idColumn: e.target.value })} />
              </div>
            </div>
            <div>
              <Label className="text-xs">PV1-3: ward ^ room ^ bed positions</Label>
              <div className="flex gap-2">
                <Input type="number" min={1} max={6} value={cfg.locWard} onChange={(e) => setCfg({ ...cfg, locWard: num(e.target.value, 1, 1) })} />
                <Input type="number" min={1} max={6} value={cfg.locRoom} onChange={(e) => setCfg({ ...cfg, locRoom: num(e.target.value, 1, 2) })} />
                <Input type="number" min={1} max={6} value={cfg.locBed} onChange={(e) => setCfg({ ...cfg, locBed: num(e.target.value, 1, 3) })} />
              </div>
            </div>
            <div>
              <Label className="text-xs">Business hours (start–end)</Label>
              <div className="flex gap-2">
                <Input type="number" min={0} max={23} value={cfg.dayStartHour} onChange={(e) => setCfg({ ...cfg, dayStartHour: num(e.target.value, 0, 8) })} />
                <Input type="number" min={0} max={23} value={cfg.dayEndHour} onChange={(e) => setCfg({ ...cfg, dayEndHour: num(e.target.value, 0, 18) })} />
              </div>
            </div>
            <div>
              <Label className="text-xs">Readmit window (days)</Label>
              <Input type="number" min={1} max={90} value={cfg.readmitDays} onChange={(e) => setCfg({ ...cfg, readmitDays: num(e.target.value, 1, 28) })} />
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader><CardTitle className="text-base">2. Pick your questions ({selected.length} selected)</CardTitle></CardHeader>
          <CardContent className="space-y-5">
            {GROUPS.map((g) => (
              <div key={g}>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">{g}</p>
                <div className="grid gap-3 md:grid-cols-2">
                  {WARD_QUESTIONS.filter((q) => q.group === g).map((q) => (
                    <label key={q.id} className={`flex gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${selected.includes(q.id) ? "border-primary bg-primary-50/50" : "hover:bg-gray-50"}`}>
                      <Checkbox checked={selected.includes(q.id)} onCheckedChange={() => toggle(q.id)} className="mt-1" />
                      <span>
                        <span className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium text-gray-900">{q.question}</span>
                          <Badge variant={q.kind === "Row-level" ? "destructive" : "secondary"} className="text-[10px]">{q.kind}</Badge>
                        </span>
                        <span className="block text-xs text-gray-500 mt-1">{q.why}</span>
                        <span className="block text-[11px] text-gray-400 mt-1 font-mono">{q.fields}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="grid gap-6">
          <ScriptBlock title="Step 1 — Foundation mart (parse once, idempotent)" script={mart} filename={`00_ward-mart-${cfg.platform}.sql`} onCopy={copy} />
          {selected.map((qid) => {
            const q = WARD_QUESTIONS.find((x) => x.id === qid)!;
            return (
              <ScriptBlock
                key={qid}
                title={`Q: ${q.question} [${q.kind}]`}
                script={`-- ${q.why}\n-- Grain: ${q.grain}\n${buildQuestionSql(cfg, qid)}`}
                filename={`q_${qid}-${cfg.platform}.sql`}
                onCopy={copy}
              />
            );
          })}
          <ScriptBlock title="Freshness — scheduled refresh (primary mechanism)" script={job} filename={`refresh-job-${cfg.platform}.sql`} onCopy={copy} />
          <ScriptBlock title="Freshness — enqueue-only trigger (optional, never analytics inline)" script={trigger} filename={`trigger-enqueue-${cfg.platform}.sql`} onCopy={copy} />

          <Card>
            <CardHeader><CardTitle className="text-sm font-semibold flex items-center gap-2"><FlaskConical className="w-4 h-4" /> Worked fixture journey (sanity-check your install)</CardTitle></CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-600 space-y-1.5">
                {WARD_FIXTURES.map((fx) => (
                  <li key={fx.label} className="flex gap-2">
                    <Badge variant="outline" className="text-[10px] shrink-0 font-mono">{fx.type}</Badge>
                    <span>{fx.label}{fx.los_days !== null && fx.los_days !== undefined ? ` → LOS ≈ ${fx.los_days} days` : ""}</span>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-gray-500 mt-3">Load these five messages, run the mart + Q1/Q9: expect one 5-day stay (4W→5E) and one 28-day-window return for MRN 1001.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
