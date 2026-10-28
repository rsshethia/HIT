import { useMemo, useState } from "react";
import { usePageMeta } from "@/hooks/use-page-meta";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { ArrowLeft, Copy, Download, FileCheck2, ShieldCheck, TriangleAlert } from "lucide-react";
import { V2_FHIR_SAMPLES } from "@/data/v2-to-fhir-samples";
import { comp, firstSegment, getField, parseDTM, parseMessage } from "@/lib/hl7-parse";

// Single source for CMS dates — update here and the whole page + plan follow.
const DEADLINES = [
  { date: "2026-01-01", label: "72-hour urgent / 7-day standard decision clocks in force" },
  { date: "2026-01-01", label: "Patient, Provider, and Payer-to-Payer FHIR APIs live" },
  { date: "2027-01-01", label: "Electronic Prior Authorization (ePA) FHIR APIs live" },
] as const;

type Answer = "yes" | "partial" | "no";

interface Question {
  id: string;
  group: string;
  text: string;
  why: string;
  fix: string;
}

const QUESTIONS: Question[] = [
  { id: "api-patient", group: "FHIR APIs", text: "Can patients access records via a FHIR Patient Access API?", why: "CMS requires payer Patient Access APIs on FHIR.", fix: "Ask your EHR/payer vendor for the Patient Access API endpoint + docs." },
  { id: "api-provider", group: "FHIR APIs", text: "Can providers pull member data via a FHIR Provider Access API?", why: "Avoids fax rework; required data flow.", fix: "Enable Provider Access API scopes; map bulk-export schedule." },
  { id: "api-payer", group: "FHIR APIs", text: "Is Payer-to-Payer exchange active for new members?", why: "Claims + prior-auth history must follow the member.", fix: "Join a TEFCA/QHIN-adjacent exchange or point-to-point FHIR with top payers." },
  { id: "r4", group: "FHIR APIs", text: "Are your FHIR endpoints on R4 with US Core profiles?", why: "R4 + US Core is the compliance baseline.", fix: "Audit CapabilityStatement; use the HIT V2→FHIR Converter to spot gaps." },
  { id: "coding", group: "Data readiness", text: "Are diagnoses coded (ICD-10) and meds coded (RxNorm) at order time?", why: "AI-assisted payer review auto-denies uncoded orders.", fix: "Turn on order-time coding checks in the EHR." },
  { id: "docs", group: "Data readiness", text: "Is medical-necessity documentation attached to every PA order?", why: "#1 denial reason is missing documentation, not wrong care.", fix: "Add a required documentation checklist to the order screen." },
  { id: "zcodes", group: "Data readiness", text: "Are SDOH Z-codes captured when relevant (Z55–Z65)?", why: "USCDI v3 expects SDOH data; supports necessity narrative.", fix: "Add Z-code pick-list to screening workflows." },
  { id: "feed", group: "Data readiness", text: "Did your HL7 feed pass a quality audit in the last 90 days?", why: "Bad feeds corrupt every downstream FHIR resource.", fix: "Run the HIT Data-Quality Auditor and clear Blockers." },
  { id: "crd", group: "Workflow (Da Vinci)", text: "Do you know at order time whether PA is needed (CRD)?", why: "Coverage Requirements Discovery stops doomed orders early.", fix: "Pilot CRD hooks for your top-5 PA procedures." },
  { id: "dtr", group: "Workflow (Da Vinci)", text: "Can staff assemble payer requirements digitally (DTR)?", why: "Documentation Templates & Rules auto-build the packet.", fix: "Map one payer's questionnaire into a DTR template." },
  { id: "pas", group: "Workflow (Da Vinci)", text: "Can you submit PA electronically (PAS) instead of fax/portal?", why: "PAS over FHIR is the end-state submission path.", fix: "Ask your clearinghouse/RCM vendor for PAS timelines." },
  { id: "owner", group: "Workflow (Da Vinci)", text: "Is there a named owner + clock tracker for 72hr/7-day turnarounds?", why: "Deadlines are now legal clocks, not goals.", fix: "Assign ownership and a daily PA-aging huddle." },
];

const GROUPS = ["FHIR APIs", "Data readiness", "Workflow (Da Vinci)"];

