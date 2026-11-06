// Single source of truth for search + agent metadata.
// Consumed by: usePageMeta (browser head tags), scripts/prerender.ts (bot snapshots).
export const CANONICAL_HOST = "https://dev.healthcareintegrationtools.com";
export const SITE_NAME = "HIT - Health Integration Tools";
export const SITE_TAGLINE =
  "Free tools for Australian healthcare integration: HL7 SQL generation, de-identification, ward analytics, catchment mapping, and diagramming.";

export type SchemaKind = "WebSite" | "WebPage" | "SoftwareApplication" | "HowTo";

export interface RouteMeta {
  path: string;
  title: string;
  description: string;
  h1: string;
  summary: string;
  schema: SchemaKind;
  steps?: string[];
}

export const ROUTE_META: RouteMeta[] = [
  {
    path: "/",
    title: "HIT - Health Integration Tools for HL7 & Australian Healthcare IT",
    description:
      "Free Australian healthcare integration toolkit: generate HL7 parsing SQL, de-identify health information, map patient catchments to SA2, answer ward analytics questions, and design integration diagrams.",
    h1: "Health Integration Tools",
    summary:
      "HIT is a free toolkit for Australian healthcare integration teams. Generate SQL stored procedures that parse RAW HL7 messages, de-identify health information inside your own database, turn patient addresses into SA2 catchment codes, answer twelve ward analytics questions from ADT messages, trace messages in archives with PowerShell, and design integration architecture diagrams.",
    schema: "WebSite",
  },
  {
    path: "/about",
    title: "About HIT - Health Integration Tools",
    description:
      "Learn what Health Integration Tools (HIT) is: a free, evolving toolkit helping clinical, business, and technical teams evaluate and improve healthcare integration.",
    h1: "About Health Integration Tools",
    summary:
      "Health Integration Tools (HIT) documents real healthcare integration experience as reusable artefacts: SQL generators, de-identification procedures, catchment and ward analytics kits, message tracing, and diagram tools for clinical, business, and technical audiences.",
    schema: "WebPage",
  },
  {
    path: "/resources",
    title: "Healthcare Integration Resources - HL7, FHIR, DICOM & Tools",
    description:
      "Curated healthcare integration resources: HL7 FHIR (AU Core), DICOM, V2-to-FHIR converter, data-quality auditor, de-identification, catchment and ward analytics.",
    h1: "Integration Resources",
    summary:
      "Curated standards (HL7 FHIR AU Core, DICOM) and interactive HIT tools: V2 to FHIR Converter, HL7 Data-Quality Auditor, HL7 SQL Builder, HL7 De-Identify SQL, Catchment Kit (PID-11 to SA2), Ward Analytics (PID x PV1), HL7 Segment Mapper, Integration Architect, MessageTrace archive search, and the Victoria Digital Health Roadmap guide.",
    schema: "WebPage",
  },
  {
    path: "/hl7-sql-builder",
    title: "HL7 SQL Builder - Parse RAW HL7 Messages into SQL Tables",
    description:
      "Generate SQL Server, PostgreSQL, and MySQL stored procedures that parse RAW HL7 ADT messages (PID, PV1, MSH, EVN) into queryable tables. Free, runs in your database.",
    h1: "HL7 SQL Builder",
    summary:
      "Select HL7 segments and fields from ADT messages and get ready-to-run stored procedures for SQL Server, PostgreSQL, or MySQL, including the fn_GetHL7Field parse helper used by every other HIT analytics kit.",
    schema: "SoftwareApplication",
  },
  {
    path: "/hl7-deidentify-sql",
    title: "HL7 De-Identify SQL - De-identify Health Information Inside Your Database",
    description:
      "Generate stored procedures that de-identify HL7 health information in place: consistent fictional UR numbers, shifted dates, fake names and addresses. Australian Privacy Act 1988 / OAIC-aligned preset. Your data never leaves your database.",
    h1: "HL7 De-Identify",
    summary:
      "Point at your HL7 table and column to generate de-identification procedures: pseudonymous patient IDs stable across messages, per-patient date shifts, fake names/addresses, digit-shifted phones. Mapping tables stay internal; only the de-identified table is shared.",
    schema: "SoftwareApplication",
  },
  {
    path: "/hl7-catchment-kit",
    title: "Catchment Kit - Patient Address (PID-11) to SA2 Boundaries in SQL",
    description:
      "Turn patient street addresses into Australian SA2 catchment codes inside SQL Server using G-NAF and ABS ASGS data. Offline one-click kit: no address ever leaves your database.",
    h1: "Catchment Kit: PID-11 to SA2",
    summary:
      "A DBA-ready kit that geocodes PID-11 street addresses to SA2 statistical boundaries with local G-NAF Core and ABS ASGS reference tables, then maps catchments by service, visit type, or attending doctor without exposing exact addresses.",
    schema: "HowTo",
    steps: [
      "Check prerequisites with the read-only script",
      "Create reference and mart tables",
      "Trial with bundled sample CSVs or download G-NAF Core and ABS Mesh Blocks",
      "Install the normalize function and geocode procedure",
      "Verify match rates and map catchments by service or doctor",
    ],
  },
  {
    path: "/hl7-ward-analytics",
    title: "Ward Analytics - 12 ADT Questions Answered from RAW HL7",
    description:
      "Twelve copy-paste ward analytics queries for SQL Server, PostgreSQL, and MySQL: LOS by ward, turnover, live census, ED boarding, readmissions, long-stay outliers and more.",
    h1: "Ward Analytics from ADT",
    summary:
      "Twelve questions answered from RAW HL7 ADT messages: length of stay by ward/room/bed, bed turnover, live census proxy, ED boarding hours, after-hours activity, transfer pairs, average age, long-stay outliers, 28-day returns, doctor census, before-noon discharges, and discharge disposition. One foundation mart, thin views, scheduled refresh.",
    schema: "SoftwareApplication",
  },
  {
    path: "/hl7-segment-mapper",
    title: "HL7 Segment Mapper - Segments to Message Types Graph",
    description:
      "Interactive graph showing how HL7 segments (PID, PV1, MSH, OBX, DG1) relate to message types ADT, ORU, ORM, and SIU. Free learning tool.",
    h1: "HL7 Segment Mapper",
    summary:
      "An interactive force-directed graph of HL7 segment-to-message relationships across ADT, ORU, ORM, and SIU messages: which segments each message type carries and how they connect.",
    schema: "WebPage",
  },
  {
    path: "/integration-architect",
    title: "Integration Architect - Healthcare Interface Diagrams with AI Assist",
    description:
      "Design healthcare integration flows with template-based PlantUML generation, save locally, and export professional diagrams. Free.",
    h1: "Integration Architect",
    summary:
      "The premier HIT tool for designing healthcare integration flows: AI-assisted PlantUML diagram generation with local saving and professional export for EMRs, LIS, billing, and interface engines.",
    schema: "SoftwareApplication",
  },
  {
    path: "/v2-to-fhir-converter",
    title: "V2 to FHIR Converter - Free HL7 to FHIR R4 (AU Core) Tool",
    description:
      "Paste HL7v2 ADT, ORU or SIU and get a FHIR R4 Bundle (AU Core, Base, US Core). Free, runs in your browser, no health information uploaded.",
    h1: "V2 to FHIR Converter",
    summary:
      "Convert HL7v2 ADT, ORU and SIU scheduling messages into FHIR R4 Bundles with Patient, Encounter, Observation, Condition and Appointment resources. Choose AU Core, Base R4, or US Core profiles, see field-level mappings and unmapped segments, then copy or download the JSON. Everything runs locally in your browser.",
    schema: "SoftwareApplication",
    steps: [
      "Paste an ADT, ORU or SIU message or load a sample",
      "Choose AU Core, Base R4, or US Core",
      "Review the field-level map and unmapped list",
      "Copy or download the FHIR JSON Bundle",
    ],
  },
  {
    path: "/hl7-data-quality-auditor",
    title: "HL7 Data Quality Auditor - Free ADT Feed Health Check",
    description:
      "Audit HL7 ADT feeds for missing IDs, duplicates, and bad dates. Free health score + SQL for SQL Server, PostgreSQL, MySQL.",
    h1: "HL7 Data-Quality Auditor",
    summary:
      "Check HL7v2 ADT feed quality before analytics or FHIR migration: completeness, validity, consistency, and duplicates across MSH, PID, PV1, DG1, and OBX. Get a 0-100 health score, an issue table, and runnable audit SQL for SQL Server, PostgreSQL, or MySQL. All processing stays in your browser or database.",
    schema: "SoftwareApplication",
    steps: [
      "Paste messages or generate audit SQL for your database",
      "Run the completeness, validity, and duplicate checks",
      "Review the 0-100 score and severity-ranked issues",
      "Export the Markdown report or CSV and fix at source",
    ],
  },
  {
    path: "/ereferral-kit",
    title: "eReferral Starter Kit - Free Referral Readiness Score + Tracking SQL",
    description:
      "Score your referral process in 8 questions, see a sample REF mapped to FHIR ServiceRequest, and track open referrals with read-only SQL. Free, runs in your browser.",
    h1: "eReferral Starter Kit",
    summary:
      "Stop losing referrals to fax and paper: answer 8 questions for a 0-100 readiness score with a fix-in-order action plan, study a synthetic REF_I12 message mapped field-by-field to FHIR R4 ServiceRequest, and run read-only tracking SQL (open list, stale referrals, fax share) on SQL Server, PostgreSQL, or MySQL.",
    schema: "SoftwareApplication",
    steps: [
      "Answer the 8 readiness questions",
      "Review your score and fix-in-order action plan",
      "Study the REF to FHIR ServiceRequest field map",
      "Run the tracking SQL in your own database",
    ],
  },
  {
    path: "/prior-auth-readiness",
    title: "Prior-Auth Readiness Checker - US CMS 2026 FHIR Guide (US only)",
    description:
      "US-only tool: check CMS prior-auth readiness (FHIR APIs, Da Vinci PAS, 72hr/7-day rules). Not applicable in Australia. Free score + action plan. Educational only.",
    h1: "Prior-Auth Readiness Checker (US only)",
    summary:
      "US-only educational tool for the CMS Interoperability and Prior Authorization rule: FHIR Patient and Provider Access APIs, Payer-to-Payer exchange, and Da Vinci PAS/CRD/DTR workflows. Not applicable to Australian healthcare (which uses Medicare, MBS/PBS, My Health Record and AU Core). Answer 12 questions, optionally attach a FHIR Bundle, and get a score plus a prioritised action plan. Free, educational, runs in your browser.",
    schema: "SoftwareApplication",
    steps: [
      "Answer the 12 readiness questions",
      "Optionally attach a FHIR Bundle from the V2 converter",
      "Review your score and deadline-mapped actions",
      "Copy the action plan and sample Claim skeleton",
    ],
  },
  {
    path: "/guides/victoria",
    title: "Victoria Digital Health Roadmap 2026-31 - Guide for Doers & Decision-Makers",
    description:
      "Plain-English guide to Victoria's Digital Health Vision and Roadmap 2026-31: 4 pillars, what to do first, and which free HIT tool helps. For Victorian health services, LHSNs, clinicians and integration teams.",
    h1: "Victoria Digital Health Roadmap Guide",
    summary:
      "Victoria's Digital Health Vision and Roadmap 2026-31 mapped to free HIT tools: digitised clinical records, CareSync health information sharing, virtual care, consumer portals and My Health Record, VicKey navigation, decision intelligence, automation, cyber resilience, workforce enablement and safe AI. Separate tracks for doers (engineers, analysts, informaticians) and decision-makers (CIOs, digital directors, LHSN leads).",
    schema: "WebPage",
  },
  {
    path: "/guides/tasmania",
    title: "Tasmania Digital Health Transformation 2022-32 - Guide for Doers & Decision-Makers",
    description:
      "Plain-English guide to Tasmania's $476M Digital Health Transformation: 3 horizons, what to do first, and which free HIT tool helps. For THS, Primary Health Tasmania, clinicians and integration teams.",
    h1: "Tasmania Digital Health Transformation Guide",
    summary:
      "Tasmania's Digital Health Transformation 2022-32 mapped to free HIT tools: Horizon 1 data quality and standards, eReferrals and separation summaries, first-responder ePCR, telehealth and clinical viewer; Horizon 2 EMR and electronic medication management, patient flow and scheduling, consumer portals with self-scheduling; Horizon 3 FHIR/API integrated care platform, advanced analytics and demand optimisation. Told through the strategy's own personas: Jim, Jane, Michael and Alex.",
    schema: "WebPage",
  },
  {
    path: "/message-trace",
    title: "MessageTrace - Search HL7 Message Archives with PowerShell",
    description:
      "Free PowerShell script to search thousands of archived HL7 files by patient ID, visit number, or location in seconds. Zero dependencies, Windows Server ready.",
    h1: "MessageTrace",
    summary:
      "MessageTrace is a dependency-free PowerShell tool that searches archived HL7 files by PID-3 patient ID, PV1-19 visit number, or PV1-3 location, with full-message display for incident response and audits.",
    schema: "SoftwareApplication",
  },
];

