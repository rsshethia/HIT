# HIT SDLC Cycle — For These 3 Deployments

> **Scope:** V2→FHIR Converter, Data-Quality Auditor, Prior-Auth Readiness Checker.
> **Companion:** `2026-10-28-new-tools-decision-log.md` (why) + `features/*.md` (what per tool).
> **Repo fit:** Vite SPA + wouter + `shared/seo.ts` → `usePageMeta` → `scripts/prerender.ts`.

## Executive view (1 minute)

Each tool passes through **6 gates**: Discover → Design → Build → Verify → Release → Learn.
Nothing ships unless SEO/agent metadata, synthetic test kit, and privacy check all pass.
You get one short sign-off per gate — no surprises at launch.

## The 6 phases

### Phase 1 — Discover (0.5–1 day per tool)
- **Input:** feature pack `internal-brief` + education sheet.
- **Activities:** confirm user (clinical / business / technical), confirm v1 scope vs. deferred, confirm route + SEO draft.
- **Gate G1 exit:** route slug frozen, SEO draft approved, v1 inclusions/exclusions listed.
- **Artifact:** update decision log appendix if scope changes.

### Phase 2 — Design (1–2 days)
- **Input:** G1 sign-off.
- **Activities:**
  - Page skeleton (reuse `hl7-sql-builder.tsx` layout: input → options → output → copy/export).
  - Sample synthetic messages + expected outputs (from test kit).
  - SEO entry drafted in `shared/seo.ts` shape (`path, title, description, h1, summary, schema, steps`).
  - Privacy review: 100% client-side or in-customer-DB? No network PHI? Synthetic data only?
- **Gate G2 exit:** design + SEO draft + privacy note approved.

### Phase 3 — Build (3–5 days per tool, #1 and #2 can parallelise)
- **Implementation checklist per tool:**
  1. New page under `client/src/pages/<slug>.tsx`, lazy import in `client/src/App.tsx` + `<Route>`.
  2. Card entry in `client/src/pages/resources.tsx` (Featured category).
  3. `ROUTE_META` entry in `shared/seo.ts` + `usePageMeta("<path>")` call in page.
  4. Copy/export buttons (reuse existing `queryClient` / `ui` components, no new deps unless justified).
  5. Synthetic fixtures co-located (e.g. `client/src/data/<slug>-samples.ts`).
- **Conventions:** no server PHI storage; existing patterns only (Tailwind + shadcn + zod where needed).
- **Gate G3 exit:** `npm run check` (tsc) passes, page renders locally via `npm run dev`.

### Phase 4 — Verify (1–2 days, uses the per-feature Test Kit)
- **Functional:** run every test-kit case (valid + edge + invalid input). Record pass/fail in the test-kit file.
- **Cross-checks:**
  - `npm run build` succeeds AND `dist/public/__snapshots/<slug>.html` exists with correct title/H1/summary/JSON-LD.
  - View-source / curl snapshot contains canonical URL + nav links (agent-fetchable).
  - Lighthouse/manual: title ≤ 60 chars, description 140–160 chars, single H1, canonical matches `CANONICAL_HOST`.
  - Privacy: DevTools Network shows no PHI POST; output reproducible offline.
- **Gate G4 exit:** all test-kit boxes ticked, snapshot verified, founder sign-off.

### Phase 5 — Release (0.5 day)
1. Merge → `npm run build` → deploy `dist/` (existing pipeline).
2. Smoke test prod URLs: `/`, `/resources`, + 3 new routes. Confirm prerendered snapshots served to bots.
3. Update decision log §5 checkboxes.
- **Gate G5 exit:** prod smoke pass, log updated.

### Phase 6 — Learn (ongoing, 2 weeks post-launch)
- Collect: page visits, copy-button uses, error reports, user questions.
- Decide: fix, extend (Tier 2 ideas), or defer. Append outcome to decision log — never rewrite history.
- **Gate G6 exit:** 2-week note appended.

## SEO + agent-friendly requirements (every tool, enforced at G2/G4)

Each `shared/seo.ts` entry must provide:
`path, title, description, h1, summary, schema ("SoftwareApplication"), steps[]`.
Rules:
- `title`: includes primary keyword (e.g. "V2 to FHIR", "HL7 Data Quality", "Prior Auth Readiness") + "Free".
- `description`: 140–160 chars, states input → output + "no PHI leaves your browser/database".
- `summary`: 2–3 sentences a search bot or AI agent can quote verbatim.
- `steps`: 4–6 imperative steps mirroring the page's actual workflow (prerender renders these as `<ol>`).
- `jsonLdFor()` auto-emits Schema.org `SoftwareApplication` with `isAccessibleForFree: true` — do not hand-write JSON-LD.

## Roles

| Role | Responsibility |
|------|---------------|
| Founder (you) | G1–G6 sign-offs, scope cuts, launch go/no-go |
| Builder (agent) | Design/build/verify artefacts, test-kit runs, SEO wiring |
| Reviewer (agent or peer) | G4 independent re-run of test kit + snapshot check |

## Build order and dependencies

```
#1 V2→FHIR Converter ──┐
                        ├─→ #3 Prior-Auth Checker (reuses #1 FHIR output)
#2 Data-Quality Auditor ─┘  (shares synthetic ADT fixtures with #1)
```

Suggested calendar: Week 1 — G1/G2 for #1+#2. Week 2 — Build #1+#2. Week 3 — Verify #1+#2, G1/G2 for #3. Week 4 — Build/Verify/Release #3 + Learn notes for #1/#2.
