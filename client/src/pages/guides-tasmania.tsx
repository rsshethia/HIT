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
  years: string;
  goal: string;
  initiatives: string[];
  links: PillarLink[];
}

const PILLARS: Pillar[] = [
  {
    n: "H1",
    title: "Foundations + quick wins",
    years: "2022–24",
    goal: "Make the most of what exists: open up clinical information, fix data quality and standards, extend first responders and telehealth.",
    initiatives: [
      "Data quality uplift — patient demographics and identity, clinic/service details, allergies and alerts, order sets, diagnostic request forms",
      "eReferral and separation summaries, TrakED/DMR access extensions, external pathology into DMR",
      "First responders digital foundations — new ePCR and first-responder app for Ambulance Tasmania",
      "Clinical viewer — view-only aggregate from existing systems; tactical dashboards",
      "National alignment — My Health Record (490K Tasmanians), HI Service, secure messaging, HealthPathways",
    ],
    links: [
      { tool: "eReferral Starter Kit", href: "/ereferral-kit", note: "Score your referral gap: fax/paper → tracked, structured, FHIR-ready", audience: "doer" },
      { tool: "HL7 SQL Builder", href: "/hl7-sql-builder", note: "Land TrakED/DMR/PAS feeds into queryable tables", audience: "doer" },
      { tool: "Data-Quality Auditor", href: "/hl7-data-quality-auditor", note: "Demographics, identity, dates, duplicates — the H1 data-quality uplift", audience: "doer" },
      { tool: "MessageTrace", href: "/message-trace", note: "Find the missing referral or form in archive files in seconds", audience: "doer" },
      { tool: "V2 → FHIR (AU Core)", href: "/v2-to-fhir-converter", note: "Preview ADT/ORU as FHIR R4 before the integrated care platform arrives", audience: "doer" },
    ],
  },
  {
    n: "H2",
    title: "Core record + flow + portals",
    years: "2025–27",
    goal: "Modern EMR and eMedication Management, better patient flow and scheduling, consumer portals with self-scheduling.",
    initiatives: [
      "Comprehensive EMR across ED, outpatients, inpatients, community, mental health, theatres, ICU",
      "Advanced EMM and electronic prescriptions across acute and community — fewer adverse drug events",
      "Patient flow, scheduling and demand management — less travel, more virtual care",
      "Consumer portals — education, self-scheduling, results, shared care plans, virtual monitoring",
      "Decision support — allergies, drug interactions, dosing, deteriorating-patient, flow dashboards",
    ],
    links: [
      { tool: "Ward Analytics", href: "/hl7-ward-analytics", note: "Baseline flow now: LOS, boarding, census, 28-day returns", audience: "decision" },
      { tool: "V2 → FHIR scheduling (SIU)", href: "/v2-to-fhir-converter", note: "See SIU bookings as FHIR Appointments — the self-scheduling building block", audience: "doer" },
      { tool: "Catchment Kit", href: "/hl7-catchment-kit", note: "Demand by region — plan rural coverage and virtual care placement", audience: "decision" },
      { tool: "Integration Architect", href: "/integration-architect", note: "Sketch EMR/flow/portal integration before procurement", audience: "doer" },
    ],
  },
  {
    n: "H3",
    title: "Integrated care platform + analytics",
    years: "2028–32",
    goal: "A standards-based, FHIR/API-driven integrated care platform plus advanced analytics, demand optimisation and precision medicine.",
    initiatives: [
      "Integrated Care Platform — history, meds, care plans, appointments, viewable and updatable in workflow",
      "Outcomes measures — patient-reported and care-team-reported outcomes",
      "Advanced analytics — unwarranted variation, benchmarking, predictive demand, AI decision support",
      "Transitions of care seamless across acute, community, private, primary, aged and virtual care",
    ],
    links: [
      { tool: "V2 → FHIR (AU Core)", href: "/v2-to-fhir-converter", note: "Build FHIR/API literacy now — the platform speaks FHIR", audience: "doer" },
      { tool: "Ward Analytics", href: "/hl7-ward-analytics", note: "Variation and outlier analysis — the H3 analytics habit, started early", audience: "doer" },
      { tool: "De-Identify SQL", href: "/hl7-deidentify-sql", note: "Safe secondary-use extracts for analytics under the Privacy Act 1988", audience: "doer" },
    ],
  },
];

