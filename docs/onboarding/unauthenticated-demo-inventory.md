# MyLearna Unauthenticated Demo Inventory

Audit date: 2026-08-07  
Repository: `spbint/edudecks`  
Branch: `onboarding/unauthenticated-demo-v1`  
Parent SHA: `542aa034503fb4d2a8327dce3b23ebf25ebe27ad`

This is a documentation-only inventory for a future native unauthenticated
interactive Carter Family demo. No production application behaviour was
changed by this audit.

## 1. Public route and marketing map

| Route | Current file/component | Current behaviour and dependencies |
|---|---|---|
| `/` | `app/page.tsx` | Public homepage using `app/components/PublicSiteShell.tsx`. Primary links retain source attribution: `/start-free?source=home-primary` and `/start-free?source=home-header`; Carter CTA links to `/demo`. |
| `/demo` | `app/demo/page.tsx` → `components/demo/DemoShell.tsx` | Public, client-rendered fictional simulator. Page metadata uses `buildPublicMetadata` with a `/demo` canonical. |
| `/start-free` | `app/start-free/page.tsx` | Public setup form. Reads `source` from `useSearchParams`, stores a signup prefill in browser `localStorage`, tracks the existing Meta lead, then routes to `/signup?next=/my-profile&source=...`. It also handles an already authenticated browser. |
| `/login` | `app/login/page.tsx` → `app/components/EmailAuthPage.tsx` | Server checks for an authenticated user and redirects to `/my-day`; otherwise renders login email/password UI. |
| `/signup` | `app/signup/page.tsx` → `app/components/EmailAuthPage.tsx` | Server checks for an authenticated user and redirects to `/my-profile`; otherwise renders signup email/password UI. |
| Public shell | `app/components/PublicSiteShell.tsx` | Shared public header, nav, responsive hero, CTA, footer, social-link presentation and public links. Its shared nav still visibly includes `Start free`; this is distinct from the homepage header CTA changed on the prior branch. |
| Root metadata/providers | `app/layout.tsx`, `app/lib/publicMetadata.ts` | Root metadata, canonical/OG helper, GA, Google Ads, Meta Pixel, `AuthUserProvider`, and `GuidanceProvider` are mounted globally. |
| Truthfulness tests | `app/components/PublicLaunchTruthfulness.test.ts` | Source-oriented public copy, CTA, auth-language, metadata and truthfulness assertions. |

Remaining visible `Start free` wording includes the shared public navigation,
the `/start-free` eyebrow, the demo’s two signup links, and non-CTA copy such
as the homepage “Start free. Upgrade when you need more.” section. The
homepage’s current primary and header CTA constants are already separate from
those shared/public-surface occurrences.

## 2. Current Carter Family demo inventory

The existing `/demo` is a single scrolling journey controlled by
`components/demo/DemoShell.tsx`. Its local section state is:

`family → calendar → today → pathways → capture → portfolio → data → reports → outputs`

| Area | Current representation | Source and state boundary |
|---|---|---|
| Family | The Carter Family, Sarah Carter, North Carolina, USA | Static `carterFamilyDemo.family` in `lib/demo/carterFamilyDemoData.ts`. |
| Learners | Emma Carter, age 8, Grade 3; Noah Carter, age 11, Grade 6; subject focus maps | Static `carterFamilyDemo.learners`. No account or learner lookup. |
| Dates | Four weeks beginning 2026-03-02; current day Thursday, March 19, 2026 | `weekStarts`, deterministic `addDays`, `buildWeek`, and `currentDay` in the static data module. |
| Calendar | Four-week timetable, day columns, Week 1–4 filter, All/Emma/Noah filter | `components/demo/DemoCalendar.tsx`; React `useState` and `useMemo` only. No save/edit/delete. |
| My Day | Six fictional Thursday blocks | `components/demo/DemoDay.tsx` reads `carterFamilyDemo.currentDay`. |
| Pathways | Two mathematics pathways, current focus, secure history, later steps, current step, “Developing/Secure” sample signal, sample assessment options/results | `components/demo/DemoPathways.tsx` and `carterFamilyDemo.pathways`. Practise and Assess buttons are presentation-only; no mutation handler. |
| Worksheets/resources | No actual worksheet resource or link is represented; the pathway area contains labels and sample assessment text only | No worksheet import or resource client in the demo graph. |
| Capture/evidence | Eight fictional evidence records with learner, title, type and note | `components/demo/DemoCapture.tsx` reads `carterFamilyDemo.evidence`. Capture is a scroll handoff, not an input or save flow. |
| Portfolio | Six selected fictional portfolio items with reasons | `components/demo/DemoPortfolio.tsx` reads `carterFamilyDemo.portfolio`. No curation mutation. |
| My Data | Evidence count, momentum, pathway activity, reporting-readiness text, strengths and focus areas for Emma and Noah | `components/demo/DemoData.tsx` and `carterFamilyDemo.data`. This is a static summary, not the authenticated My Learna data dashboard. |
| Reports | March 2026 report paragraphs and suggested next steps for each learner | `components/demo/DemoReports.tsx` and `carterFamilyDemo.reports`. It is not the authenticated report renderer. |
| Outputs | Four output labels: monthly report, portfolio summary, evidence record, learning coverage snapshot | `components/demo/DemoOutputs.tsx` and `carterFamilyDemo.outputs`. |
| Sample PDFs | Client-side sample PDF download with fictional report, evidence, portfolio and next-step text | `lib/demo/demoPdf.ts` uses `jspdf` and static `carterFamilyDemo`; it calls `doc.save` locally and does not call the authenticated PDF engine. |

