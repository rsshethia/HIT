import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { PHI_RULES, SAFE_HARBOR_NAMES, KEPT_FIELDS_NOTE } from "@/lib/phi-profile";
import {
  deidentifyBatch,
  type DeidentifyResult,
} from "@/lib/deidentify";

// Synthetic demo data — already fictional. Exercises repeats (~),
// multi-message files, and shared-visit linkage across a journey.
const SAMPLE_HL7 = [
  "MSH|^~\\&|EPIC|HOSP|RESEARCH|EXT|20240215120000||ADT^A01|MSG0001|P|2.5",
  "EVN|A01|20240215120000",
  "PID|||MR12345^^^HOSP^MR||DOE^JOHN^A||19800115|M|||123 Main St^^Springfield^IL^62701||(217)5551234",
  "PV1||I|ICU^12^A|||SURGEON^JANE|||||||||||V555001|||||||||||||||||||||||||||||||||20240215120000",
  "NK1|1|DOE^JANE|SPO||(217)5559999",
  "MSH|^~\\&|EPIC|HOSP|RESEARCH|EXT|20240218143000||ADT^A03|MSG0002|P|2.5",
  "EVN|A03|20240218143000",
  "PID|||MR12345^^^HOSP^MR||DOE^JOHN^A||19800115|M|||123 Main St^^Springfield^IL^62701||(217)5551234",
  "PV1||I|ICU^12^A|||SURGEON^JANE|||||||||||V555001|||||||||||||||||||||||||||||||||20240215120000|20240218143000",
  "DG1|1||I10^Hypertension|||||||||20240216",
  "MSH|^~\\&|EPIC|HOSP|RESEARCH|EXT|20240303100000||ORU^R01|MSG0003|P|2.5",
  "PID|||MR67890^^^HOSP^MR||SMITH^MARY||19751203|F|||456 Oak Ave^^Riverton^IL^62501||(312)5557890",
  "PV1||O|LAB^03|||||||||||||||V555002|||||||||||||||||||||||||||||||||20240303100000",
  "OBR|1||LAB123|CBC^Complete Blood Count",
  "OBX|1|NM|WBC^White Blood Cells||7.2|10*3/uL||||F",
].join("\r");

