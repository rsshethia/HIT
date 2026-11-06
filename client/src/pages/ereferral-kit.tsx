import { useMemo, useState } from "react";
import { usePageMeta } from "@/hooks/use-page-meta";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Link, useLocation } from "wouter";
import { ArrowLeft, Copy, Download, Inbox, ShieldCheck } from "lucide-react";
import {
  QUESTIONS,
  REF_TO_FHIR_MAP,
  SAMPLE_REF,
  buildActionPlan,
  buildReferralSql,
  scoreEreferral,
  type Platform,
} from "@/lib/ereferral";

function downloadBlob(filename: string, content: string, type = "text/plain") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function EreferralKit() {
  usePageMeta("/ereferral-kit");
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const [table, setTable] = useState("Referrals");
  const [platform, setPlatform] = useState<Platform>("sqlserver");

  const { score, gaps } = useMemo(() => scoreEreferral(answers), [answers]);
  const plan = useMemo(() => buildActionPlan(score, gaps), [score, gaps]);
  const sql = useMemo(() => buildReferralSql(table || "Referrals", platform), [table, platform]);
  const answered = Object.keys(answers).length;

  const toggle = (id: string, checked: boolean) =>
    setAnswers((a) => ({ ...a, [id]: checked }));

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
              <div className="p-2 bg-primary/10 rounded-lg"><Inbox className="w-7 h-7 text-primary" /></div>
              <div>
                <h1 className="text-3xl font-extrabold text-gray-900">eReferral Starter Kit</h1>
                <p className="text-lg text-primary font-medium">Stop losing referrals before you digitise them.</p>
              </div>
            </div>
            <p className="mt-3 text-gray-600 max-w-3xl">
              “Forms go missing on a daily basis leaving patients without appointments.” Answer 8
              questions for a readiness score and a fix-in-order action plan — plus a sample REF
              message mapped to FHIR and tracking SQL. 100% local, nothing uploaded.
            </p>
            <div className="flex flex-wrap gap-2 mt-4">
              <Badge variant={score >= 80 ? "secondary" : score >= 50 ? "outline" : "destructive"} className="text-sm">
                Score: {score}/100
              </Badge>
              <Badge variant="secondary">{answered}/{QUESTIONS.length} answered</Badge>
              <Badge variant="secondary">{gaps.length} gap(s)</Badge>
              <Badge variant="secondary"><ShieldCheck className="w-3 h-3 mr-1" /> Synthetic data only</Badge>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button size="lg" variant="outline" onClick={() => copy(plan, "Action plan copied.")}>
              <Copy className="w-5 h-5 mr-2" /> Copy plan
            </Button>
            <Button size="lg" onClick={() => { downloadBlob("ereferral-action-plan.md", plan); toast({ title: "Download started", description: "ereferral-action-plan.md" }); }}>
              <Download className="w-5 h-5 mr-2" /> Plan
            </Button>
          </div>
        </div>

        <Card className="mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">1 · Answer honestly — tick what is true today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {QUESTIONS.map((q) => (
                <label key={q.id} className="flex items-start gap-3 p-3 border rounded-lg bg-white cursor-pointer hover:border-primary/40">
                  <Checkbox
                    checked={!!answers[q.id]}
                    onCheckedChange={(c) => toggle(q.id, c === true)}
                    className="mt-0.5"
                  />
                  <span className="flex-1">
                    <span className="block text-sm text-gray-900">{q.question}</span>
                    {!answers[q.id] && answered > 0 && (
                      <span className="block text-xs text-gray-600 mt-1">
                        Fix: {q.fix}{" "}
                        <Link href={q.toolHref} className="text-primary underline font-medium">{q.toolLabel}</Link>
                      </span>
                    )}
                  </span>
                  <Badge variant="outline" className="text-[10px] shrink-0">+{q.weight}</Badge>
                </label>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">2 · What “good” looks like — REF → FHIR ServiceRequest</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="rounded border bg-slate-950 p-3 mb-3">
                <pre className="text-[11px] leading-relaxed text-slate-100 whitespace-pre-wrap font-mono">{SAMPLE_REF}</pre>
              </ScrollArea>
              <div className="space-y-2">
                {REF_TO_FHIR_MAP.map((r) => (
                  <div key={r.v2} className="p-2.5 border rounded-lg text-sm bg-white">
                    <code className="text-xs font-mono text-primary font-bold">{r.v2}</code>
                    <p className="text-xs text-gray-500 mt-0.5">→ {r.fhir}</p>
                    <p className="text-xs text-gray-800 mt-1">{r.value}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">3 · Track them in your database (read-only SQL)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                <div>
                  <Label htmlFor="ref-table">Referral table</Label>
                  <Input id="ref-table" value={table} onChange={(e) => setTable(e.target.value)} />
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
              <ScrollArea className="h-64 rounded border bg-slate-950 p-3">
                <pre className="text-[11px] leading-relaxed text-slate-100 whitespace-pre-wrap font-mono">{sql}</pre>
              </ScrollArea>
              <div className="flex gap-2 mt-3">
                <Button variant="outline" size="sm" onClick={() => copy(sql, "Tracking SQL copied.")}>
                  <Copy className="h-3 w-3 mr-1" /> Copy SQL
                </Button>
                <Button variant="outline" size="sm" onClick={() => { downloadBlob(`ereferral-tracking-${platform}.sql`, sql); toast({ title: "Download started", description: `ereferral-tracking-${platform}.sql` }); }}>
                  <Download className="h-3 w-3 mr-1" /> Download .sql
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
