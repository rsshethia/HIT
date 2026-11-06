import { Link, useLocation } from "wouter";
import { usePageMeta } from "@/hooks/use-page-meta";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, Hammer, Landmark } from "lucide-react";

interface PillarLink {
  tool: string;
  href: string;
  note: string;
  audience: "doer" | "decision";
}

interface Pillar {
  n: string;
  title: string;
  goal: string;
  initiatives: string[];
  links: PillarLink[];
}

const PILLARS: Pillar[] = [
  {
    n: "1",
    title: "Connecting Health",
    goal: "Seamless, secure interoperable infrastructure with real-time access to health information.",
    initiatives: [
      "1.1 Digitised clinical records — EMR / patient admin modernisation, mental health record",
      "1.2 Seamless sharing — CareSync Exchange, Healthcare Identifiers (IHI / HPI-I / HPI-O), eReferrals, Program Wominjeka, diagnostic image sharing",
      "1.3 Trusted data foundations — Connected Health Data Platform, marketplace, mandatory reporting, medicines formulary, genomics, Indigenous data sovereignty",
    ],
    links: [
      { tool: "HL7 SQL Builder", href: "/hl7-sql-builder", note: "Land RAW ADT into queryable tables — first step off paper/fax", audience: "doer" },
      { tool: "Data-Quality Auditor", href: "/hl7-data-quality-auditor", note: "Score feed health; catch missing IHI, bad dates, duplicates", audience: "doer" },
      { tool: "V2 → FHIR (AU Core)", href: "/v2-to-fhir-converter", note: "Preview ADT/ORU as AU Core Patient / Encounter / Observation", audience: "doer" },
      { tool: "De-Identify SQL", href: "/hl7-deidentify-sql", note: "Share de-identified extracts under Privacy Act 1988 / OAIC guidance", audience: "doer" },
      { tool: "MessageTrace", href: "/message-trace", note: "Find lost referrals / messages in archives by UR, visit, ward", audience: "doer" },
    ],
  },
  {
    n: "2",
    title: "Care Anywhere",
    goal: "Digital and virtual models delivering care at home, in community, or in the most appropriate setting.",
    initiatives: [
      "2.1 Virtual hospital care — admission avoidance, Hospital in the Home, Residential in Reach, virtual wards",
      "2.2 Digital and virtual care journeys — Assisted Self-Management, Specialist Advice Now, regional digital mental health, risk stratification",
      "2.3 Virtual-care digital foundations — shared telehealth / remote monitoring / async architecture",
    ],
    links: [
      { tool: "Integration Architect", href: "/integration-architect", note: "Sketch virtual-care flows: ED → virtual ward → HITH → GP", audience: "doer" },
      { tool: "Catchment Kit PID-11 → SA2", href: "/hl7-catchment-kit", note: "Map demand by SA2 to plan virtual coverage, esp. regional VIC", audience: "decision" },
      { tool: "Ward Analytics", href: "/hl7-ward-analytics", note: "Baseline LOS, readmissions, ED boarding before shifting to virtual", audience: "decision" },
    ],
  },
  {
    n: "3",
    title: "Engaged Consumers",
    goal: "Consistent trusted digital channels so people can access info, navigate services and participate in care.",
    initiatives: [
      "3.1 Informed consumers — local + statewide portals, My Health Record sharing, electronic prescribing",
      "3.2 Accessible system — VicKey planned-care modules, navigation / triage, aged-care assessment platform",
    ],
    links: [
      { tool: "V2 → FHIR (AU Core)", href: "/v2-to-fhir-converter", note: "Check what in your ADT actually maps to My Health Record views", audience: "doer" },
      { tool: "Segment Mapper", href: "/hl7-segment-mapper", note: "Learn which segments carry referrals, results, scripts", audience: "doer" },
    ],
  },
  {
    n: "4",
    title: "Sustainable Operations",
    goal: "Shared platforms, data, automation and secure systems for proactive, efficient, resilient operations.",
    initiatives: [
      "4.1 Decision intelligence — digital twin, demand/flow forecasting, real-time ops, ACCO dashboards",
      "4.2 Operational efficiency — finance platform, workforce identity, admin + clinical automation (coding, discharge summaries)",
      "4.3 Safer digital healthcare — cyber uplift, cloud migration, legacy refresh",
    ],
    links: [
      { tool: "Ward Analytics", href: "/hl7-ward-analytics", note: "Ops starter pack: census, turnover, boarding, 28-day returns", audience: "doer" },
      { tool: "Catchment Kit", href: "/hl7-catchment-kit", note: "Demand planning by service / doctor / visit type", audience: "decision" },
      { tool: "MessageTrace", href: "/message-trace", note: "Incident response: locate messages fast during outages", audience: "doer" },
    ],
  },
];