The complete direct demo dependency graph is:

`app/demo/page.tsx → components/demo/DemoShell.tsx → components/demo/Demo* → lib/demo/carterFamilyDemoData.ts`.

`DemoOutputs` additionally imports `lib/demo/demoPdf.ts → jspdf`. The graph
contains no Supabase client, auth hook, authenticated workspace provider,
`fetch`, API route, upload helper, `localStorage`, `sessionStorage`, or
database mutation. React state is limited to active section, selected week,
learner filter, and pending sample-download confirmation.

There is nevertheless a global runtime caveat: `app/layout.tsx` mounts
`AuthUserProvider` for every route. When public Supabase environment variables
exist, that provider calls `supabase.auth.getSession()` and subscribes to
`onAuthStateChange`; it may also query `profiles` for an authenticated session.
Therefore the demo component graph is static, but the current whole-page
runtime is not a proof that the browser makes zero Supabase requests. Stage 2
must test or isolate that global boundary explicitly.

## 3. Authenticated product implementation map

Canonical authenticated routes are under `app/(auth)` and use the clean
workspace components below. The parallel `app/(clean)` preview routes point to
the same clean components.

| Product area | Route entrypoint | Main implementation | Classification |
|---|---|---|---|
| My Calendar | `app/(auth)/my-calendar/page.tsx` | `app/components/clean/CleanCalendarWorkspace.tsx` | **E — mutation-capable; D — Supabase/data-coupled; C — auth-coupled.** It uses `useAuthUser`, `useCleanFamilyWorkspace`, calendar/generation/program/template/term clients, and create/update/delete operations. |
| My Day | `app/(auth)/my-day/page.tsx` | `app/components/clean/CleanDayWorkspace.tsx` | **E/D/C.** It loads the authorised workspace, calendar items, evidence, pathway/program/report state and can create calendar items or generate a daily planner PDF. |
| My Pathways | `app/(auth)/my-pathways/page.tsx` | `app/components/clean/CleanPathwaysWorkspace.tsx` | **E/D/C.** It imports Supabase directly, assessment/evidence clients, worksheet resources, and pathway-placement persistence. Placement and evidence actions are not public-safe. |
| Quick Capture / My Capture | `app/(auth)/my-capture/page.tsx` | `app/components/clean/CleanCaptureWorkspace.tsx` and `CleanQuickCaptureWorkspace.tsx` | **E/D/C.** It loads authorised learners/calendar/programs/evidence and can save evidence, upload attachments, update attachments and delete evidence. |
| My Portfolio | `app/(auth)/my-portfolio/page.tsx` | `app/components/clean/CleanPortfolioWorkspace.tsx` | **E/D/C.** It loads and mutates evidence and portfolio highlights, resolves attachment previews, and imports the authenticated report PDF generator. |
| My Reports | `app/(auth)/my-reports/page.tsx` | `app/components/clean/CleanReportsWorkspace.tsx` and `CleanReportPreview.tsx` | **E/D/C.** It loads report periods, reports, sections, portfolio evidence and assessment evidence; it creates/updates/deletes report records and exports PDFs. |
| My Outputs | `app/(auth)/my-outputs/page.tsx` | `app/components/clean/CleanOutputsWorkspace.tsx` | **E/D/C.** It loads calendar/evidence/program/report/output data and records report exports. |
| My Learna | `app/(auth)/my-learna/page.tsx` | `app/components/clean/CleanLearnaWorkspace.tsx` | **C/D.** It is the authorised learner-specific recent-learning view and uses clean workspace state and authenticated clients. |
| Family/learner loading | Clean route layout and providers | `app/(clean)/layout.tsx`, `app/components/FamilyWorkspaceProvider.tsx`, `app/components/clean/CleanFamilyWorkspaceProvider.tsx`, `lib/clean/workspace/client.ts`, `lib/clean/setup/setupStateClient.ts`, `lib/clean/family/client.ts`, `lib/clean/learners/client.ts` | **C/D.** Membership, family ownership, learners and setup state are server-backed and must not be replaced by fictional demo state. |

