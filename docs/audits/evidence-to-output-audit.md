# Evidence-to-output audit: Pathways, Capture, Portfolio, Reports and Outputs

Date: 2026-06-13

Scope: audit only. No production behaviour, schema, scoring, reports, worksheets, support, auth, payments, or navigation changes were made.

## 1. Executive summary

The evidence-to-output flow is **partial**.

MyLearna currently has a working text-evidence pipeline:

`My Capture -> evidence_entries -> My Data / My Portfolio -> My Reports -> My Outputs PDF/export history`

That supports the Free promise at a basic level: families can create structured text evidence, choose portfolio highlights, prepare a report record, and export a PDF output.

The paid Family promise is not complete yet. The product has strong pathway, assessment, worksheet, and activity data, but most of that data does not yet become a shared reportable evidence object. Assessment attempts are persisted and read back by My Pathways / My Data in limited ways, but they are not automatically available to Portfolio, Reports, or Outputs. Practice attempts are not persisted as evidence. Worksheets are linked as static resources, but worksheet completion is not tracked. H5P/game/activity evidence has no live model yet.

The biggest missing bridge is a unified evidence event layer that can convert pathway assessments, practice sessions, worksheet completion, digital activity results, and parent judgements into report/portfolio-ready records.

## 2. Current evidence sources

### Parent-created evidence

Created through:

- `app/components/clean/CleanCaptureWorkspace.tsx`
- `lib/clean/evidence/client.ts`
- `lib/clean/evidence/types.ts`

Stored as:

- Supabase table: `evidence_entries`
- Type: `CleanEvidenceEntry`

Fields include:

- `familyId`
- `learnerId`
- `programId`
- `calendarItemId`
- `observedOn`
- `title`
- `whatHappened`
- `reflection`
- `learningArea`
- `curriculumNodeIds`
- `includeInPortfolio`
- `includeInReport`
- `createdByUserId`

This is the strongest evidence source currently.

### Portfolio highlights

Created through:

- `app/components/clean/CleanPortfolioWorkspace.tsx`
- `lib/clean/portfolio/client.ts`
- `lib/clean/portfolio/types.ts`

Stored as:

- Supabase table: `portfolio_highlights`
- Type: `CleanPortfolioHighlight`

Portfolio highlights reference existing evidence entries rather than duplicating evidence content.

### My Pathways assessment attempts

Created through:

- `app/components/clean/CleanNumberAssessmentPlayer.tsx`
- `lib/clean/assessments/attemptClient.ts`
- `lib/clean/assessments/attemptTypes.ts`

Stored as:

- Supabase table: `assessment_attempts`
- Supabase table: `assessment_attempt_responses`
- Types: `CleanAssessmentAttempt`, `CleanAssessmentAttemptResponse`

Assessment attempts preserve useful structured data:

- `familyId`
- `learnerId`
- `subjectKey`
- `strandKey`
- `stageKey`
- `pathwayStepId`
- `stepKey`
- `progressionBandKey`
- `itemBankKey`
- `mode`
- `sourceRoute`
- `status`
- `itemCount`
- `attemptedCount`
- `autoCorrectCount`
- `autoIncorrectCount`
- `reviewNeededCount`
- `summarySnapshot`
- `startedAt`
- `completedAt`

Responses preserve:

- `itemId`
- `itemOrder`
- `progressionStepKey`
- `answerType`
- `localResult`
- `responseText`
- `selectedOption`
- `itemSnapshot`
- `submittedAt`

This is data-rich but not yet report/portfolio-ready.

### Parent assessment judgements / skill statuses

Created in the older assessment workspace through:

- `app/components/clean/CleanAssessmentsWorkspace.tsx`
- `lib/clean/assessments/client.ts`

Stored as:

- Supabase table: `assessment_skill_statuses`
- Type: `CleanAssessmentSkillStatus`

