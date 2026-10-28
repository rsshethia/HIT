# Feature 02 — HL7 Data-Quality Auditor

> Route: `/hl7-data-quality-auditor` | Schema: `SoftwareApplication`
> Status: Approved (2026-10-28 log). Build in parallel with Feature 01 (shares fixtures).
> Privacy: 100% client-side paste-audit OR in-customer-DB SQL (mirrors Ward Analytics pattern).

## A. Internal brief (for you)

**Problem.** Ward Analytics, Catchment Kit, and any FHIR conversion all fail the same
way: bad feed data (missing PID-3, duplicate encounters, future discharge dates,
invalid PV1-2 patient classes, Z-segment chaos). Users blame the analytics; root cause
is the feed. No free tool currently gives a one-click feed health score.

**v1 scope.**
- Inputs: paste 1–50 messages OR point at existing RAW HL7 table (generate audit SQL for SQL Server/PG/MySQL — same generator pattern as SQL Builder).
- Outputs: health score (0–100) + issue table by severity (Blocker/Warning/Info) across
  completeness, validity, consistency, duplicates: MSH-9/10/11, PID-3/5/7/8/11, PV1-2/3/7/19/44/45,
  DG1-3 coding, OBX-3/5/6 units, duplicate MSH-10 / PID-3+PV1-19 pairs, chronological sanity (admit < discharge).
- Copy report (Markdown) + download CSV of issues. Synthetic fixture pack included.
- Non-goals v1: live interface-engine tailing, auto-fix writes, terminology validation
  against live FHIR servers (deferred to Validator Lite).

**Risks / ins-and-outs.**
- Scoring must be explainable: weight completeness 40 / validity 30 / consistency 20 / duplicates 10; every deduction links to a row.
- Large pastes (10k+ lines) will freeze the tab — cap paste at 50 messages v1, push bigger audits to the SQL path.
- False positives erode trust: mark site-configurable rules (e.g. unknown PV1-2 values) as Warning, never Blocker, with "why this matters" tooltip.

**Effort.** 3–5 days. Parser shared with Feature 01. SQL generator reuses SQL Builder dialect switch.

**SEO draft (paste-ready for `shared/seo.ts`):**
- `path`: `/hl7-data-quality-auditor`
- `title`: `HL7 Data Quality Auditor - Free ADT Feed Health Check`
- `description`: `Audit HL7 ADT feeds for missing IDs, duplicates, and bad dates. Free health score + SQL for SQL Server, PostgreSQL, MySQL.`
- `h1`: `HL7 Data-Quality Auditor`
- `summary`: `Check HL7v2 ADT feed quality before analytics or FHIR migration: completeness, validity, consistency, and duplicates across MSH, PID, PV1, DG1, and OBX. Get a 0-100 health score, an issue table, and runnable audit SQL for SQL Server, PostgreSQL, or MySQL. All processing stays in your browser or database.`
- `schema`: `SoftwareApplication`
- `steps`: ["Paste messages or generate audit SQL for your database","Run the completeness, validity, and duplicate checks","Review the 0-100 score and severity-ranked issues","Export the Markdown report or CSV and fix at source"]

**Agent-friendly one-liner:** "HIT Data-Quality Auditor scores synthetic or customer-hosted HL7v2 ADT feeds 0-100 on completeness, validity, consistency, and duplicates, and emits runnable audit SQL plus an exportable issue report."

## B. Education sheet

**Executive.** Bad data makes every dashboard and migration lie. This is a free
"blood test" for your HL7 feed: one score, ranked issues, and the SQL to prove it
to your vendor — before you spend on analytics or FHIR work.

**Clinical.** Missing MRNs, duplicate visits, and wrong discharge dates become
wrong LOS, wrong census, wrong readmission counts. The auditor catches them at source.

**Business.** Each Blocker maps to a contract conversation ("vendor must populate
PID-3 per spec") and each Warning to a project task. Export the report straight into a ticket.

**Technical.** Rules engine over parsed segments: presence checks, value-set checks
(PV1-2 ∈ {E,I,O,P,R...}), DTM parse + admit<discharge invariant, MSH-10 uniqueness,
PID-3+PV1-19 encounter dedup. SQL path: `COUNT(*) ... WHERE fn_GetHL7Field(...) IS NULL`
aggregates per rule so DBAs can schedule it nightly.

## C. Test kit

1. **T1 Clean feed (5 msgs)** — expect score ≥ 95, zero Blockers.
2. **T2 Missing PID-3 in 1 msg** — expect Blocker, row cites PID-3, score drops, SQL variant filters it.
3. **T3 Duplicate MSH-10 resend** — expect duplicate Warning (not double-counted as two encounters).
4. **T4 Discharge before admit** — expect Blocker (chronology), message ID cited.
5. **T5 Invalid PV1-2 `X`** — expect Warning with allowed-values hint.
6. **T6 OBX missing units + DG1 free-text** — expect 2 Warnings, export CSV has 1 row per issue with segment/field/message index.
7. **T7 Scale guard** — paste 60 messages → friendly "cap at 50, use SQL path" notice, no freeze.
8. **T8 Privacy** — no network POST; SQL path contains no literal PHI, only field-access expressions.

Acceptance: 8/8 + snapshot `__snapshots/hl7-data-quality-auditor.html` verified.

## D. Founder understanding checkpoint

1. Why does every analytics failure trace back to feed quality — give one LOS example?
2. What are the 4 scoring pillars and why is completeness weighted highest?
3. Paste path vs. SQL path: when do you recommend each?
4. Which rules are Blockers vs. Warnings, and why does that distinction protect credibility?
5. How does a clean audit de-risk Features 01 and 03?
