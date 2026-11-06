// Single source of truth for site navigation AND the Resources page.
// Titles, hrefs and short descriptions are defined once here so the nav menu,
// the mobile filter and the Resources sections always tell the same story.
// `blurb` is the longer card copy used on Resources; `desc` is the short
// line used inside nav dropdowns. hrefs are stable entry points — do not
// change them when restyling.

export interface NavChild {
  label: string;
  href: string;
  desc: string;
  blurb: string;
}

export interface NavGroup {
  label: string;
  icon: string;
  children: NavChild[];
}

// State roadmaps scale one child per state — the group becomes a dropdown
// automatically at two children, so future states slot in with one line each.
export const NAV_GROUPS: NavGroup[] = [
  {
    label: "State Guides",
    icon: "map",
    children: [
      {
        label: "Victoria Roadmap 2026–31",
        href: "/guides/victoria",
        desc: "VIC pillars mapped to HIT tools",
        blurb:
          "Plain-English map of Victoria's Digital Health Vision and Roadmap to HIT tools — separate tracks for doers (engineers, analysts) and decision-makers (CIOs, LHSN leads).",
      },
      {
        label: "Tasmania Transformation 2022–32",
        href: "/guides/tasmania",
        desc: "TAS horizons mapped to HIT tools",
        blurb:
          "Plain-English map of Tasmania's $476M Digital Health Transformation (3 horizons) to HIT tools — eReferrals, EMR/EMM, flow, portals, FHIR care platform. Stories from Jim, Jane, Michael and Alex.",
      },
    ],
  },
  {
    label: "Diagram",
    icon: "account_tree",
    children: [
      {
        label: "Integration Architect",
        href: "/integration-architect",
        desc: "PlantUML diagrams + save & export",
        blurb:
          "The premier tool for designing healthcare integration flows. Features template-based PlantUML generation, local saving, and professional export options.",
      },
    ],
  },
  {
    label: "HL7",
    icon: "terminal",
    children: [
      {
        label: "SQL Builder",
        href: "/hl7-sql-builder",
        desc: "HL7 parse stored procedures",
        blurb:
          "Generate SQL stored procedures to parse RAW HL7 messages stored in your database. Select segments and fields from ADT messages, and get ready-to-use SQL for SQL Server, PostgreSQL, or MySQL.",
      },
      {
        label: "V2 → FHIR Converter",
        href: "/v2-to-fhir-converter",
        desc: "ADT/ORU/SIU to FHIR R4 (AU Core first)",
        blurb:
          "Paste synthetic ADT, ORU or SIU messages and get a FHIR R4 Bundle (AU Core first, Base, US Core): field-level map, unmapped list, copy/download. Runs in your browser.",
      },
      {
        label: "Data-Quality Auditor",
        href: "/hl7-data-quality-auditor",
        desc: "Feed health score + audit SQL",
        blurb:
          "One-click feed health score (0-100) across completeness, validity, consistency, and duplicates — plus read-only audit SQL for SQL Server, PostgreSQL, and MySQL.",
      },
      {
        label: "eReferral Starter Kit",
        href: "/ereferral-kit",
        desc: "Referral gap score + tracking SQL",
        blurb:
          "8-question referral readiness score with fix-in-order action plan, sample REF mapped to FHIR ServiceRequest, and read-only tracking SQL. For teams still losing referrals to fax and paper.",
      },
      {
        label: "Prior-Auth (US only)",
        href: "/prior-auth-readiness",
        desc: "US CMS-0057-F check — not for AU use",
        blurb:
          "US-only: twelve questions for CMS-0057-F / Da Vinci readiness. Not applicable in Australia (Medicare, MBS/PBS, My Health Record). Kept for US visitors, educational.",
      },
      {
        label: "De-Identify SQL",
        href: "/hl7-deidentify-sql",
        desc: "De-identify health info in your DB",
        blurb:
          "Generate stored procedures that de-identify health information inside your own database. Point at your HL7 table and column — consistent fictional IDs keep journeys linkable. Mapping tables stay internal.",
      },
      {
        label: "Catchment Kit",
        href: "/hl7-catchment-kit",
        desc: "PID-11 address → SA2 in SQL",
        blurb:
          "One-click SQL kit that turns patient street address into SA2 (Statistical Area 2) catchment codes inside your own SQL Server — offline, no health information leaves the database. Maps by service, visit type, or attending doctor.",
      },
      {
        label: "Ward Analytics",
        href: "/hl7-ward-analytics",
        desc: "12 ward questions in SQL",
        blurb:
          "Twelve copy-paste questions answered from your RAW HL7 — ward LOS, turnover, live census, boarding, readmissions and more. Your messages are parsed once; every question reads from one table. SQL Server, PostgreSQL and MySQL.",
      },
      {
        label: "Segment Mapper",
        href: "/hl7-segment-mapper",
        desc: "Segments ↔ message graph",
        blurb:
          "New to HL7? An interactive graph showing which segments each message type (ADT, ORU, ORM, SIU) carries — click any dot for details.",
      },
      {
        label: "MessageTrace",
        href: "/message-trace",
        desc: "PowerShell archive search",
        blurb:
          "MessageTrace is a lightweight PowerShell tool to rapidly locate HL7 messages in production archives. Search by patient ID, visit number, or location across thousands of files in seconds. No database setup, no external dependencies.",
      },
    ],
  },
];

// In-menu workflow sections for long groups. Keyed by href so links stay
// untouched; order of children is preserved, captions only aid scanning.
// The Resources page mirrors these same sections.
export const SECTION_BY_HREF: Record<string, string> = {
  "/hl7-sql-builder": "Build",
  "/v2-to-fhir-converter": "Build",
  "/ereferral-kit": "Build",
  "/hl7-data-quality-auditor": "Assure",
  "/prior-auth-readiness": "Assure",
  "/hl7-deidentify-sql": "Assure",
  "/hl7-catchment-kit": "Apply",
  "/hl7-ward-analytics": "Apply",
  "/hl7-segment-mapper": "Explore",
  "/message-trace": "Explore",
};

export const SECTION_ORDER = ["Build", "Assure", "Apply", "Explore"];

export const DIRECT_LINKS = [
  { label: "Home", href: "/" },
  { label: "Resources", href: "/resources" },
  { label: "About", href: "/about" },
];

export const EXTERNAL_STANDARDS = [
  {
    label: "HL7 FHIR",
    href: "https://www.hl7.org/fhir/",
    blurb:
      "Fast Healthcare Interoperability Resources (FHIR) is a standard for healthcare data exchange, published by HL7.",
  },
  {
    label: "DICOM",
    href: "https://www.dicomstandard.org/",
    blurb:
      "Digital Imaging and Communications in Medicine (DICOM) is the standard for medical imaging information.",
  },
];