These are manually saved confidence/status judgements and are separate from V4 assessment attempt completion. `CleanNumberAssessmentPlayer.tsx` stores `parentJudgementPreview` inside `summarySnapshot`, but the visible `Save judgement` button in the result flow is currently disabled and does not update `assessment_skill_statuses`.

### Practice attempts

Rendered through:

- `app/components/clean/CleanNumberTargetedPracticeViewer.tsx`
- `app/components/clean/activity-player-v4/ActivityPlayerV4.tsx`
- practice registries under `lib/clean/practice/`

Stored as:

- Local React state during the session.
- Not persisted as a practice attempt table.
- Not converted to `evidence_entries`.

Practice has a manual capture route / evidence summary path in older practice workspace code, but the V4 practice session itself is not automatically stored as reportable evidence.

### Planning and calendar evidence

Created through:

- `app/components/clean/CleanCalendarWorkspace.tsx`
- `app/components/clean/CleanDayWorkspace.tsx`
- `lib/clean/calendar/client.ts`
- `lib/clean/calendar/types.ts`

Stored as:

- Supabase table: `calendar_items`
- Type: `CleanCalendarItem`

Fields include:

- `familyId`
- `learnerId`
- `programId`
- `programSegmentId`
- `title`
- `description`
- `plannedDate`
- `learningArea`
- `sessionLabel`
- `sourceType`
- `isHighlighted`

Calendar records are planning records. Completion is not represented as a distinct evidence event. My Capture can link evidence to a `calendarItemId`.

### Worksheet/resource evidence

Defined through:

- `lib/clean/resources/mathWorksheetResources.ts`
- `app/components/clean/CleanPathwaysWorkspace.tsx`
- `app/components/clean/CleanPathwayStepActionRow.tsx`

Stored as:

- Static TypeScript resource registry.
- Worksheet files under public/resource paths.
- No completion table found.

Worksheet links are pathway-attached resources, not evidence records.

### H5P/game/activity results

No live H5P/game evidence persistence was found in the clean evidence/reporting path.

Future activity evidence would need a new adapter into a shared evidence event model.

## 3. Evidence storage map

| Area | Storage | Key code |
| --- | --- | --- |
| Capture notes | `evidence_entries` | `lib/clean/evidence/client.ts` |
| Portfolio selections | `portfolio_highlights` | `lib/clean/portfolio/client.ts` |
| Calendar/plans | `calendar_items` | `lib/clean/calendar/client.ts` |
| Reports | `reports`, `report_sections`, `reporting_periods` | `lib/clean/reports/client.ts` |
| Outputs/export history | `report_exports` | `lib/clean/outputs/client.ts` |
| Assessment attempts | `assessment_attempts`, `assessment_attempt_responses` | `lib/clean/assessments/attemptClient.ts` |
| Parent assessment status | `assessment_skill_statuses` | `lib/clean/assessments/client.ts` |
| Worksheets | static TS registry + public files | `lib/clean/resources/mathWorksheetResources.ts` |
| Practice attempts | local state only | `CleanNumberTargetedPracticeViewer.tsx`, `ActivityPlayerV4.tsx` |
| H5P/game results | not found | missing |

## 4. Evidence flow map