function buildClaimSkeleton(bundleHint: { patient: string; encounter: string; diagnosis: string } | null): string {
  const claim = {
    resourceType: "Claim",
    _synthetic: true,
    status: "active",
    use: "preauthorization",
    meta: { profile: ["http://hl7.org/fhir/us/davinci-pas/StructureDefinition/profile-claim"] },
    patient: { reference: "Patient/patient-1", display: bundleHint?.patient ?? "SAMPLE PATIENT — replace" },
    ...(bundleHint?.encounter ? { encounter: [{ reference: "Encounter/encounter-1", display: bundleHint.encounter }] } : {}),
    created: new Date().toISOString().slice(0, 10),
    provider: { display: "SAMPLE PROVIDER — replace" },
    priority: { coding: [{ system: "http://terminology.hl7.org/CodeSystem/processpriority", code: "normal" }] },
    ...(bundleHint?.diagnosis
      ? { diagnosis: [{ sequence: 1, diagnosisCodeableConcept: { text: bundleHint.diagnosis } }] }
      : { diagnosis: [{ sequence: 1, diagnosisCodeableConcept: { text: "SAMPLE DIAGNOSIS — replace with coded ICD-10" } }] }),
    supportingInfo: [{ sequence: 1, category: { text: "medical necessity documentation — attach" } }],
    item: [{ sequence: 1, productOrService: { text: "SAMPLE PROCEDURE — replace with CPT/HCPCS" } }],
  };
  return JSON.stringify(claim, null, 2);
}

function hintFromV2(v2: string): { patient: string; encounter: string; diagnosis: string } | null {
  try {
    const msg = parseMessage(v2);
    const pid = firstSegment(msg, "PID");
    const pv1 = firstSegment(msg, "PV1");
    const dg1 = firstSegment(msg, "DG1");
    if (!pid) return null;
    const name = `${comp(getField(pid, 5), 2)} ${comp(getField(pid, 5), 1)}`.trim();
    const mrn = comp(getField(pid, 3), 1);
    const visit = comp(getField(pv1, 19), 1);
    const admit = parseDTM(getField(pv1, 44)) ?? "";
    const dx = comp(getField(dg1, 3), 2) || comp(getField(dg1, 3), 1);
    return {
      patient: [name, mrn ? `(MRN ${mrn})` : ""].filter(Boolean).join(" ") || "SAMPLE PATIENT",
      encounter: [visit, admit].filter(Boolean).join(" / "),
      diagnosis: dx,
    };
  } catch {
    return null;
  }
}

