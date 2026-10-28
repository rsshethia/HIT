import { useMemo, useState } from "react";
import { usePageMeta } from "@/hooks/use-page-meta";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  ArrowLeft, ArrowRightLeft, Copy, Download, ShieldCheck, TriangleAlert,
} from "lucide-react";
import { V2_FHIR_SAMPLES } from "@/data/v2-to-fhir-samples";
import {
  comp, fhirEncounterClass, fhirGender, firstSegment, getField, getRepeats,
  messageType, parseDTM, parseMessage, segmentsOf, splitMessages,
  type ParsedMessage,
} from "@/lib/hl7-parse";

type Profile = "base" | "us" | "au";

const PROFILES: Record<Profile, { label: string; patient: string; encounter: string; observation: string }> = {
  base: { label: "FHIR R4 Base", patient: "http://hl7.org/fhir/StructureDefinition/Patient", encounter: "http://hl7.org/fhir/StructureDefinition/Encounter", observation: "http://hl7.org/fhir/StructureDefinition/Observation" },
  us: { label: "US Core 6.1", patient: "http://hl7.org/fhir/us/core/StructureDefinition/us-core-patient", encounter: "http://hl7.org/fhir/us/core/StructureDefinition/us-core-encounter", observation: "http://hl7.org/fhir/us/core/StructureDefinition/us-core-observation-lab", },
  au: { label: "AU Core 1.0", patient: "http://hl7.org.au/fhir/core/StructureDefinition/au-core-patient", encounter: "http://hl7.org.au/fhir/core/StructureDefinition/au-core-encounter", observation: "http://hl7.org.au/fhir/core/StructureDefinition/au-core-observation", },
};

interface MapRow { v2: string; fhir: string; value: string; status: "mapped" | "unmapped" | "note"; }

interface ConvertResult {
  bundle: Record<string, unknown>;
  rows: MapRow[];
  unmappedSegments: string[];
  messageType: string;
  error?: string;
}

const HANDLED = new Set(["MSH", "EVN", "PID", "PV1", "OBX", "OBR", "ORC", "DG1", "NK1"]);