Safe current candidates are limited to presentation or explicitly static
domain pieces:

- `components/demo/*` and `lib/demo/carterFamilyDemoData.ts`: already static
  and public-safe, subject to future copy/accessibility review.
- `lib/demo/demoPdf.ts`: static client-side sample output generator; safe only
  for fictional output and not a substitute for authenticated PDF generation.
- `app/components/PublicSiteShell.tsx`: reusable public presentation shell,
  although its global-provider context and public CTA/nav behavior should be
  kept separate from demo state.
- Pure functions/types from `lib/clean/portfolio/evidencePresentation.ts`,
  `lib/clean/calendar/planningIntegrity.ts`, and selected planner/model
  builders may be useful only after dependency review. Importing a whole client
  module is not equivalent to importing one pure function.
- `lib/clean/outputs/dashboardPdfPrimitives.ts` is presentation-only PDF
  drawing code, but it should be used only with a demo-owned view model.

## 4. Supabase, auth, and mutation boundaries

### Current boundary findings

The public demo components themselves do not cross the data boundary. The root
layout does mount an auth provider globally, as described above. Authenticated
route layouts additionally call `requireAuthenticatedRoute` and mount family
workspace providers, Coach and the authenticated shell.

The following are the concrete classes of modules that a future
`app/demo/interactive` static boundary test should prohibit, directly or
transitively:

### Prohibited auth and session imports

- `@/lib/supabaseClient`
- `@/app/components/AuthUserProvider`
- `@/app/components/FamilyWorkspaceProvider`
- `@/app/components/clean/CleanFamilyWorkspaceProvider`
- `@/lib/auth/serverRouteAuth`
- `@/lib/authMagicLink`
- `@/lib/authRedirect`
- `@/lib/familySignOut`
- `@/app/components/AuthRouteGuard`

### Prohibited authorised data clients

- `@/lib/clean/family/client`
- `@/lib/clean/workspace/client`
- `@/lib/clean/learners/client`
- `@/lib/clean/calendar/client`
- `@/lib/clean/generation/client`
- `@/lib/clean/templates/client`
- `@/lib/clean/terms/client`
- `@/lib/clean/programs/client`
- `@/lib/clean/evidence/client`
- `@/lib/clean/evidence/unifiedCapture`
- `@/lib/familyEvidence`
- `@/lib/clean/portfolio/client`
- `@/lib/clean/reports/client`
- `@/lib/clean/outputs/client`
- `@/lib/clean/assessments/client`
- `@/lib/clean/assessments/attemptClient`
- `@/lib/clean/coach/*`
- `@/lib/clean/guidance/client`
- `@/lib/familyWorkspace`
- `@/lib/familyPlanner`
- `@/lib/familySettings`
- `@/lib/reportAssembly`
- `@/lib/reportDrafts`
- `@/lib/reportExport`
- `@/lib/reportExportHistory`
- `@/lib/reportEvidenceMapping`

### Prohibited mutation and API paths

The future demo must not import components or helpers that can invoke
`insert`, `update`, `upsert`, `delete`, uploads, or authenticated `fetch`.
That includes the authenticated workspace components listed above and direct
requests to `/api/auth/*`, `/api/report/*`, `/api/reports/*`,
`/api/internal/new-user-notification`, `/api/feedback/*`, or any Marketplace
API. It must not use storage upload/signed-URL helpers or expose auth tokens,
magic-link URLs, or arbitrary query-string values.

`lib/clean/pathways/pathwayPlacement.ts` is also not a public demo dependency:
it stores learner-specific placement records in browser `localStorage` and
dispatches a Coach refresh. That is not a substitute for fictional demo state
and creates account-isolation concerns.

## 5. Report and PDF architecture

The current authenticated report path is:

1. `CleanReportsWorkspace` loads authorised report periods, reports, sections,
   portfolio items and assessment evidence through clean clients.