function downloadBlob(filename: string, content: string, type = "text/plain") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function PriorAuthReadiness() {
  usePageMeta("/prior-auth-readiness");
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [v2, setV2] = useState("");

  const answered = Object.keys(answers).length;
  const score = useMemo(() => {
    let pts = 0;
    QUESTIONS.forEach((q) => {
      const a = answers[q.id];
      if (a === "yes") pts += 2;
      else if (a === "partial") pts += 1;
    });
    return Math.round((pts / (QUESTIONS.length * 2)) * 100);
  }, [answers]);

  const band = score >= 80 ? "Ready" : score >= 40 ? "Progressing" : "Not started";
  const hint = useMemo(() => (v2.trim() ? hintFromV2(v2) : null), [v2]);
  const claim = useMemo(() => buildClaimSkeleton(hint), [hint]);

  const plan = useMemo(() => {
    const lines = [
      "# Prior-Auth Readiness Action Plan (HIT — educational, not legal advice)",
      "",
      `Score: ${score}/100 — ${band} (${answered}/${QUESTIONS.length} answered)`,
      "",
      "## CMS deadlines",
      ...DEADLINES.map((d) => `- ${d.date}: ${d.label}`),
      "",
      "## Gaps, in fix order (No/Partial first)",
    ];
    const ranked = [...QUESTIONS].sort((a, b) => {
      const w = (id: string) => (answers[id] === "yes" ? 2 : answers[id] === "partial" ? 1 : 0);
      return w(a.id) - w(b.id);
    });
    ranked.forEach((q) => {
      const a = answers[q.id] ?? "unanswered";
      lines.push(`- [${a.toUpperCase()}] ${q.text} Fix: ${q.fix}`);
    });
    lines.push(
      "",
      "## Sample Da Vinci PAS Claim skeleton",
      "SAMPLE — DO NOT SUBMIT. Synthetic elements marked _synthetic. Replace every SAMPLE value with coded data.",
      "```json",
      claim,
      "```",
      "",
      "Educational readiness aid only — not legal or compliance advice. Confirm with counsel and CMS guidance: https://www.cms.gov/priorities/electronic-prior-authorization"
    );
    return lines.join("\n");
  }, [answers, answered, score, band, claim]);

  const set = (id: string, v: Answer) => setAnswers((s) => ({ ...s, [id]: v }));
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
              <div className="p-2 bg-primary/10 rounded-lg"><FileCheck2 className="w-7 h-7 text-primary" /></div>
              <div>
                <h1 className="text-3xl font-extrabold text-gray-900">Prior-Auth Readiness Checker</h1>
                <p className="text-lg text-primary font-medium">72 hours. 7 days. Are you ready?</p>
              </div>
            </div>
            <p className="mt-3 text-gray-600 max-w-3xl">
              Twelve questions across FHIR APIs, data readiness, and Da Vinci workflow. Get a score,
              a deadline-mapped action plan, and a sample PAS Claim skeleton. Educational aid — not legal advice.
            </p>
            <div className="flex flex-wrap gap-2 mt-4">
              <Badge variant={score >= 80 ? "secondary" : score >= 40 ? "outline" : "destructive"} className="text-sm">
                {score}/100 — {band}
              </Badge>
              <Badge variant="secondary"><ShieldCheck className="w-3 h-3 mr-1" /> 100% client-side</Badge>
              {DEADLINES.map((d) => (
                <Badge key={d.label} variant="outline" className="text-[10px]">{d.date}</Badge>
              ))}
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button size="lg" variant="outline" onClick={() => copy(plan, "Action plan copied.")}>
              <Copy className="w-5 h-5 mr-2" /> Copy plan
            </Button>
            <Button size="lg" onClick={() => { downloadBlob("prior-auth-action-plan.md", plan); toast({ title: "Download started", description: "prior-auth-action-plan.md" }); }}>
              <Download className="w-5 h-5 mr-2" /> Plan
            </Button>
          </div>
        </div>

        <Card className="mb-6 border-amber-200 bg-amber-50">
          <CardContent className="pt-4 text-xs text-amber-900 flex gap-2">
            <TriangleAlert className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              Educational readiness aid only — not legal or compliance advice. Deadlines: 72-hour urgent /
              7-day standard clocks and FHIR APIs from 2026-01-01; ePA APIs from 2027-01-01.
              Confirm against current CMS guidance before acting.
            </span>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            {GROUPS.map((g) => (
              <Card key={g}>
                <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">{g}</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {QUESTIONS.filter((q) => q.group === g).map((q) => (
                    <div key={q.id} className="p-3 border rounded-lg">
                      <p className="text-sm font-medium text-gray-900">{q.text}</p>
                      <p className="text-xs text-gray-500 mt-1">{q.why}</p>
                      <div className="flex gap-2 mt-2">
                        {(["yes", "partial", "no"] as Answer[]).map((v) => (
                          <Button
                            key={v}
                            size="sm"
                            variant={answers[q.id] === v ? "default" : "outline"}
                            onClick={() => set(q.id, v)}
                          >
                            {v === "yes" ? "Yes" : v === "partial" ? "Partial" : "No"}
                          </Button>
                        ))}
                      </div>
                      {answers[q.id] !== "yes" && (
                        <p className="text-xs text-gray-600 mt-2"><strong>Fix:</strong> {q.fix}</p>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Optional · Paste ADT to prefill the sample Claim</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 mb-2">
                  <Button variant="outline" size="sm" onClick={() => setV2(V2_FHIR_SAMPLES[3].message)}>
                    Load discharge sample
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setV2("")}>Clear</Button>
                </div>
                <textarea
                  value={v2}
                  onChange={(e) => setV2(e.target.value)}
                  spellCheck={false}
                  rows={7}
                  placeholder="Paste a SYNTHETIC ADT message (optional)…"
                  className="w-full rounded border bg-slate-950 p-3 font-mono text-[11px] leading-relaxed text-slate-100"
                />
                {v2.trim() && !hint && <p className="text-xs text-red-600 mt-1">Could not parse — include a full message starting with MSH.</p>}
                {hint && <p className="text-xs text-green-700 mt-1">Parsed: {hint.patient} · {hint.encounter} · Dx: {hint.diagnosis || "—"}</p>}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center justify-between">
                  <span>Sample PAS Claim skeleton (SAMPLE — DO NOT SUBMIT)</span>
                  <Button variant="outline" size="sm" onClick={() => copy(claim, "Claim skeleton copied.")}>
                    <Copy className="h-3 w-3 mr-1" /> Copy
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[420px] rounded border bg-slate-950 p-3">
                  <pre className="text-[11px] leading-relaxed text-slate-100 whitespace-pre-wrap font-mono">{claim}</pre>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