const STORIES: { name: string; role: string; quote: string }[] = [
  { name: "Jim", role: "Living with chronic disease", quote: "A Consumer Portal where I can review my goals of care with my family gives me confidence to manage my disease." },
  { name: "Jane", role: "Full-time carer for her mother", quote: "I am so relieved not to be the 'keeper of the knowledge'. Mum's doctors are all on the same page." },
  { name: "Michael", role: "ED Medical Officer", quote: "When a patient presents acutely unwell, we can see their last presentation anywhere in Tasmania — plus their GP's information." },
  { name: "Alex", role: "Aged Care Nurse", quote: "Residents get the right medications after discharge because I have line of sight to what changed in hospital." },
];

export default function GuidesTasmania() {
  usePageMeta("/guides/tasmania");
  const [, setLocation] = useLocation();

  return (
    <div className="bg-neutral-50 min-h-[calc(100vh-4rem)]">
      <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <Button variant="ghost" size="sm" className="mb-6 text-gray-500" onClick={() => setLocation("/resources")}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Resources
        </Button>

        <div className="mb-6">
          <div className="flex flex-wrap gap-2 mb-3">
            <Badge variant="secondary">Tasmania 2022–32</Badge>
            <Badge variant="outline">Department of Health Tasmania · $476M</Badge>
            <Badge variant="outline">Doers + Decision-makers</Badge>
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900">Tasmania Digital Health Transformation Guide</h1>
          <p className="mt-3 text-gray-600 max-w-3xl">
            Plain-English map of Tasmania&apos;s <em>Digital Health Transformation — Improving Patient
            Outcomes 2022–2032</em> to free HIT tools. The problem it names: 400+ disjointed systems,
            hybrid paper-electronic wards, referrals going missing daily, and ~$33–47M a year spent on
            acute care that could have happened elsewhere. Start below with the horizon you own.
          </p>
          <div className="flex flex-wrap gap-3 mt-4">
            <Card className="flex-1 min-w-[240px] border-primary/20 bg-primary/5">
              <CardContent className="pt-4 text-sm text-gray-700 flex gap-2">
                <Hammer className="w-4 h-4 mt-0.5 shrink-0 text-primary" />
                <span><strong>Doers</strong> (integration engineers, DBAs, analysts, informaticians): start with H1 tools — land the feed, fix identity and demographics, make referrals trackable.</span>
              </CardContent>
            </Card>
            <Card className="flex-1 min-w-[240px] border-primary/20 bg-primary/5">
              <CardContent className="pt-4 text-sm text-gray-700 flex gap-2">
                <Landmark className="w-4 h-4 mt-0.5 shrink-0 text-primary" />
                <span><strong>Decision-makers</strong> (CIOs, digital directors, service leads): start with Ward Analytics + Catchment Kit to baseline flow, boarding, returns and rural demand.</span>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="space-y-6">
          {PILLARS.map((p) => (
            <Card key={p.n}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-bold text-gray-900">
                  {p.n} — {p.title} <span className="text-sm font-medium text-gray-500">({p.years})</span>
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

        <Card className="mt-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold text-gray-900">Who this is for — in their own words</CardTitle>
            <p className="text-sm text-gray-600">Personas from the strategy. Each one is a problem a HIT tool helps with.</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {STORIES.map((s) => (
                <div key={s.name} className="p-3 border rounded-lg bg-white">
                  <p className="text-sm text-gray-700 italic">“{s.quote}”</p>
                  <p className="text-xs text-gray-500 mt-2"><strong>{s.name}</strong> — {s.role}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6 border-amber-200 bg-amber-50">
          <CardContent className="pt-4 text-sm text-amber-900">
            <strong>Australian context.</strong> This site is built for Australian healthcare:
            Medicare, MBS / PBS, My Health Record, AU Core FHIR, IHI / HPI identifiers
            and the Privacy Act 1988. The{" "}
            <Link href="/prior-auth-readiness" className="underline font-medium">
              Prior-Auth Readiness Checker
            </Link>{" "}
            is labelled <strong>US only</strong> (CMS-0057-F / Da Vinci) and does not apply in Tasmania.
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Source + what&apos;s next</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-gray-600 space-y-2">
            <p>
              Source: Department of Health Tasmania, <em>Digital Health Transformation — Improving
              Patient Outcomes 2022–2032</em>. This guide is an independent, educational mapping —
              not Tasmanian Government advice.
            </p>
            <p>
              Suggested next guides (one per state): NSW, Queensland, WA and SA — all linking back
              to these same tools. See also the{" "}
              <Link href="/guides/victoria" className="underline font-medium">
                Victoria Roadmap Guide
              </Link>.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