function convertOne(msg: ParsedMessage, profile: Profile): ConvertResult {
  const rows: MapRow[] = [];
  const msh = firstSegment(msg, "MSH");
  if (!msh) {
    return { bundle: {}, rows, unmappedSegments: [], messageType: "UNKNOWN", error: "No MSH segment found. Paste a full HL7 message starting with MSH." };
  }
  const mType = messageType(msg);
  const prof = PROFILES[profile];
  const pid = firstSegment(msg, "PID");
  const pv1 = firstSegment(msg, "PV1");
  const resources: Record<string, unknown>[] = [];

  // --- Patient from PID ---
  const pid3 = getRepeats(pid, 3);
  const identifiers = pid3
    .map((rep) => ({ value: comp(rep, 1), type: comp(rep, 5) || comp(rep, 2), system: comp(rep, 4) }))
    .filter((i) => i.value)
    .map((i) => ({ ...(i.system ? { system: `urn:id:${i.system.toLowerCase()}` } : {}), ...(i.type ? { type: { text: i.type } } : {}), value: i.value }));
  rows.push({ v2: "PID-3 → Patient.identifier", fhir: "Patient.identifier", value: identifiers.length ? identifiers.map((i) => String((i as { value: string }).value)).join(", ") : "(missing — Blocker for analytics)", status: identifiers.length ? "mapped" : "unmapped" });
  const family = comp(getField(pid, 5), 1);
  const given = comp(getField(pid, 5), 2);
  rows.push({ v2: "PID-5 → Patient.name", fhir: "Patient.name", value: [family, given].filter(Boolean).join(", ") || "(missing)", status: family ? "mapped" : "unmapped" });
  const dobRaw = getField(pid, 7);
  const dob = parseDTM(dobRaw);
  if (dobRaw) rows.push({ v2: "PID-7 → Patient.birthDate", fhir: "Patient.birthDate", value: dob ?? `(unparseable: ${dobRaw})`, status: dob ? "mapped" : "unmapped" });
  const gender = fhirGender(getField(pid, 8));
  rows.push({ v2: "PID-8 → Patient.gender", fhir: "Patient.gender", value: gender ?? `(unmapped code: ${getField(pid, 8) || "blank"})`, status: gender ? "mapped" : "note" });
  const street = comp(getField(pid, 11), 1);
  const city = comp(getField(pid, 11), 3);
  const state = comp(getField(pid, 11), 4);
  const zip = comp(getField(pid, 11), 5);
  const country = comp(getField(pid, 11), 6);
  if (street || city) rows.push({ v2: "PID-11 → Patient.address", fhir: "Patient.address", value: [street, city, state, zip, country].filter(Boolean).join(", "), status: "mapped" });
  const phone = comp(getField(pid, 13), 1);
  if (phone) rows.push({ v2: "PID-13 → Patient.telecom", fhir: "Patient.telecom", value: phone, status: "mapped" });

  const patient: Record<string, unknown> = {
    resourceType: "Patient", id: "patient-1",
    meta: { profile: [prof.patient] },
    ...(identifiers.length ? { identifier: identifiers } : {}),
    ...(family || given ? { name: [{ ...(family ? { family } : {}), ...(given ? { given: [given] } : {}) }] } : {}),
    ...(dob && dob.length === 10 ? { birthDate: dob } : {}),
    ...(gender ? { gender } : {}),
    ...((street || city) ? { address: [{ line: street ? [street] : undefined, city: city || undefined, state: state || undefined, postalCode: zip || undefined, country: country || undefined }] } : {}),
    ...(phone ? { telecom: [{ system: "phone", value: phone }] } : {}),
  };
  resources.push(patient);

  // --- Encounter from PV1 ---
  const pv12 = getField(pv1, 2);
  if (pv1) {
    const cls = fhirEncounterClass(pv12);
    rows.push({ v2: "PV1-2 → Encounter.class", fhir: "Encounter.class", value: `${cls.code} (${cls.display})${pv12 && !/^[IEOPRB N]$/i.test(pv12) && !/^(IMP|EMER|AMB|OBSENC|PRENC|SS|VR)$/i.test(pv12) ? ` — non-standard input "${pv12}", defaulted` : ""}`, status: "mapped" });
    const loc = getField(pv1, 3);
    const ward = comp(loc, 1);
    const room = comp(loc, 2);
    const bed = comp(loc, 3);
    if (ward) rows.push({ v2: "PV1-3 → Encounter.location", fhir: "Encounter.location", value: [ward, room, bed].filter(Boolean).join(" / "), status: "mapped" });
    const visit = comp(getField(pv1, 19), 1);
    if (visit) rows.push({ v2: "PV1-19 → Encounter.identifier", fhir: "Encounter.identifier", value: visit, status: "mapped" });
    const admit = parseDTM(getField(pv1, 44));
    const discharge = parseDTM(getField(pv1, 45));
    if (admit) rows.push({ v2: "PV1-44 → Encounter.period.start", fhir: "Encounter.period.start", value: admit, status: "mapped" });
    if (discharge) rows.push({ v2: "PV1-45 → Encounter.period.end", fhir: "Encounter.period.end", value: discharge, status: "mapped" });
    const attending = `${comp(getField(pv1, 7), 2)} ${comp(getField(pv1, 7), 1)}`.trim();
    if (attending) rows.push({ v2: "PV1-7 → Encounter.participant", fhir: "Encounter.participant", value: attending, status: "mapped" });

    resources.push({
      resourceType: "Encounter", id: "encounter-1",
      meta: { profile: [prof.encounter] },
      status: discharge ? "finished" : "in-progress",
      class: { system: "http://terminology.hl7.org/CodeSystem/v3-ActCode", code: cls.code, display: cls.display },
      subject: { reference: "Patient/patient-1" },
      ...(visit ? { identifier: [{ value: visit }] } : {}),
      ...((admit || discharge) ? { period: { ...(admit ? { start: admit } : {}), ...(discharge ? { end: discharge } : {}) } } : {}),
      ...(ward ? { location: [{ location: { display: [ward, room, bed].filter(Boolean).join(" / ") } }] } : {}),
      ...(attending ? { participant: [{ individual: { display: attending } }] } : {}),
    });
  } else {
    rows.push({ v2: "PV1 → Encounter", fhir: "Encounter", value: "No PV1 segment — no Encounter generated.", status: "unmapped" });
  }

  // --- Observations from OBX ---
  const obxList = segmentsOf(msg, "OBX");
  obxList.forEach((obx, i) => {
    const codeId = comp(getField(obx, 3), 1);
    const codeText = comp(getField(obx, 3), 2);
    const codeSystem = comp(getField(obx, 3), 3);
    const value = getField(obx, 5);
    const units = getField(obx, 6);
    const flag = getField(obx, 8);
    rows.push({ v2: `OBX[${i + 1}]-3/5 → Observation`, fhir: "Observation.code/value", value: `${codeText || codeId || "?"} = ${value || "?"} ${units}`, status: value ? "mapped" : "note" });
    resources.push({
      resourceType: "Observation", id: `observation-${i + 1}`,
      meta: { profile: [prof.observation] },
      status: "final",
      ...(codeId || codeText ? { code: { ...(codeId ? { coding: [{ ...(codeSystem ? { system: codeSystem === "LN" ? "http://loinc.org" : codeSystem } : {}), code: codeId }] } : {}), ...(codeText ? { text: codeText } : {}) } } : {}),
      subject: { reference: "Patient/patient-1" },
      ...(value ? { valueString: value } : { dataAbsentReason: { text: "not recorded" } }),
      ...(flag && flag !== "N" ? { interpretation: [{ text: flag }] } : {}),
    });
  });

  // --- Condition stub from DG1 ---
  const dg1 = firstSegment(msg, "DG1");
  if (dg1 && getField(dg1, 3)) {
    const code = comp(getField(dg1, 3), 1);
    const text = comp(getField(dg1, 3), 2);
    rows.push({ v2: "DG1-3 → Condition", fhir: "Condition.code", value: `${text || code}`, status: "mapped" });
    resources.push({ resourceType: "Condition", id: "condition-1", subject: { reference: "Patient/patient-1" }, code: { ...(code ? { coding: [{ code }] } : {}), ...(text ? { text } : {}) } });
  }

  // --- NK1 counted, not silently dropped ---
  const nk1Count = segmentsOf(msg, "NK1").length;
  if (nk1Count) rows.push({ v2: `NK1 (${nk1Count}) → RelatedPerson`, fhir: "RelatedPerson (count only in v1)", value: `${nk1Count} contact(s) present — full RelatedPerson mapping is a v2 enhancement.`, status: "note" });

  const unmappedSegments = Array.from(new Set(msg.segments.map((s) => s.name))).filter((n) => !HANDLED.has(n));
  if (unmappedSegments.length) rows.push({ v2: unmappedSegments.join(", "), fhir: "—", value: "Passed through unmapped in v1; listed so nothing is silently lost.", status: "unmapped" });

  const bundle = {
    resourceType: "Bundle", type: "collection",
    timestamp: new Date().toISOString(),
    entry: resources.map((r) => ({ resource: r })),
  };
  return { bundle, rows, unmappedSegments, messageType: mType };
}