export const metaForPath = (path: string): RouteMeta =>
  ROUTE_META.find((r) => r.path === path) ?? {
    path,
    title: `${SITE_NAME} - ${SITE_TAGLINE}`,
    description: SITE_TAGLINE,
    h1: "Health Integration Tools",
    summary: SITE_TAGLINE,
    schema: "WebPage" as SchemaKind,
  };

export function jsonLdFor(meta: RouteMeta): Record<string, unknown> {
  const base = { "@context": "https://schema.org" };
  const url = `${CANONICAL_HOST}${meta.path}`;
  switch (meta.schema) {
    case "WebSite":
      return { ...base, "@type": "WebSite", name: SITE_NAME, url: CANONICAL_HOST, description: meta.description };
    case "SoftwareApplication":
      return {
        ...base, "@type": "SoftwareApplication", name: meta.h1, url,
        description: meta.description, applicationCategory: "DeveloperApplication",
        operatingSystem: "Windows, Linux, macOS", offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        isAccessibleForFree: true,
      };
    case "HowTo":
      return {
        ...base, "@type": "HowTo", name: meta.h1, description: meta.description,
        step: (meta.steps ?? []).map((s) => ({ "@type": "HowToStep", text: s })),
      };
    default:
      return { ...base, "@type": "WebPage", name: meta.title, url, description: meta.description };
  }
}