export default function GuidesVictoria() {
  usePageMeta("/guides/victoria");
  const [, setLocation] = useLocation();

  return (
    <div className="bg-neutral-50 min-h-[calc(100vh-4rem)]">
      <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <Button variant="ghost" size="sm" className="mb-6 text-gray-500" onClick={() => setLocation("/resources")}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Resources
        </Button>

        <div className="mb-6">
          <div className="flex flex-wrap gap-2 mb-3">
            <Badge variant="secondary">Victoria 2026–31</Badge>
            <Badge variant="outline">Department of Health Victoria</Badge>
            <Badge variant="outline">Doers + Decision-makers</Badge>
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900">Victoria Digital Health Roadmap Guide</h1>
          <p className="mt-3 text-gray-600 max-w-3xl">
            Plain-English map of <em>Victoria&apos;s Digital Health Vision and Roadmap 2026–31</em> to
            free HIT tools. The roadmap&apos;s own pain points: half of services still on paper,
            ~45 minutes of clinical time lost per shift finding information, up to 90% of referrals
            arriving by fax or email in some services, ~15% duplicate tests. Start below with the
            pillar you own.
          </p>
          <div className="flex flex-wrap gap-3 mt-4">
            <Card className="flex-1 min-w-[240px] border-primary/20 bg-primary/5">
              <CardContent className="pt-4 text-sm text-gray-700 flex gap-2">
                <Hammer className="w-4 h-4 mt-0.5 shrink-0 text-primary" />
                <span><strong>Doers</strong> (integration engineers, DBAs, analysts, informaticians): start with Pillar 1 tools — land the feed, fix identifiers, prove quality.</span>
              </CardContent>
            </Card>
            <Card className="flex-1 min-w-[240px] border-primary/20 bg-primary/5">
              <CardContent className="pt-4 text-sm text-gray-700 flex gap-2">
                <Landmark className="w-4 h-4 mt-0.5 shrink-0 text-primary" />
                <span><strong>Decision-makers</strong> (CIOs, digital directors, LHSN leads): start with Ward Analytics + Catchment Kit to baseline LOS, boarding, returns and demand by SA2.</span>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="space-y-6">
          {PILLARS.map((p) => (
            <Card key={p.n}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-bold text-gray-900">
                  Pillar {p.n} — {p.title}
                </CardTitle>
                <p className="text-sm text-gray-600">{p.goal}</p>
              </CardHeader>
              <CardContent>
                <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1 mb-4">
                  {p.initiatives.map((i) => (
                    <li key={i}>{i}</li>
                  ))}
                </ul>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {p.links.map((l) => (
                    <Link
                      key={`${l.tool}-${l.href}`}
                      href={l.href}
                      className="p-3 border rounded-lg hover:shadow-sm hover:border-primary/40 transition-shadow block"
                    >
                      <span className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-gray-900">{l.tool}</span>
                        <Badge variant={l.audience === "doer" ? "secondary" : "outline"} className="text-[10px] shrink-0">
                          {l.audience === "doer" ? "Doer" : "Decision-maker"}
                        </Badge>
                      </span>
                      <span className="block text-xs text-gray-600 mt-1">{l.note}</span>
                      <span className="inline-flex items-center text-xs text-primary font-medium mt-2">
                        Open tool <ArrowRight className="w-3 h-3 ml-1" />
                      </span>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mt-6 border-amber-200 bg-amber-50">
          <CardContent className="pt-4 text-sm text-amber-900">
            <strong>Australian context.</strong> This site is built for Australian healthcare:
            Medicare, MBS / PBS, My Health Record, AU Core FHIR, IHI / HPI identifiers, SA2 catchments
            and the Privacy Act 1988. The{" "}
            <Link href="/prior-auth-readiness" className="underline font-medium">
              Prior-Auth Readiness Checker
            </Link>{" "}
            is labelled <strong>US only</strong> (CMS-0057-F / Da Vinci) and does not apply in Victoria.
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Source + what&apos;s next</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-gray-600 space-y-2">
            <p>
              Source: Department of Health Victoria, <em>Victoria&apos;s Digital Health Vision and
              Roadmap 2026–31</em> (Oct 2026). This guide is an independent, educational mapping —
              not Victorian Government advice.
            </p>
            <p>
              Suggested next guides (one per state): NSW, Queensland, WA and SA — all linking back
              to these same tools. See also the{" "}
              <Link href="/guides/tasmania" className="underline font-medium">
                Tasmania Transformation Guide
              </Link>.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