| Source | Created where | Stored where | Learner-linked? | Curriculum-linked? | Appears in My Data? | Appears in Portfolio? | Appears in Reports? | Appears in Outputs? | Status |
| ------ | ------------- | ------------ | --------------- | ------------------ | ------------------- | --------------------- | ------------------- | ------------------- | ------ |
| Capture text note | `CleanCaptureWorkspace` | `evidence_entries` | Yes | Yes, via `curriculumNodeIds` when context exists | Yes | Yes | Yes, if highlighted and in period | Yes, through report PDF | Report-ready now |
| Capture reflection | `CleanCaptureWorkspace` | `evidence_entries.reflection` | Yes | Same as entry | Yes | Yes | Yes | Yes | Report-ready now |
| Photo/file evidence | Not in clean capture model | Not stored in clean evidence | N/A | N/A | No | No | No | No | Missing bridge / not implemented |
| Portfolio highlight | `CleanPortfolioWorkspace` | `portfolio_highlights` | Yes | Indirect via linked evidence | Indirect | Yes | Yes | Yes | Portfolio-ready now |
| Practice session | V4 Practice / targeted practice | Local state only | Runtime only | Runtime only | No | No | No | No | UI-only / not persisted |
| Assessment attempt | V4 Assess / `CleanNumberAssessmentPlayer` | `assessment_attempts`, `assessment_attempt_responses` | Yes | Yes, step/strand/stage keys | Partially | No | No | No | Data-only now |
| Assessment score/counts | `saveAssessmentAttempt()` | `assessment_attempts` + `summarySnapshot` | Yes | Yes | Partially | No | No | No | Data-only now |
| Assessment parent judgement | Result page state | `summarySnapshot.parentJudgementPreview` only when attempt saved | Yes, inside snapshot | Yes, inside attempt context | No direct status update | No | No | No | Captured weakly / missing bridge |
| Manual assessment status | `CleanAssessmentsWorkspace` | `assessment_skill_statuses` | Yes | Partially/Yes | Yes | Can be manually converted to evidence in old workspace | Only if converted to evidence | Only if converted to evidence and report | Partial |
| Pathway evidence link | My Pathways -> Capture | `evidence_entries.curriculumNodeIds` | Yes | Yes, encoded pathway context | Yes | Yes | Yes if highlighted | Yes if highlighted/report exported | Report-ready after manual capture |
| My Day / Calendar item | `CleanDayWorkspace`, `CleanCalendarWorkspace` | `calendar_items` | Optional learner | Learning area only | No direct My Data coverage unless captured | Not directly; portfolio highlights can reference calendar but current portfolio items are evidence-driven | Appears in Outputs context/planning, not as evidence | Yes as context in some output models | Data-only / planning context |
| Worksheet link | Pathway row/action | Static resource registry | No user record | Yes by registry keys | Visible in Pathways only | No | No | No | Resource-only |
| Worksheet completion | Not found | Not stored | No | No | No | No | No | No | Missing |
| H5P/game/activity result | Not found | Not stored | No | No | No | No | No | No | Missing |

## 5. My Pathways assessment flow findings

The Activity Player V4 assessment flow saves completed checks through `CleanNumberAssessmentPlayer.tsx`.

The result object is created in `saveAssessmentAttempt()`:

- `summarySnapshot` is built from `buildAdaptiveInsightSummary(...)`.
- `createAssessmentAttempt(...)` inserts into `assessment_attempts`.
- `createAssessmentAttemptResponses(...)` inserts one row per item into `assessment_attempt_responses`.
- Exact-step checks auto-save on summary via an effect when `incomingStepAssessment`, `sessionMode === "summary"`, and `showSummary` are true.

What is preserved:

- selected 4 / 8 / 12 item count as `itemCount: totalItems`
- attempted count
- correct count
- incorrect count
- review-needed count
- not-sure count inside `summarySnapshot.notSureCount`
- unanswered count inside `summarySnapshot.unansweredCount`
- item IDs
- item order
- selected option / response text
- local result
- item snapshot
- subject / strand / stage / pathway step / step key
- source route
- assessment depth inside `summarySnapshot.prototypeMetadata.assessmentDepth`

What is weak or missing:

- `notSureCount` is not a first-class column on `assessment_attempts`; it is inside `summarySnapshot`.
- Parent judgement is only a preview value inside `summarySnapshot.parentJudgementPreview`; the result page `Save judgement` control is disabled and does not update `assessment_skill_statuses`.
- Assessment attempts do not create `evidence_entries`.
- Assessment attempts are not consumed by Portfolio, Reports, or Outputs.
- My Reports does not read `assessment_attempts`.
- My Portfolio does not read `assessment_attempts`.
- My Outputs PDF generation does not include `assessment_attempts`.