2. `buildReportPdfEvidenceItems` and related evidence-presentation helpers
   transform selected evidence into `CleanReportPdfEvidenceItem` values.
3. `CleanReportPreview` renders the report preview from `CleanReport`,
   `CleanReportingPeriod`, section, evidence and assessment props.
4. `generateCleanReportPdfBytes` in `lib/clean/outputs/pdf.ts` generates the
   authenticated PDF. That module imports `supabase` and can fetch attachment
   bytes from family storage, so it is not a public-safe renderer boundary.
5. `CleanReportsWorkspace` and `CleanOutputsWorkspace` record exports through
   `lib/clean/outputs/client.ts`, which writes `report_exports` through
   Supabase.

`app/(auth)/reports/output/page.tsx` is a separate, more tightly coupled report
output route; it imports Supabase and calls authenticated API/report paths.

There is an existing `CleanReportPdfModel` in `lib/clean/outputs/pdf.ts`, but
the module is not pure because of storage/Supabase access, and its model
contains authenticated domain types and identifiers. `CleanReportPreview` is
mostly presentation, but it imports `EvidenceThumbnail`, which resolves
storage-backed images. The safe classification is:

**PARTIAL — presentation can be safely extracted.**

The current authenticated report renderer must not be imported directly by the
unauthenticated demo. A future extraction should provide a pure, demo-owned
view model and a renderer with no clients, auth hooks, storage helpers or
authenticated export recording. `window.print()` is used by
`app/(auth)/portfolio/share/[token]/page.tsx`; print CSS also exists inside
legacy report export code (`lib/reportExport.ts`). No existing public demo
print boundary was found.

## 6. Proposed pure `DemoReportViewModel`

No exact public-safe equivalent currently exists. The closest type is
`CleanReportPdfModel`, but it is coupled to the authenticated PDF module and
therefore should not be reused as the public boundary.

The proposed Stage 2 presentation contract is:

```text
DemoReportViewModel {
  familyLabel: string
  learnerLabel: string
  reportingPeriod: string
  summary: string
  evidenceEntries: Array<{
    id: string
    title: string
    observedOn: string
    learningArea: string
    description: string
    sourceLabel: string
  }>
  portfolioSelections: Array<{
    id: string
    title: string
    reason: string
  }>
  strengths: string[]
  focusAreas: string[]
  suggestedNextSteps: string[]
  generatedAt: string
  disclaimer: string
}
```

This interface contains presentation-only fictional values. It deliberately
does not contain family IDs, learner IDs, auth fields, storage paths, private
notes, report database status, or mutation callbacks.

## 7. Analytics and source attribution

Current mechanisms:

- Root GA is configured inline in `app/layout.tsx`; `GoogleAnalyticsPageTracker`
  records later public route page views with path/title/location.
- `GoogleAdsTag` loads Google Ads only on its allowlisted public exact paths,
  including `/demo`.
- `MetaPixel` loads Meta Pixel only on its allowlisted public exact paths,
  including `/demo`, and exposes `trackMetaLead()` for the existing Start Free
  conversion event.
- Authenticated `ProductAnalyticsProvider` uses
  `lib/clean/analytics/productAnalytics.ts` and PostHog. That helper has an
  explicit property allowlist, removes unsafe key patterns, and uses an
  anonymous distinct ID when no user ID is supplied. The current provider is
  mounted by the authenticated shell, not by the demo components.
- Source attribution begins with homepage query parameters such as
  `source=home-primary`, is read by `/start-free`, is stored in
  `mylearna_signup_prefill_v1`, and is forwarded to `/signup` as `source`.
  `lib/authMagicLink.ts` carries the source through auth metadata where the
  signup flow uses it.

For Stage 2, public demo events should use a small, explicitly allowlisted
  anonymous event boundary. The existing GA/Meta page tracking is public-safe;
  `trackProductEvent` is potentially safe only with no user ID and safe scalar
  properties. Do not import the authenticated provider into the demo or send
  raw route/query data as an event property. No events were added in this audit.

Never send:

- parent email, parent name, child/learner name or age;
- learner IDs, family IDs, evidence IDs or storage paths;
- learner content, evidence text, notes, report text or pathway answers;
- uploaded media or filenames;
- auth tokens, magic-link URLs or arbitrary query-string values.

## 8. Test infrastructure

- Test runner: Vitest (`npm.cmd run test` / `vitest run`).
- Configuration: `vitest.config.ts`, with `app/**/*.test.ts` and
  `lib/**/*.test.ts` included, default `node` environment, and `@` path alias.
