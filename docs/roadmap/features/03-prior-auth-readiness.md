# Feature 03 — Prior-Auth Readiness Checker

> Route: `/prior-auth-readiness` | Schema: `SoftwareApplication`
> Status: Approved (2026-10-28 log). Build after Features 01+02 (reuses FHIR output + quality rules).
> Privacy: 100% client-side questionnaire + synthetic bundle builder. Educational, not legal advice.

## A. Internal brief (for you)

**Problem.** CMS-0057-F is in force (Jan 2026): 72hr urgent / 7-day standard decisions,
FHIR Patient/Provider/Payer-to-Payer APIs, ePA APIs by Jan 2027. Providers and payers —
especially smaller ones — don't know if they're ready. Da Vinci PAS/CRD/DTR IGs are
intimidating. This is the highest-search-intent 2026–2027 topic with zero good free tools.

**v1 scope.**
- Inputs: 12-question readiness quiz (EHR FHIR R4 endpoints? Patient Access API live?
  clinical reason capture? ePA workflow owner?) + optional paste of Feature-01 FHIR Bundle.
- Outputs: readiness score (Not started / Progressing / Ready) + prioritised action list
  mapped to CMS deadlines + sample Da Vinci PAS-style `Claim` bundle skeleton generated
  from the pasted Bundle (patient, encounter, diagnosis stub) + documentation checklist
  (what to attach so medical-necessity AI doesn't auto-deny).
- Copy action plan (Markdown). Disclaimer: educational readiness aid, not compliance advice.
- Non-goals v1: live payer endpoint testing, real PA submission, payer-specific rules
  (e.g. WISeR six-state list is informational link only), legal interpretation.

**Risks / ins-and-outs.**
- Regulatory dates shift: store deadlines as data (`2026-01-01`, `2027-01-01`) with links
  to CMS pages so updates are one-line edits. Never hard-code prose dates in components.
- Must not encourage fabrication: generator marks every synthetic element `_synthetic: true`
  and watermarks output "SAMPLE — DO NOT SUBMIT".
- Highest reputational risk of the three: add visible disclaimer + link to CMS ePA + Da Vinci IGs.

**Effort.** 3–4 days after #1 ships (imports its Bundle type + samples).

**SEO draft (paste-ready for `shared/seo.ts`):**
- `path`: `/prior-auth-readiness`
- `title`: `Prior Auth Readiness Checker - Free CMS 2026 FHIR Guide`
- `description`: `Check CMS prior-auth readiness: FHIR APIs, Da Vinci PAS, 72hr/7-day rules. Free score + action plan. Educational only.`
- `h1`: `Prior-Auth Readiness Checker`
- `summary`: `Assess readiness for the CMS Interoperability and Prior Authorization rule: FHIR Patient and Provider Access APIs, Payer-to-Payer exchange, and Da Vinci PAS/CRD/DTR workflows. Answer 12 questions, optionally attach a FHIR Bundle, and get a score plus a prioritised action plan. Free, educational, runs in your browser.`
- `schema`: `SoftwareApplication`
- `steps`: ["Answer the 12 readiness questions","Optionally attach a FHIR Bundle from the V2 converter","Review your score and deadline-mapped actions","Copy the action plan and sample Claim skeleton"]

**Agent-friendly one-liner:** "HIT Prior-Auth Readiness Checker scores CMS-0057-F preparedness across FHIR APIs and Da Vinci workflows from a 12-question quiz plus an optional FHIR Bundle, emitting a deadline-mapped action plan and watermarked sample Claim skeleton."

## B. Education sheet

**Executive.** Prior auth is now a 72-hour / 7-day legal clock with FHIR APIs due
Jan 2027. This 5-minute checker tells you where you stand (red/amber/green), what to
fix in what order, and who owns it — before denials or penalties do it for you.

**Clinical.** Faster approvals = faster treatment. The checklist shows what documentation
(medical necessity, codes, prior results) must be in the record so AI-assisted payer
review doesn't bounce your order.

**Business.** Map each gap to an owner (EHR vendor, RCM, IT) and a CMS date. Export the
plan into your governance meeting. Payer-to-Payer exchange = fewer repeat faxes.

**Technical.** Da Vinci in one paragraph: CRD (should I order PA?) → DTR (what do they
need?) → PAS (submit `Claim` + supporting `QuestionnaireResponse`) over FHIR R4.
Our skeleton emits `Claim(use=preauthorization, status=active)` + referenced Patient/Encounter/Condition stubs with correct `meta.profile` hints.

## C. Test kit

1. **T1 All-"no" answers** — expect "Not started", actions ordered by earliest deadline first.
2. **T2 All-"yes" answers** — expect "Ready", no Blockers, congrats + sustainment actions only.
3. **T3 Mixed + Bundle attached** — expect Claim skeleton populated with Bundle's patient ID + encounter dates; watermark present.
4. **T4 No Bundle** — expect skeleton with synthetic placeholders clearly labelled, still copyable.
5. **T5 Disclaimer** — visible on page AND in copied Markdown ("educational, not legal/compliance advice" + CMS link).
6. **T6 Privacy** — no network POST; refresh clears quiz + Bundle.
7. **T7 Dates as data** — change deadline constant → UI + copied plan both update (no hard-coded prose date).

Acceptance: 7/7 + snapshot `__snapshots/prior-auth-readiness.html` verified.

## D. Founder understanding checkpoint

1. What are the 3 CMS clocks/dates a CEO must recite (72hr, 7-day, Jan 2027 APIs)?
2. CRD → DTR → PAS in one sentence each — and which one does our skeleton demonstrate?
3. Why is the watermark + disclaimer a launch blocker, not a nice-to-have?
4. How do Features 01 (Bundle) and 02 (quality) make this score trustworthy?
5. What is the one-line update path when CMS changes a date or link?