Where assessment data does appear:

- My Pathways reads completed attempts via `listAssessmentAttemptsForLearner(...)` and uses them for pathway display/grouping.
- My Data reads `assessment_skill_statuses`, not assessment attempts, for curriculum coverage summaries.
- My Data also reads text evidence entries.

Conclusion: pathway assessment persistence is useful but **not yet part of the evidence-to-output pipeline**.

## 6. My Capture -> Portfolio -> Reports findings

This is the most complete path.

Flow:

1. `CleanCaptureWorkspace` creates `evidence_entries`.
2. `CleanPortfolioWorkspace` reads `listCleanPortfolioItems(...)`, which combines `evidence_entries` with `portfolio_highlights`.
3. Parent highlights an evidence item, creating a `portfolio_highlights` row.
4. `CleanReportsWorkspace` reads highlighted portfolio items for the selected learner/reporting period.
5. `CleanOutputsWorkspace` reads ready reports, report sections, highlighted portfolio items, and calendar context.
6. `generateCleanReportPdfBytes(...)` renders report sections and evidence items into the PDF.
7. `createCleanReportExport(...)` records export history in `report_exports`.

Strengths:

- Learner-linked.
- Family-linked.
- Date-linked.
- Can be curriculum-linked through encoded `curriculumNodeIds`.
- Can be pathway-linked through encoded pathway context.
- Portfolio and Reports use the same evidence source.

Weaknesses:

- Report sections exist as a data model, but the current My Reports UI mainly treats advanced custom sections as later functionality. Report creation is more about report metadata/status and selected evidence preview than rich report authoring.
- `includeInPortfolio` and `includeInReport` exist on `CleanEvidenceEntry`, but portfolio flow is driven by `portfolio_highlights`; reports use highlighted portfolio items. The flags are not the main gate in the report path.
- Photo/file evidence is not implemented in the clean capture model.

Conclusion: text evidence supports the Free promise at a basic Beta V1 level.

## 7. My Day / Calendar -> Reports findings

Calendar items are persisted and linked to learner/program/planned date.

Evidence bridge:

- My Capture can link an evidence entry to a `calendarItemId`.
- Portfolio highlights can technically reference a `calendarItemId`, but `listCleanPortfolioItems(...)` currently builds portfolio items from evidence entries and highlights by `evidenceEntryId`.
- Reports/Outputs load calendar items as context for the report/output model.

Missing:

- No clear completion status or completed learning event model was found in `CleanCalendarItem`.
- A completed My Day item does not automatically become evidence.
- Calendar items do not appear as first-class report evidence unless converted into a capture note.

Conclusion: calendar/planning is useful context, but completion evidence needs a bridge.

## 8. Worksheet/resource evidence findings

Worksheet resources are static, pathway-linked metadata:

- `MathWorksheetResource`
- `MATH_WORKSHEET_RESOURCES`
- `getWorksheetResourceForPathwayStep(...)`

They include:

- pathway step ID
- step key
- subject key
- strand key
- stage key
- step number
- title
- curriculum code where available
- concept
- file name
- href

No worksheet evidence model was found:

- no worksheet completion table
- no worksheet download event as evidence
- no uploaded completed worksheet attachment
- no link from worksheet completion to Portfolio / Reports / Outputs

Conclusion: worksheets are curriculum resources now, not evidence events.

## 9. H5P/game evidence readiness

No H5P/game/activity result persistence was found in the clean evidence/reporting pipeline.

Needed later:

- activity identifier
- activity type
- learner ID
- family ID
- curriculum/pathway mapping
- score/result
- completion state
- time spent if appropriate
- artefact/screenshot refs if appropriate
- report eligibility flag
- adapter into the same evidence event model as assessment/practice

Conclusion: H5P/game evidence is not present yet, but the pathway/assessment context keys give a useful mapping pattern for future adapters.