function download(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function HL7DeidentifyPage() {
  const { toast } = useToast();
  const [input, setInput] = useState("");
  const [secret, setSecret] = useState("");
  const [shiftDates, setShiftDates] = useState(true);
  const [disabledFields, setDisabledFields] = useState<Set<string>>(new Set());
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<DeidentifyResult | null>(null);
  const [selectedMsg, setSelectedMsg] = useState(0);

  const segments = useMemo(() => {
    const order: string[] = [];
    for (const r of PHI_RULES) if (!order.includes(r.segment)) order.push(r.segment);
    return order.map((seg) => ({ seg, rules: PHI_RULES.filter((r) => r.segment === seg) }));
  }, []);

  const toggleField = (field: string) => {
    const next = new Set(disabledFields);
    if (next.has(field)) next.delete(field);
    else next.add(field);
    setDisabledFields(next);
  };

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    const text = await file.text();
    setInput(text);
    setResult(null);
    toast({ title: "File loaded", description: `${file.name} (${text.length} chars). Nothing leaves your browser.` });
  };

  const run = async () => {
    if (!input.trim()) {
      toast({ title: "No input", description: "Paste HL7 messages or load the sample first.", variant: "destructive" });
      return;
    }
    if (secret.length < 8) {
      toast({
        title: "Secret too short",
        description: "Use a passphrase of at least 8 characters. It is the security boundary — never share it with the output.",
        variant: "destructive",
      });
      return;
    }
    setRunning(true);
    try {
      const res = await deidentifyBatch(input, secret, { disabledFields, shiftDates });
      setResult(res);
      setSelectedMsg(0);
      if (res.gateFailures.length > 0) {
        toast({
          title: "Validation gate failed",
          description: `${res.gateFailures.length} original value(s) survived. Download blocked — review the report.`,
          variant: "destructive",
        });
      } else {
        toast({ title: "Done", description: `${res.stats.messages} messages, ${res.stats.patients} patient lanes, gate clean.` });
      }
    } catch (e) {
      toast({ title: "Error", description: "Could not process the input. Check message formatting.", variant: "destructive" });
    } finally {
      setRunning(false);
    }
  };

  const downloadAudit = () => {
    if (!result) return;
    const audit = {
      generatedAt: new Date().toISOString(),
      stats: result.stats,
      patients: result.patients,
      residualRisks: result.residualRisks,
      gateFailures: result.gateFailures,
      unverifiableShortValues: result.unverifiable,
      usedFallbackHash: result.usedFallbackHash,
      note: "Counts only. No real↔fictional crosswalk is stored or exported. Keep the secret passphrase internal.",
    };
    download("deidentify-audit.json", JSON.stringify(audit, null, 2), "application/json");
  };

  const gateBlocked = result !== null && result.gateFailures.length > 0;

  return (
    <div className="bg-neutral-50 min-h-[calc(100vh-4rem)]">
      <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:py-20 lg:px-8">
        <h2 className="text-3xl font-extrabold text-gray-900">HL7 De-Identify</h2>
        <p className="mt-4 text-lg text-gray-500 max-w-3xl">
          Replace patient demographics with consistent fictional identifiers while keeping journeys,
          visits, and intervals intact. Everything runs in your browser — PHI never touches the server.
        </p>

        {/* Step 1: Input */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>1. Input messages</CardTitle>
            <CardDescription>Paste HL7 v2 text or drop a .hl7 file. Multi-message batches stay linkable by patient.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={input}
              onChange={(e) => { setInput(e.target.value); setResult(null); }}
              placeholder={"MSH|^~\\&|..."}
              className="font-mono text-xs min-h-[160px]"
            />
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" onClick={() => { setInput(SAMPLE_HL7); setResult(null); }}>
                Load synthetic sample
              </Button>
              <label className="inline-flex items-center justify-center rounded-md text-sm font-medium px-4 py-2 border border-gray-300 bg-white hover:bg-gray-50 cursor-pointer">
                Drop / choose .hl7 file
                <input
                  type="file"
                  accept=".hl7,.txt"
                  className="hidden"
                  onChange={(e) => handleFile(e.target.files?.[0])}
                />
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Step 2: Options */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>2. De-identification options</CardTitle>
            <CardDescription>
              The secret passphrase deterministically maps each real value to the same fictional value
              across runs. Same secret + same data = same output. Never ship the secret with the data.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Project secret passphrase (min 8 chars)</label>
                <Input
                  type="password"
                  value={secret}
                  onChange={(e) => setSecret(e.target.value)}
                  placeholder="e.g. cardiology-2026-project"
                  className="mt-1"
                />
              </div>
              <label className="flex items-start gap-2 text-sm text-gray-700 pt-6">
                <Checkbox
                  checked={shiftDates}
                  onCheckedChange={(v) => setShiftDates(v === true)}
                />
                <span>Shift dates by a per-patient offset (preserves intervals). Unchecked = blank all dates.</span>
              </label>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Field rules — uncheck to leave a field untouched</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {segments.map(({ seg, rules }) => (
                  <div key={seg} className="border rounded-md p-3 bg-white">
                    <div className="text-sm font-semibold text-gray-800 mb-2">{seg}</div>
                    <div className="space-y-1.5">
                      {rules.map((r) => (
                        <label key={r.field} className="flex items-start gap-2 text-xs text-gray-600">
                          <Checkbox
                            checked={!disabledFields.has(r.field)}
                            onCheckedChange={() => toggleField(r.field)}
                          />
                          <span>
                            <span className="font-mono font-medium text-gray-800">{r.field}</span>
                            {" "}{r.label} <span className="text-gray-400">· {r.rule}</span>
                            {r.safeHarbor !== undefined && (
                              <span className="text-gray-400"> · Safe Harbor {r.safeHarbor}: {SAFE_HARBOR_NAMES[r.safeHarbor]}</span>
                            )}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs text-gray-500">{KEPT_FIELDS_NOTE}</p>
            </div>

            <Button onClick={run} disabled={running}>
              {running ? "De-identifying…" : "De-identify"}
            </Button>
          </CardContent>
        </Card>

        {/* Step 3: Results */}
        {result && (
          <div className="mt-6 space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                { label: "Messages", value: result.stats.messages },
                { label: "Patient lanes", value: result.stats.patients },
                { label: "Fields replaced", value: result.stats.fieldsReplaced },
                { label: "Dates shifted", value: result.stats.datesShifted },
                { label: "IDs regenerated", value: result.stats.idsRegenerated },
              ].map((s) => (
                <Card key={s.label}>
                  <CardContent className="pt-4">
                    <div className="text-2xl font-bold text-gray-900">{s.value}</div>
                    <div className="text-xs text-gray-500">{s.label}</div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className={gateBlocked ? "border-red-400" : "border-green-300"}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Validation gate
                  {gateBlocked ? (
                    <Badge variant="destructive">BLOCKED</Badge>
                  ) : (
                    <Badge className="bg-green-100 text-green-800">CLEAN</Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  {gateBlocked
                    ? "Original values survived — download is blocked. Re-run with stricter rules."
                    : "No original PHI detected in the output. Safe to download."}
                </CardDescription>
              </CardHeader>
              {gateBlocked && (
                <CardContent>
                  <ul className="text-xs font-mono text-red-700 space-y-1">
                    {result.gateFailures.map((f) => <li key={f}>{f}</li>)}
                  </ul>
                </CardContent>
              )}
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Patient journeys (pseudonymous)</CardTitle>
                <CardDescription>Same fictional IDs across every message — visits and intervals intact.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-500 border-b">
                        <th className="py-2 pr-4">Pseudo patient</th>
                        <th className="py-2 pr-4">Messages</th>
                        <th className="py-2 pr-4">Pseudo visits</th>
                        <th className="py-2 pr-4">Replaced</th>
                        <th className="py-2">Shifted</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.patients.map((p) => (
                        <tr key={p.pseudoId} className="border-b last:border-0">
                          <td className="py-2 pr-4 font-mono">{p.pseudoId}</td>
                          <td className="py-2 pr-4">{p.messages}</td>
                          <td className="py-2 pr-4 font-mono">{p.visits.join(", ") || "—"}</td>
                          <td className="py-2 pr-4">{p.fieldsReplaced}</td>
                          <td className="py-2">{p.datesShifted}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Message preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 mb-4">
                  {result.outputs.map((o) => (
                    <Button
                      key={o.index}
                      variant={selectedMsg === o.index ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedMsg(o.index)}
                    >
                      #{o.index + 1} {o.messageType}
                    </Button>
                  ))}
                </div>
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-md text-xs overflow-x-auto whitespace-pre-wrap break-all">
                  {result.outputs[selectedMsg]?.text}
                </pre>
                <div className="flex flex-wrap gap-3 mt-4">
                  <Button
                    disabled={gateBlocked}
                    onClick={() => download("deidentified.hl7", result.combined.split("\r").join("\r\n"), "text/plain")}
                  >
                    Download de-identified .hl7
                  </Button>
                  <Button variant="outline" onClick={downloadAudit}>
                    Download audit report (counts only)
                  </Button>
                </div>
              </CardContent>
            </Card>

            {(result.residualRisks.length > 0 || result.unverifiable.length > 0 || result.usedFallbackHash) && (
              <Card className="border-amber-300">
                <CardHeader>
                  <CardTitle>Review before sharing</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-gray-700 space-y-2">
                  {result.usedFallbackHash && (
                    <p>WebCrypto was unavailable, so a weaker fallback hash was used. Prefer HTTPS or localhost.</p>
                  )}
                  {result.residualRisks.map((r) => <p key={r}>• {r}</p>)}
                  {result.unverifiable.length > 0 && (
                    <p>• {result.unverifiable.length} short value(s) could not be machine-verified (e.g. “{result.unverifiable[0]}”). Human sign-off required.</p>
                  )}
                  <p>• Rare conditions or unique clinical patterns can re-identify even without demographics — get data-governance sign-off before external release.</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
