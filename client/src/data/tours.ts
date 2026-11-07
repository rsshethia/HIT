import type { DriveStep } from "driver.js";

// Self-paced tour content, one export per tool. Steps reference stable
// data-testid selectors on the page — not CSS classes — so restyling
// never breaks the tour. Keep language plain: what it is, one action,
// what happens next.

// ---------------------------------------------------------------------------
// V2 → FHIR Converter — 60-second tour: message in, Bundle out, map checked.
// Follows the data flow left to right. The SIU stop is hands-on: the copy
// invites one click on the SIU sample rather than auto-changing user input.
// ---------------------------------------------------------------------------
export const V2_FHIR_TOUR: DriveStep[] = [
  {
    popover: {
      title: "HL7 in, FHIR out — 60 seconds",
      description:
        "Paste a synthetic message, pick a profile, get a FHIR Bundle with a field-by-field map. 7 stops, following the data left to right.",
    },
  },
  {
    element: '[data-testid="tour-samples"]',
    popover: {
      title: "1 · Start with a sample",
      description:
        "An emergency admit, lab results, a discharge — each shows a different FHIR shape. Try SIU-S12 later to watch a booking become an Appointment.",
    },
  },
  {
    element: '[data-testid="tour-input"]',
    popover: {
      title: "2 · Or paste your own",
      description:
        "Synthetic messages only — never real patient data. Everything converts in your browser; the first 10 messages are converted live.",
    },
  },
  {
    element: '[data-testid="tour-profile"]',
    popover: {
      title: "3 · Pick the profile",
      description:
        "AU Core 1.0 is the default — the profile My Health Record speaks. Switch to Base R4 or US Core to compare what changes.",
    },
  },
  {
    element: '[data-testid="tour-bundletab"]',
    popover: {
      title: "4 · The live Bundle",
      description:
        "Patient, Encounter, Observation, Condition, Appointment — assembled as you type. This is what your feed looks like to a FHIR server.",
    },
  },
  {
    element: '[data-testid="tour-maptab"]',
    popover: {
      title: "5 · The field map",
      description:
        "Click here next: every HL7 field accounted for — mapped, note, or honestly unmapped. Nothing disappears silently.",
    },
  },
  {
    element: '[data-testid="tour-copy"]',
    popover: {
      title: "6 · Take it with you",
      description:
        "Copy the JSON or download the Bundle. Then check the feed's health in the Data-Quality Auditor before migrating anything real.",
    },
  },
];
// ---------------------------------------------------------------------------
// HL7 SQL Builder — 60-second tour: tick fields, get a stored procedure.
// ---------------------------------------------------------------------------
export const SQL_BUILDER_TOUR: DriveStep[] = [
  {
    popover: {
      title: "SQL Builder in 60 seconds",
      description:
        "This tool turns ticked checkboxes into a stored procedure that parses RAW HL7 messages into a table. Follow the highlights — 6 stops.",
    },
  },
  {
    element: '[data-testid="button-select-common"]',
    popover: {
      title: "1 · Start here: Common Fields",
      description:
        "New here? This ticks the everyday set — patient ID, name, visit, ward, dates — so you see a full script instantly. You can untick anything after.",
    },
  },
  {
    element: '[data-testid="accordion-trigger-PID"]',
    popover: {
      title: "2 · Segments open like folders",
      description:
        "Each HL7 segment (PID, PV1, MSH…) opens to show its fields. PID holds who the patient is; PV1 holds where they are in the hospital.",
    },
  },
  {
    element: '[data-testid="checkbox-field-PID-3"]',
    popover: {
      title: "3 · Tick exactly what you need",
      description:
        "PID-3 is the patient ID (UR / MRN). Tick it and watch the SQL on the right grow — every checkbox maps to one parsed column.",
    },
  },
  {
    element: '[data-testid="select-db-platform"]',
    popover: {
      title: "4 · Your database, your dialect",
      description:
        "Same procedure, three flavours: SQL Server, PostgreSQL, MySQL. Switch and the preview rewrites itself — copy whichever matches your server.",
    },
  },
  {
    element: '[data-testid="sql-output-area"]',
    popover: {
      title: "5 · Live SQL preview",
      description:
        "This is the finished script: parse helper, staging table, procedure. Run it in your own database — nothing here touches your data.",
    },
  },
  {
    element: '[data-testid="button-copy-sql"]',
    popover: {
      title: "6 · Take it with you",
      description:
        "Copy the script and run it. Then feed the parsed table into Ward Analytics — or check the feed's health in the Data-Quality Auditor first.",
    },
  },
];