function downloadBlob(filename: string, content: string, type = "application/json") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function V2ToFhirConverter() {
  usePageMeta("/v2-to-fhir-converter");
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [input, setInput] = useState(V2_FHIR_SAMPLES[0].message);
  const [profile, setProfile] = useState<Profile>("base");

  const results = useMemo<ConvertResult[]>(() => {
    const chunks = splitMessages(input).slice(0, 10);
    if (!chunks.length) return [];
    return chunks.map((c) => convertOne(parseMessage(c), profile));
  }, [input, profile]);

  const first = results[0];
  const bundleText = first && !first.error ? JSON.stringify(first.bundle, null, 2) : "";

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
              <div className="p-2 bg-primary/10 rounded-lg"><ArrowRightLeft className="w-7 h-7 text-primary" /></div>
              <div>
                <h1 className="text-3xl font-extrabold text-gray-900">V2 to FHIR Converter</h1>
                <p className="text-lg text-primary font-medium">See your ADT data the way FHIR sees it.</p>
              </div>
            </div>
            <p className="mt-3 text-gray-600 max-w-3xl">
              Paste a synthetic HL7v2 ADT or ORU message and get a FHIR R4 Bundle with
              Patient, Encounter, and Observation resources. Everything runs in your browser —
              nothing is uploaded. Do not paste real patient data.
            </p>
            <div className="flex flex-wrap gap-2 mt-4">
              <Badge variant="secondary">FHIR R4 · US Core · AU Core</Badge>
              <Badge variant="secondary"><ShieldCheck className="w-3 h-3 mr-1" /> 100% client-side</Badge>
              {first && <Badge variant="outline">{first.messageType}</Badge>}
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button size="lg" variant="outline" disabled={!bundleText} onClick={() => copy(bundleText, "FHIR Bundle copied.")}>
              <Copy className="w-5 h-5 mr-2" /> Copy JSON
            </Button>
            <Button size="lg" disabled={!bundleText} onClick={() => { downloadBlob("fhir-bundle.json", bundleText); toast({ title: "Download started", description: "fhir-bundle.json" }); }}>
              <Download className="w-5 h-5 mr-2" /> Download
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {V2_FHIR_SAMPLES.map((s) => (
            <Button key={s.id} variant="outline" size="sm" onClick={() => setInput(s.message)} title={s.description}>
              {s.label}
            </Button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center justify-between">
                <span>1 · Paste HL7v2 (synthetic only)</span>
                <Select value={profile} onValueChange={(v) => setProfile(v as Profile)}>
                  <SelectTrigger className="w-40 h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="base">FHIR R4 Base</SelectItem>
                    <SelectItem value="us">US Core 6.1</SelectItem>
                    <SelectItem value="au">AU Core 1.0</SelectItem>
                  </SelectContent>
                </Select>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                spellCheck={false}
                rows={16}
                className="w-full rounded border bg-slate-950 p-3 font-mono text-[11px] leading-relaxed text-slate-100"
              />
              <p className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                <TriangleAlert className="w-3 h-3 text-amber-500" /> Profile: {PROFILES[profile].label}. First 10 messages converted.
              </p>
            </CardContent>
          </Card>

          <Tabs defaultValue="bundle">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="bundle">2 · FHIR Bundle</TabsTrigger>
              <TabsTrigger value="map">Field map {first ? `(${first.rows.length})` : ""}</TabsTrigger>
            </TabsList>
            <TabsContent value="bundle">
              <Card>
                <CardContent className="pt-4">
                  <ScrollArea className="h-[420px] rounded border bg-slate-950 p-3">
                    <pre className="text-[11px] leading-relaxed text-slate-100 whitespace-pre-wrap font-mono">
                      {first?.error ?? bundleText ?? "Paste a message to begin."}
                    </pre>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="map">
              <Card>
                <CardContent className="pt-4">
                  <ScrollArea className="h-[420px]">
                    <div className="space-y-2">
                      {(first?.rows ?? []).map((r, i) => (
                        <div key={i} className="p-2.5 border rounded-lg text-sm">
                          <div className="flex items-center justify-between gap-2">
                            <code className="text-xs font-mono text-primary font-bold">{r.v2}</code>
                            <Badge variant={r.status === "mapped" ? "secondary" : r.status === "note" ? "outline" : "destructive"} className="text-[10px shrink-0">
                              {r.status}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">→ {r.fhir}</p>
                          <p className="text-xs text-gray-800 mt-1 break-words">{r.value}</p>
                        </div>
                      ))}
                      {(!first || !first.rows.length) && <p className="text-sm text-gray-500">No mappings yet.</p>}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <Card className="mt-6 border-primary/20 bg-primary/5">
          <CardContent className="pt-6 text-sm text-gray-700">
            <strong>What v1 covers — and what it doesn't.</strong> PID→Patient, PV1→Encounter,
            OBX→Observation, DG1→Condition stub; NK1 counted. Z-segments and GT1/IN1 pass through
            listed as unmapped. R5/R6 output, terminology translation, and server validation are
            future enhancements. Feed this Bundle into the Prior-Auth Readiness Checker next.
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