- Component tests use `// @vitest-environment jsdom` and
  `@testing-library/react` where needed.
- Current baseline is 58 test files and 369 tests in the latest validated
  branch.
- Existing patterns include `vi.mock`, source-oriented tests with
  `readFileSync`, and targeted client/provider tests. No Playwright config,
  browser E2E suite, MSW setup, visual snapshot harness, or dedicated
  accessibility runner was found. No test tooling should be installed for
  Stage 1.

The repository can support a future static boundary test using Vitest and
source/import inspection: it can fail if files under `app/demo/interactive`
import any prohibited module. A runtime no-Supabase test is more involved
because the global root `AuthUserProvider` currently calls Supabase when public
environment variables are present. Stage 2 should either provide a deliberate
public-root isolation boundary or add a browser/runtime network assertion; a
static import test alone is not enough to prove zero network contact.

## 9. Recommended Stage 2 file plan

The following is a proposed plan based on the actual repository conventions;
these files were not created in this audit.

### Route and orchestration

- `app/demo/interactive/page.tsx` — public route and metadata only; no auth
  guard, Supabase client or server action.
- `app/demo/_components/InteractiveDemoExperience.tsx` — client orchestrator
  for section navigation, active fictional learner/filter and demo-only state.
- `app/demo/_components/DemoGuide.tsx` — accessible one-step guidance and
  progress presentation, separate from authenticated GuidanceProvider.
- `app/demo/_state/demoTypes.ts` — finite demo state and action types.
- `app/demo/_state/demoReducer.ts` — pure reducer; no side effects or storage.

### Data and presentation

- Keep or relocate `lib/demo/carterFamilyDemoData.ts` as the single static
  Carter data source; do not duplicate the fictional data across components.
- `app/demo/_components/DemoSectionFrame.tsx` — public presentation primitive,
  if the existing `components/demo/DemoShell.tsx` is not extended.
- `app/demo/_components/DemoReportRenderer.tsx` — pure report renderer using
  `DemoReportViewModel`; do not import `CleanReportPreview` until its storage
  dependency is extracted.
- Reuse `lib/demo/demoPdf.ts` for sample fictional PDFs only, or extract a
  similarly pure `app/demo/_components/DemoPdfOutput.ts` wrapper.
- Reuse the existing `components/demo/DemoCalendar.tsx`, `DemoDay.tsx`,
  `DemoPathways.tsx`, `DemoCapture.tsx`, `DemoPortfolio.tsx`, `DemoData.tsx`,
  `DemoReports.tsx`, `DemoOutputs.tsx`, and `DemoShell.tsx` only after their
  content and accessibility are reviewed. Their current static imports are a
  safe starting point, but the old shell is a single long-scroll simulator,
  not yet a stateful guided experience.

### Tests and guardrails

- `app/demo/interactive/interactiveDemoBoundary.test.ts` — static prohibited
  import/source test.
- `app/demo/interactive/InteractiveDemoExperience.test.tsx` — reducer and
  interaction tests using jsdom/Testing Library.
- `lib/demo/carterFamilyDemoData.test.ts` — deterministic fictional data
  invariants, if data validation is needed.
- A browser/network acceptance test remains a separate decision because no
  browser E2E harness exists and the global auth provider currently runs above
  the route.

## 10. Unresolved questions and blockers

1. **Global auth runtime boundary:** the existing root layout mounts
   `AuthUserProvider` on `/demo`. The direct demo graph is auth-free, but a
   strict requirement that `/demo/interactive` make zero Supabase requests
   needs a Stage 2 architecture decision and runtime test.
2. **Report extraction:** the current report preview and PDF modules mix
   presentation with storage-backed attachment resolution and authenticated
   data. A pure public report renderer must be extracted or separately built.
3. **Demo scope:** the existing simulator has static, inert Practise/Assess
   buttons and no actual worksheet/resource experience. Stage 2 should decide
   whether those are labels, locally simulated interactions, or omitted; they
   must not imply authenticated progression.
4. **Output semantics:** current sample PDFs are client-side jsPDF downloads
   and explicitly separate from real Outputs. The future UI must preserve that
   distinction and avoid implying a real report export or family record.
5. **Tracking policy:** decide the approved anonymous event names and consent
   behavior before instrumenting demo interactions. No analytics were added in
   this stage.
6. **Public copy cleanup:** the existing demo and shared public navigation still
   contain `Start free` wording. This audit records it; changing it belongs to a
   separately approved presentation task.

## 11. Audit confirmation

This audit changed no production application file.

