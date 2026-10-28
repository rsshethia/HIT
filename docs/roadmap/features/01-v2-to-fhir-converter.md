# Feature 01 — V2 → FHIR Converter

> Route: `/v2-to-fhir-converter` | Schema: `SoftwareApplication`
> Status: Approved (2026-10-28 log). Build first. Unblocks Feature 03.
> Privacy: 100% client-side. Paste HL7v2 → get FHIR JSON. Nothing uploaded.

## A. Internal brief (for you)

**Problem.** Your users live in HL7v2 but every 2026 mandate (TEFCA, CMS Prior Auth,
AU Sparked/MHR) speaks FHIR. Biggest community complaint: "I don't know FHIR and
mappings are inconsistent." Existing HIT SQL Builder parses v2; nothing emits FHIR.

**v1 scope.**
- Inputs: ADT A01/A03/A04/A08/A31 + ORU-R01 (paste box + 3 bundled synthetic samples).
- Outputs: FHIR R4 Bundle (Patient, Encounter, Observation for ORU, Coverage stub) with
  profile toggles: Base R4 / US Core / AU Core. Field-level map table + "unmapped" list.
- Copy JSON + download `.json`. No validation beyond required-field presence (full
  validator is deferred Tier 2).
- Explicit non-goals v1: R5/R6 output, CDA→FHIR, terminology translation (stub only),
  server-side conversion API.

**Risks / ins-and-outs.**
- HL7 official V2-to-FHIR IG exists but is verbose; we ship an opinionated 80/20 subset
  (PID→Patient, PV1→Encounter, OBX→Observation, DG1→Condition stub, NK1→RelatedPerson count).
- Repeating fields, date formats (`DTM`), and HL7 nulls (`""`) are where conversions silently break — test kit covers these.
- Must never accept real PHI; banner + "synthetic only" + no network call.

**Effort.** 3–5 days. Reuses SQL Builder page layout. No new deps (hand-rolled parser ~200 lines).

**SEO draft (paste-ready for `shared/seo.ts`):**
- `path`: `/v2-to-fhir-converter`
- `title`: `V2 to FHIR Converter - Free HL7 to FHIR R4 Bundle Tool`
- `description`: `Paste HL7v2 ADT or ORU and get a FHIR R4 Bundle (US Core / AU Core). Free, runs in your browser, no PHI uploaded.`
- `h1`: `V2 to FHIR Converter`
- `summary`: `Convert HL7v2 ADT and ORU messages into FHIR R4 Bundles with Patient, Encounter, and Observation resources. Choose Base R4, US Core, or AU Core profiles, see field-level mappings and unmapped segments, then copy or download the JSON. Everything runs locally in your browser.`
- `schema`: `SoftwareApplication`
- `steps`: ["Paste an ADT or ORU message or load a sample","Choose Base R4, US Core, or AU Core","Review the field-level map and unmapped list","Copy or download the FHIR JSON Bundle"]

**Agent-friendly one-liner:** "HIT V2-to-FHIR Converter turns synthetic HL7v2 ADT/ORU messages into FHIR R4 Bundles (Patient/Encounter/Observation) with US Core and AU Core profile toggles, entirely in the browser."

## B. Education sheet (publishable / shareable language)

**Executive (3 sentences).** Regulators and vendors now require FHIR, but your
interfaces still run HL7v2. This tool shows you exactly what your ADT data looks
like as FHIR so clinical, business, and technical teams can plan the migration
without hiring consultants for a first look.

**Clinical.** Your admission/discharge data becomes a shareable FHIR Patient +
Encounter record — the same shape My Health Record and US payer APIs expect.

**Business.** Use the output to answer: "Are we TEFCA / CMS-0057-F / Sparked ready?"
Unmapped fields = project scope = budget conversation backed by evidence.

**Technical.** PID-3→`Patient.identifier`, PID-5→`Patient.name`, PV1-2/3→
`Encounter.class/location`, OBX→`Observation(code, value, units)`. DTM→FHIR
`instant/dateTime`. Unknown Z-segments listed, never silently dropped.
Profiles add `meta.profile` + US/AU must-support slices (e.g. AU Core Indigenous status stub).

## C. Test kit (run at SDLC G4, record pass/fail)

Fixtures to bundle (`client/src/data/v2-to-fhir-samples.ts`):
1. **T1 ADT-A01 standard** — expect Bundle with 1 Patient + 1 Encounter, `identifier` from PID-3, `period.start` from PV1-44.
2. **T2 ADT-A08 update with repeat PID-3 + NK1** — expect primary + secondary identifiers, NK1 counted not lost.
3. **T3 ORU-R01 with 2 OBX (one coded, one free-text)** — expect 2 Observations, UCUM units preserved, abnormal flag → `interpretation`.
4. **T4 Edge: empty fields `||`, `""` null, DTM without timezone** — expect omitted (not empty-string) elements, date normalised or flagged.
5. **T5 Invalid: missing MSH, truncated PID** — expect friendly error naming the segment, no crash, no partial download.
6. **T6 Profile toggle** — same input under Base/US/AU yields correct `meta.profile` URLs; AU Core adds `extension` placeholder note.
7. **T7 Privacy** — DevTools Network shows zero POST during conversion; refresh clears input.

Acceptance: all 7 pass + snapshot `__snapshots/v2-to-fhir-converter.html` contains H1 + steps.

## D. Founder understanding checkpoint (5 questions you should own)

1. Which v2 segments map to which FHIR resources in our v1 — and what do we deliberately leave unmapped?
2. Why do we offer Base/US/AU toggles instead of one "correct" output?
3. What are the 3 silent-breakage risks (repeats, DTM, nulls) and how does the UI surface them?
4. Why is this tool client-side only, and what sentence do you say to a privacy officer?
5. How does this output feed Feature 03 (Prior-Auth Checker)?