## 10. Free report promise readiness

Promise: “Compile a homeschool report from structured text evidence.”

Current readiness: **partially ready / viable for Beta V1 if expectations stay modest**.

Supported now:

- learner profile and family workspace
- curriculum/jurisdiction setup inputs through profile/settings
- text evidence capture
- learning area and curriculum/pathway context
- portfolio selection
- report shell
- report preview
- PDF output
- export history

Gaps:

- report authoring is still light
- report sections are not strongly exposed for parent-written narrative
- no file/photo attachments in clean evidence
- some older authority/reporting flows exist separately and may confuse architecture

## 11. Paid Family promise readiness

Promise: “MyLearna builds the report from curriculum, pathways, assessments, worksheets, H5P/activity results, resources, artefacts and portfolio evidence.”

Current readiness: **not complete**.

Supported pieces:

- curriculum pathway structure exists
- pathway assessment attempts persist
- pathway evidence capture can link to steps
- worksheets are mapped to pathway steps
- portfolio and report output pipeline exists
- My Data can combine text evidence and manual skill statuses for coverage

Missing bridges:

- practice sessions -> evidence
- assessment attempts -> evidence / portfolio / reports / outputs
- parent judgement -> persistent skill status in V4 flow
- worksheet completion -> evidence
- H5P/activity results -> evidence
- artefact/file/photo upload -> clean evidence
- unified evidence event abstraction

## 12. Biggest gaps

1. Assessment attempts do not automatically become reportable evidence.
2. V4 assessment parent judgement is not saved as `assessment_skill_statuses`.
3. My Reports and My Outputs do not read `assessment_attempts`.
4. My Portfolio does not offer assessment attempts as selectable evidence.
5. Practice sessions are local-only.
6. Worksheet completion is not tracked.
7. Calendar completion is not evidence unless manually captured.
8. H5P/game results have no evidence adapter.
9. File/photo artefacts are not in the clean evidence model.
10. There are parallel concepts: `evidence_entries`, `assessment_attempts`, `assessment_skill_statuses`, report sections, and authority pack evidence. They need a unifying event layer rather than more one-off bridges.

## 13. Recommended next build sequence

1. Confirm a unified evidence event model.
2. Convert completed V4 assessments into evidence events or evidence-entry-linked records.
3. Make parent judgement save update `assessment_skill_statuses` from the V4 result flow.
4. Make My Data read assessment attempts or evidence events directly, not only manual skill statuses.
5. Add assessment evidence selection in My Portfolio.
6. Make My Reports summarise selected assessment evidence.
7. Make My Outputs include assessment evidence in PDF/export formatting.
8. Add a practice-session evidence adapter.
9. Add worksheet completion tracking.
10. Add H5P/activity result adapter later.
11. Add placement later after the evidence pipeline is reliable.

## 14. Low-risk quick wins

1. Add a “Save this check as evidence” action on the assessment result page that creates an `evidence_entries` record using the already available summary data.
2. Enable the V4 `Save judgement` control to upsert `assessment_skill_statuses`, using the existing `upsertCleanAssessmentSkillStatus(...)` helper.
3. Add a report preview section showing saved assessment attempts for the selected learner/reporting period, read-only at first.
4. Add an “Assessment evidence” filter to My Portfolio using `assessment_attempts`, without changing report exports yet.
5. Add a worksheet completion capture link that opens My Capture with worksheet/pathway context prefilled.

## 15. High-risk changes to avoid

1. Do not add placement before assessment evidence reaches reports.
2. Do not create a separate H5P evidence table without a shared event model.
3. Do not make assessment attempts update pathway status without parent confirmation unless that is a deliberate product decision.
4. Do not add photo/file uploads before storage quotas, privacy, deletion, and report rendering are designed.
5. Do not create one-off report PDF logic that reads every source directly; that will make exports brittle.
6. Do not change assessment scoring or item content to solve evidence flow.

