import type { DriveStep } from "driver.js";

// Self-paced tour content, one export per tool. Steps reference stable
// data-testid selectors on the page — not CSS classes — so restyling
// never breaks the tour. Keep language plain: what it is, one action,
// what happens next.

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
