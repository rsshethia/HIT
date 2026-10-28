# HIT New Tools Decision Log — 2026-10-28

> **Purpose:** Single referable record of what was decided, why, and what ships next.
> **Status:** Approved — proceed to SDLC (see `../sdlc-cycle.md`).
> **Owner:** Founder. **Site:** https://dev.healthcareintegrationtools.com/

## 1. Executive summary (non-technical)

HIT today is strong at **HL7v2 + SQL analytics + privacy + diagramming** (8 tools).
The market has moved to **FHIR + compliance deadlines + operational resilience**.

We approved 3 new free tools that bridge our existing audience into FHIR without
abandoning what works (in-browser / in-customer-DB, no PHI leaves the customer):

1. **V2 → FHIR Converter** (`/v2-to-fhir-converter`) — paste ADT → get FHIR R4 Bundle.
2. **HL7 Data-Quality Auditor** (`/hl7-data-quality-auditor`) — find feed problems before they break analytics.
3. **Prior-Auth Readiness Checker** (`/prior-auth-readiness`) — CMS-0057-F checklist + sample Da Vinci bundle.

Build order: **1 → 2 → 3**. Auditor (#2) can be built in parallel with #1 because
it shares test messages. #3 last because it reuses #1's FHIR output.

## 2. Current catalogue (verified 2026-10-28)

| # | Tool | Route | What it does |
|---|------|-------|--------------|
| 1 | HL7 SQL Builder | `/hl7-sql-builder` | RAW HL7 → SQL Server/PG/MySQL stored procedures |
| 2 | HL7 De-Identify SQL | `/hl7-deidentify-sql` | In-DB pseudonymization, Safe Harbor preset |
| 3 | Catchment Kit PID-11→SA2 | `/hl7-catchment-kit` | Offline G-NAF + ABS ASGS geocoding |
| 4 | Ward Analytics PID×PV1 | `/hl7-ward-analytics` | 12 copy-paste ward questions |
| 5 | MessageTrace | `/message-trace` | PowerShell archive search |
| 6 | Integration Architect | `/integration-architect` | PlantUML + AI assist |
| 7 | Integration Diagram | `/integration-diagram` | Freeform canvas |
| 8 | HL7 Segment Mapper | `/hl7-segment-mapper` | ADT/ORU/ORM/SIU graph |
| — | Resources hub | `/resources` | FHIR, DICOM links + internal tools |

Stack: Vite + React + wouter, `shared/seo.ts` single source for SEO,
`usePageMeta(path)` for head tags, `scripts/prerender.ts` for bot snapshots.
Pattern: client-side generators, no PHI exfil.

## 3. Trends that drove this decision (2025–2026)

- **FHIR R4 operational, R5/R6 emerging.** #1 adoption barrier = lack of FHIR knowledge (HL7/Firely 2025 State of FHIR, 59/82).
- **TEFCA 10M → 500M records (Jan 2025 → Feb 2026).** 8–11 QHINs live. Point-to-point → network model.
- **HTI-1 / USCDI v3 baseline 2026-01-01 + info-blocking enforcement live** (ASTP/ONC non-conformity letters Feb 2026, OIG up to $1M/violation).
- **CMS Prior Auth Final Rule CMS-0057-F in force Jan 2026** (72hr / 7-day), FHIR APIs by Jan 2027. Da Vinci PAS/CRD/DTR.
- **Australia: Sparked AU Core / AUCDI R3 + MHR FHIR baseline**, $598M/2yr, Telstra Health $33M CDA→FHIR.
- **V2 stays.** Strategy must support v2 + FHIR coexistence; V2→FHIR mapping is top practical pain.
- **New developer stack:** Bulk Data v3, SQL on FHIR, SMART on FHIR gaining traction.
- **SDOH Z-codes (Z55–Z65) under-coded**, now in USCDI v3 / Gravity SDOH IG v3.
- **Ransomware = patient safety:** ~17+ days degraded ops, immutable backups + rehearsed paper downtime expected.

## 4. What we considered and deferred

Deferred (still valid, lower priority): FHIR Validator Lite, Terminology Quick-Map,
SQL-on-FHIR Starter, Engine Observability Kit, Consent/De-ID v2 for FHIR,
SDOH Analytics Kit, Downtime & Recovery Kit, TEFCA/Info-Blocking Self-Check,
AU Sparked/MHR Checker. Revisit after Tier 1 ships.

## 5. Definition of done for this batch

- [ ] 3 routes live, listed in `resources.tsx`, `shared/seo.ts`, `App.tsx` (lazy route).
- [ ] `usePageMeta()` wired, `npm run build` prerenders 3 new snapshots.
- [ ] Each tool has internal brief + education sheet + test kit (see `features/`).
- [ ] No PHI leaves browser/DB; sample data is synthetic only.
- [ ] `npm run check` passes.

## 6. How to refer to this log in future

Reference by date + tool slug, e.g. `2026-10-28 / v2-to-fhir-converter`.
Feature packs live in `docs/roadmap/features/`. SDLC gates live in `../sdlc-cycle.md`.
Update this file (append, never rewrite history) when scope or order changes.

## 7. Build record — 2026-10-28 (append-only)

Built in one batch, SDLC G1–G3 complete:
- `client/src/lib/hl7-parse.ts` — shared MSH-aware parser, DTM, gender/class maps.
- `client/src/data/v2-to-fhir-samples.ts` — 5 synthetic fixtures shared by tools 01+02.
- `client/src/pages/v2-to-fhir-converter.tsx` — converter (Bundle + field-map tabs, Base/US/AU profiles).
- `client/src/pages/hl7-data-quality-auditor.tsx` — auditor (0-100 score, ranked issues, 3-dialect audit SQL).
- `client/src/pages/prior-auth-readiness.tsx` — 12-question quiz, ADT-prefilled PAS Claim skeleton, deadline constants.
- Wiring: `App.tsx` lazy routes, `nav-bar.tsx` HL7 group, `resources.tsx` Featured cards,
  `shared/seo.ts` 3 new `ROUTE_META` entries (+ `/resources` summary refreshed).
- Shell runner unavailable in this environment — run `npm run check` and `npm run build`
  (confirm 3 new files under `dist/public/__snapshots/`) before release (SDLC G4).

## 8. Session note — 2026-10-28 (paused, to continue)

- Decision log, SDLC cycle, 3 feature packs, and LinkedIn posts all saved under `docs/roadmap/`.
- All 3 tools built + wired (routes, nav, resources, SEO). Type errors fixed as reported:
  line-143 ternary syntax, Set-spread target issue (2 files), `allowedHosts` widening in `server/vite.ts`.
- Still open: founder runs `npm run check` + `npm run build` (shell broken in build env),
  executes the 3 test kits (SDLC G4), then release + learn notes (G5/G6).
