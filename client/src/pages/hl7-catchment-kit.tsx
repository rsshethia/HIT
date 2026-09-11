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
  ArrowLeft, Copy, Download, MapPin, ShieldCheck, Database,
  Play, FileText, Link2, CheckCircle2,
} from "lucide-react";
import {
  DEFAULT_GEOKIT_CONFIG,
  GNAF_LINKS, ASGS_LINKS,
  buildAllInOneSql, buildCreateTablesSql, buildLoaderPs1,
  buildPrereqSql, buildProcSql, buildReadme, buildVerifySql,
  buildSampleGnafCsv, buildSampleMbCsv, buildSamplePostcodeCsv,
  normalizeKeyJs, type GeoKitConfig, type GeoKitInputMode,
} from "@/data/geokit-templates";

const ALL_STATES = ["NSW", "VIC", "QLD", "SA", "WA", "TAS", "NT", "ACT"];

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
        <CardTitle className="text-sm font-semibold flex items-center justify-between">
          <span>{title}</span>
          <span className="flex gap-2">
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

export default function HL7CatchmentKit() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [cfg, setCfg] = useState<GeoKitConfig>(DEFAULT_GEOKIT_CONFIG);
  const [trial, setTrial] = useState({ num: "182", street: "Church St", suburb: "Parramatta", state: "NSW", postcode: "2150" });

  const copy = (text: string, msg = "Copied to clipboard.") => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied", description: msg });
  };

  const toggleState = (s: string) =>
    setCfg((c) => ({
      ...c,
      states: c.states.includes(s) ? c.states.filter((x) => x !== s) : [...c.states, s],
    }));

  const prereq = useMemo(() => buildPrereqSql(cfg), [cfg]);
  const tables = useMemo(() => buildCreateTablesSql(cfg), [cfg]);
  const proc = useMemo(() => buildProcSql(cfg), [cfg]);
  const verify = useMemo(() => buildVerifySql(cfg), [cfg]);
  const loader = useMemo(() => buildLoaderPs1(cfg), [cfg]);
  const readme = useMemo(() => buildReadme(cfg), [cfg]);
  const allInOne = useMemo(() => buildAllInOneSql(cfg), [cfg]);
  const sampleGnaf = useMemo(() => buildSampleGnafCsv(cfg), [cfg]);
  const sampleMb = useMemo(() => buildSampleMbCsv(cfg), [cfg]);
  const samplePc = useMemo(() => buildSamplePostcodeCsv(cfg), [cfg]);
  const trialKey = useMemo(() => normalizeKeyJs(trial), [trial]);

  const downloadAll = () => {
    downloadBlob("geokit-sa2-all.sql", allInOne);
    toast({ title: "Download started", description: "geokit-sa2-all.sql — run sections in order 01→05." });
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
              <div className="p-2 bg-primary/10 rounded-lg"><MapPin className="w-7 h-7 text-primary" /></div>
              <div>
                <h1 className="text-3xl font-extrabold text-gray-900">Catchment Kit: PID-11 → SA2</h1>
                <p className="text-lg text-primary font-medium">Address in, boundary out — inside your SQL Server.</p>
              </div>
            </div>
            <p className="mt-3 text-gray-600 max-w-3xl">
              For DBAs with permission to add a table. Turns patient street address into SA2 catchment codes
              for maps by service, visit type, or attending doctor — without leaking exact addresses.
              Everything runs <strong>offline</strong>: public G-NAF + ABS tables are imported once per quarter,
              then a stored procedure does local JOINs only. No PHI ever calls an external API.
            </p>
            <div className="flex flex-wrap gap-2 mt-4">
              <Badge variant="secondary">SQL Server 2019+</Badge>
              <Badge variant="secondary"><ShieldCheck className="w-3 h-3 mr-1" /> Offline / PHI stays local</Badge>
              <Badge variant="secondary"><Database className="w-3 h-3 mr-1" /> 3 reference tables + 1 proc</Badge>
              <Badge variant="outline">G-NAF CC-BY 4.0 + ABS attribution required</Badge>
            </div>
          </div>
          <Button size="lg" onClick={downloadAll} className="shrink-0 shadow-md">
            <Download className="w-5 h-5 mr-2" /> Download all SQL
          </Button>
        </div>

        {/* Config */}
        <Card className="mb-6">
          <CardHeader><CardTitle className="text-base">1. Configure your scope (scripts update live)</CardTitle></CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-4">
            <div>
              <Label className="text-xs">Reference schema</Label>
              <Input value={cfg.refSchema} onChange={(e) => setCfg({ ...cfg, refSchema: e.target.value || "ref" })} />
            </div>
            <div>
              <Label className="text-xs">Mart schema (analysts see this)</Label>
              <Input value={cfg.martSchema} onChange={(e) => setCfg({ ...cfg, martSchema: e.target.value || "mart" })} />
            </div>
            <div>
              <Label className="text-xs">RAW HL7 table</Label>
              <Input value={cfg.sourceTable} onChange={(e) => setCfg({ ...cfg, sourceTable: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <Label className="text-xs">ASGS edition</Label>
              <Select value={cfg.asgsEdition} onValueChange={(v) => setCfg({ ...cfg, asgsEdition: v as "2021" | "2026" })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="2026">2026 (Ed.4, latest)</SelectItem>
                  <SelectItem value="2021">2021 (Ed.3, stable)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Label className="text-xs">G-NAF input mode</Label>
              <Select value={cfg.inputMode} onValueChange={(v) => setCfg({ ...cfg, inputMode: v as GeoKitInputMode })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Auto">Auto-detect (file or folder)</SelectItem>
                  <SelectItem value="National">National PSV (single file)</SelectItem>
                  <SelectItem value="PerState">Per-state files (folder)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-4">
              <Label className="text-xs">States to load (fewer = smaller download; start with one)</Label>
              <div className="flex flex-wrap gap-3 mt-2">
                {ALL_STATES.map((s) => (
                  <label key={s} className="flex items-center gap-1.5 text-sm">
                    <Checkbox checked={cfg.states.includes(s)} onCheckedChange={() => toggleState(s)} /> {s}
                  </label>
                ))}
              </div>
            </div>
            <div className="md:col-span-4">
              <Label className="text-xs">G-NAF path (file for National, folder for PerState — passed as -GnafPath)</Label>
              <Input placeholder="C:\GeoKit\GNAF_CORE.psv  or  C:\GeoKit\gnaf-states" value={cfg.gnafPath} onChange={(e) => setCfg({ ...cfg, gnafPath: e.target.value })} />
            </div>
          </CardContent>
        </Card>
        <Card className="mb-6 border-primary/30">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Play className="w-4 h-4" /> 30-second trial — normalization preview (no database needed)</CardTitle></CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-5">
              {(["num", "street", "suburb", "state", "postcode"] as const).map((k) => (
                <div key={k}>
                  <Label className="text-xs capitalize">{k}</Label>
                  <Input value={trial[k]} onChange={(e) => setTrial({ ...trial, [k]: e.target.value })} />
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-2 text-sm">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <span className="text-gray-500">ADDRESS_KEY that SQL will match:</span>
              <code className="bg-slate-950 text-slate-100 px-2 py-1 rounded font-mono text-xs">{trialKey}</code>
              <Button variant="outline" size="sm" onClick={() => copy(trialKey, "ADDRESS_KEY copied.")}><Copy className="h-3 w-3 mr-1" /> Copy</Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6">
          <ScriptBlock title="Step 1 — Pre-req check (30 sec, read-only)" script={prereq} filename="01_prereq-check.sql" onCopy={copy} />
          <ScriptBlock title="Step 2 — Create tables (ref + de-identified mart)" script={tables} filename="02_create-tables.sql" onCopy={copy} />

          <Card>
            <CardHeader><CardTitle className="text-sm font-semibold">Step 3 — Reference data (the only big download; public data in, never PHI out)</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm text-gray-600">
              <div>
                <p className="font-medium text-gray-800">Option A — 5-minute trial (recommended first, ASGS {cfg.asgsEdition} columns):</p>
                <p className="mt-1">The loader reads these lite CSVs directly — validate with <code className="font-mono text-xs bg-gray-100 px-1 rounded">-DryRun</code>, then load for real:</p>
                <code className="block mt-1 font-mono text-[11px] bg-slate-950 text-slate-100 px-2 py-1.5 rounded">.\03_load-reference.ps1 -SqlInstance YOUR-SERVER -Database YOUR-DB -SampleLiteCsv .\sample-GNAF-1000.csv -MbCsv .\sample-MB-to-SA.csv -DryRun</code>
                <div className="flex flex-wrap gap-2 mt-1">
                  <Button variant="outline" size="sm" onClick={() => downloadBlob("sample-GNAF-1000.csv", sampleGnaf, "text/csv")}><Download className="h-3 w-3 mr-1" /> sample-GNAF-1000.csv</Button>
                  <Button variant="outline" size="sm" onClick={() => downloadBlob("sample-MB-to-SA.csv", sampleMb, "text/csv")}><Download className="h-3 w-3 mr-1" /> sample-MB-to-SA.csv</Button>
                  <Button variant="outline" size="sm" onClick={() => downloadBlob("sample-POSTCODE-to-SA2.csv", samplePc, "text/csv")}><Download className="h-3 w-3 mr-1" /> sample-POSTCODE-to-SA2.csv</Button>
                  <Button variant="outline" size="sm" onClick={() => downloadBlob("03_load-reference.ps1", loader)}><Download className="h-3 w-3 mr-1" /> 03_load-reference.ps1</Button>
                </div>
              </div>
              <div>
                <p className="font-medium text-gray-800">Option B — Full quarterly load (overnight, on hospital network):</p>
                <ul className="list-disc ml-5 mt-1 space-y-1">
                  {GNAF_LINKS.map((l) => (<li key={l.url}><a className="text-primary hover:underline" href={l.url} target="_blank" rel="noreferrer">{l.label}</a> — download G-NAF Core GDA2020 {cfg.inputMode === "PerState" ? "and split per state (or point -InputMode PerState at a folder of state files)" : cfg.inputMode === "National" ? "as one national PSV" : "as one national PSV or a folder of state files (auto-detected)"}, keep PRINCIPAL addresses in {cfg.states.join(", ") || "your states"}.</li>))}
                  {ASGS_LINKS.filter((l) => l.label.includes(cfg.asgsEdition)).map((l) => (<li key={l.url}><a className="text-primary hover:underline" href={l.url} target="_blank" rel="noreferrer">{l.label}</a> — download the Mesh Block <strong>allocation .xlsx</strong> and Save As CSV (has MB→SA1/SA2/SA3/SA4 in one row; ignore the 191MB shapefile).</li>))}
                </ul>
                <p className="mt-1 flex items-center gap-1"><Link2 className="w-3 h-3" /> Run <code className="font-mono text-xs bg-gray-100 px-1 rounded">-DryRun</code> first (parses {cfg.inputMode === "PerState" ? "each state file" : "the PSV"} with zero DB writes), then full load. Resume skips loaded states; <code className="font-mono text-xs bg-gray-100 px-1 rounded">-Force</code> reloads.</p>
              </div>
            </CardContent>
          </Card>

          <ScriptBlock title="Step 4 — Normalize function + geocode procedure (writes SA2 only)" script={proc} filename="04_create-proc.sql" onCopy={copy} />
          <ScriptBlock title="Step 5 — Verify + catchment queries (match-rate, by service/doctor)" script={verify} filename="05_verify.sql" onCopy={copy} />

          <Card>
            <CardHeader><CardTitle className="text-sm font-semibold flex items-center gap-2"><FileText className="w-4 h-4" /> DBA hand-off + privacy rules</CardTitle></CardHeader>
            <CardContent>
              <ScrollArea className="h-44 rounded border bg-white p-3">
                <pre className="text-xs whitespace-pre-wrap font-mono text-gray-700">{readme}</pre>
              </ScrollArea>
              <div className="flex flex-wrap gap-2 mt-3">
                <Button variant="outline" size="sm" onClick={() => downloadBlob("README-first-5-minutes.md", readme, "text/markdown")}><Download className="h-3 w-3 mr-1" /> README-first-5-minutes.md</Button>
                <Button variant="outline" size="sm" onClick={() => downloadBlob("03_load-reference.ps1", loader)}><Download className="h-3 w-3 mr-1" /> 03_load-reference.ps1</Button>
                <Button size="sm" onClick={downloadAll}><Download className="h-3 w-3 mr-1" /> all-in-one .sql</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