## 16. Suggested evidence event model

Proposed only. Do not implement until reviewed.

```ts
type LearningEvidenceEvent = {
  id: string;
  learnerId: string;
  familyId: string;
  userId?: string | null;
  sourceType:
    | "capture_note"
    | "portfolio_highlight"
    | "practice_session"
    | "assessment_attempt"
    | "parent_judgement"
    | "worksheet_completion"
    | "calendar_completion"
    | "h5p_activity"
    | "resource_activity";
  sourceId?: string | null;
  subject?: string | null;
  strand?: string | null;
  stage?: string | null;
  pathwayId?: string | null;
  stepId?: string | null;
  stepKey?: string | null;
  stepTitle?: string | null;
  curriculumCodes?: string[];
  title: string;
  summary: string;
  evidenceDate: string;
  score?: number | null;
  questionCount?: number | null;
  attemptedCount?: number | null;
  correctCount?: number | null;
  incorrectCount?: number | null;
  notSureCount?: number | null;
  parentJudgement?: "needs_support" | "developing" | "secure" | "strong" | null;
  artefactRefs?: Array<{
    type: "image" | "file" | "worksheet" | "pdf" | "link";
    id?: string;
    url?: string;
    title?: string;
  }>;
  portfolioEligible: boolean;
  reportEligible: boolean;
  visibility: "family_private" | "report_selected" | "archived";
  freePaidStatus?: "free" | "family" | "future_premium";
  createdAt: string;
  updatedAt?: string | null;
};
```

## Files inspected

Primary files:

- `app/components/clean/CleanCaptureWorkspace.tsx`
- `app/components/clean/CleanPortfolioWorkspace.tsx`
- `app/components/clean/CleanReportsWorkspace.tsx`
- `app/components/clean/CleanOutputsWorkspace.tsx`
- `app/components/clean/CleanCurriculumWorkspace.tsx`
- `app/components/clean/CleanPathwaysWorkspace.tsx`
- `app/components/clean/CleanPathwayStepActionRow.tsx`
- `app/components/clean/CleanNumberTargetedPracticeViewer.tsx`
- `app/components/clean/CleanNumberAssessmentPlayer.tsx`
- `app/components/clean/activity-player-v4/ActivityPlayerV4.tsx`
- `app/components/clean/activity-player-v4/activityPlayerV4Adapters.ts`
- `app/components/clean/CleanAssessmentsWorkspace.tsx`
- `app/components/clean/CleanReportPreview.tsx`
- `app/(auth)/my-data/page.tsx`
- `app/(auth)/my-capture/page.tsx`
- `app/(auth)/my-portfolio/page.tsx`
- `app/(auth)/my-reports/page.tsx`
- `app/(auth)/my-outputs/page.tsx`

Key library files:

- `lib/clean/evidence/types.ts`
- `lib/clean/evidence/client.ts`
- `lib/clean/evidence/curriculumContext.ts`
- `lib/clean/portfolio/types.ts`
- `lib/clean/portfolio/client.ts`
- `lib/clean/reports/types.ts`
- `lib/clean/reports/client.ts`
- `lib/clean/outputs/types.ts`
- `lib/clean/outputs/client.ts`
- `lib/clean/outputs/pdf.ts`
- `lib/clean/calendar/types.ts`
- `lib/clean/calendar/client.ts`
- `lib/clean/assessments/attemptTypes.ts`
- `lib/clean/assessments/attemptClient.ts`
- `lib/clean/assessments/client.ts`
- `lib/clean/curriculum/coverageSummary.ts`
- `lib/clean/pathways/pathwayStepState.ts`
- `lib/clean/resources/mathWorksheetResources.ts`

Reference docs:

- `docs/number-adaptive-engine-roadmap-status.md`
- `docs/product/evidence-uploads-v0-storage-pricing-spec.md`
- `docs/assessment-attempts-phase-1-migration-spec.md`
