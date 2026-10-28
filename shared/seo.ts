// Single source of truth for search + agent metadata.
// Consumed by: usePageMeta (browser head tags), scripts/prerender.ts (bot snapshots).
export const CANONICAL_HOST = "https://dev.healthcareintegrationtools.com";
export const SITE_NAME = "HIT - Health Integration Tools";
export const SITE_TAGLINE =
  "Free tools for healthcare integration: HL7 SQL generation, de-identification, ward analytics, catchment mapping, and diagramming.";

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
    title: "HIT - Health Integration Tools for HL7 & Healthcare IT",
    description:
      "Free healthcare integration toolkit: generate HL7 parsing SQL, de-identify PHI, map patient catchments to SA2, answer ward analytics questions, and design integration diagrams.",
    h1: "Health Integration Tools",
    summary:
      "HIT is a free toolkit for healthcare integration teams. Generate SQL stored procedures that parse RAW HL7 messages, pseudonymize PHI inside your own database, turn patient addresses into SA2 catchment codes, answer twelve ward analytics questions from ADT messages, trace messages in archives with PowerShell, and design integration architecture diagrams.",
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
      "Curated healthcare integration resources: HL7 FHIR, DICOM, V2-to-FHIR converter, data-quality auditor, prior-auth readiness, de-identification, catchment and ward analytics.",
    h1: "Integration Resources",
    summary:
      "Curated standards (HL7 FHIR, DICOM) and interactive HIT tools: V2 to FHIR Converter, HL7 Data-Quality Auditor, Prior-Auth Readiness Checker, HL7 SQL Builder, HL7 De-Identify SQL, Catchment Kit (PID-11 to SA2), Ward Analytics (PID x PV1), HL7 Segment Mapper, Integration Architect, and MessageTrace archive search.",
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
    title: "HL7 De-Identify SQL - Pseudonymize PHI Inside Your Database",
    description:
      "Generate stored procedures that pseudonymize HL7 PHI in place: consistent fictional MRNs, shifted dates, fake names and addresses. Safe Harbor preset. Your data never leaves your database.",
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
    title: "Ward Analytics - 12 PID x PV1 Questions Answered from RAW HL7",
    description:
      "Twelve copy-paste ward analytics queries for SQL Server, PostgreSQL, and MySQL: LOS by ward, turnover, live census, ED boarding, readmissions, long-stay outliers and more.",
    h1: "Ward Analytics: PID x PV1",
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
      "Design healthcare integration flows with AI-assisted PlantUML generation, save locally, and export professional diagrams. Free.",
    h1: "Integration Architect",
    summary:
      "The premier HIT tool for designing healthcare integration flows: AI-assisted PlantUML diagram generation with local saving and professional export for EMRs, LIS, billing, and interface engines.",
    schema: "SoftwareApplication",
  },
  {
    path: "/integration-diagram",
    title: "Integration Diagram Whiteboard - Freeform Healthcare Canvas",
    description:
      "Freeform whiteboard canvas for sketching healthcare system connections, interfaces, and data flows. Free.",
    h1: "Integration Diagram Tool",
    summary:
      "A freeform drawing canvas for documenting healthcare system connections and data flows between EMRs, laboratories, pharmacies, and billing systems.",
    schema: "SoftwareApplication",
  },
  {
    path: "/v2-to-fhir-converter",
    title: "V2 to FHIR Converter - Free HL7 to FHIR R4 Bundle Tool",
    description:
      "Paste HL7v2 ADT or ORU and get a FHIR R4 Bundle (US Core / AU Core). Free, runs in your browser, no PHI uploaded.",
    h1: "V2 to FHIR Converter",
    summary:
      "Convert HL7v2 ADT and ORU messages into FHIR R4 Bundles with Patient, Encounter, and Observation resources. Choose Base R4, US Core, or AU Core profiles, see field-level mappings and unmapped segments, then copy or download the JSON. Everything runs locally in your browser.",
    schema: "SoftwareApplication",
    steps: [
      "Paste an ADT or ORU message or load a sample",
      "Choose Base R4, US Core, or AU Core",
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
    path: "/prior-auth-readiness",
    title: "Prior Auth Readiness Checker - Free CMS 2026 FHIR Guide",
    description:
      "Check CMS prior-auth readiness: FHIR APIs, Da Vinci PAS, 72hr/7-day rules. Free score + action plan. Educational only.",
    h1: "Prior-Auth Readiness Checker",
    summary:
      "Assess readiness for the CMS Interoperability and Prior Authorization rule: FHIR Patient and Provider Access APIs, Payer-to-Payer exchange, and Da Vinci PAS/CRD/DTR workflows. Answer 12 questions, optionally attach a FHIR Bundle, and get a score plus a prioritised action plan. Free, educational, runs in your browser.",
    schema: "SoftwareApplication",
    steps: [
      "Answer the 12 readiness questions",
      "Optionally attach a FHIR Bundle from the V2 converter",
      "Review your score and deadline-mapped actions",
      "Copy the action plan and sample Claim skeleton",
    ],
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
