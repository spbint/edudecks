# QA Remediation Baseline

Stage: Stage 0 - Local Baseline and Branch Safety Audit
Repository path: C:\Users\seanb\edu-dashboard
Date: 2026-07-14

## Outcome

BASELINE BLOCKED - local/remote histories require manual reconciliation

Reason: Git is not available in the current shell. `git` is not recognized by PowerShell or cmd, and common Git install locations were not found from this session. Because Git state cannot be verified, no branch was created and no local or remote history operation was performed.

## Repository State

Requested Git commands could not be completed:

- `git status --short`
- `git status`
- `git branch --show-current`
- `git branch -vv`
- `git remote -v`
- `git log --oneline --decorate -20`
- `git log --all --oneline --decorate --graph -40`
- `git diff --stat`
- `git diff`
- `git diff --cached --stat`
- `git diff --cached`
- `git ls-remote --heads origin`
- `git fetch origin --prune`
- `git branch -r`
- `git rev-list --left-right --count origin/main...HEAD`
- `git log --oneline origin/main..HEAD`
- `git log --oneline HEAD..origin/main`

Observed Git availability checks:

- `where.exe git`: no Git executable found.
- Common paths checked: `C:\Program Files\Git\cmd\git.exe`, `C:\Program Files\Git\bin\git.exe`, `C:\Program Files (x86)\Git\cmd\git.exe`, `C:\Users\seanb\AppData\Local\Programs\Git\cmd\git.exe`; none found.
- `cmd.exe /c git --version`: `'git' is not recognized as an internal or external command`.

Because Git state is unavailable, branch, HEAD, upstream, ahead/behind, divergence, untracked files, modified files, staged files and unpushed commits could not be verified by Codex.

## Branch Recommendation

Do not switch, merge, rebase, reset, cherry-pick, force-push or create a mixed commit until Git is available and the local working tree is reviewed.

Recommended next manual action:

1. Open a shell where Git is installed and available.
2. Run the Stage 0 Git command set.
3. If clean and current local app HEAD is verified, create `qa-remediation-implementation` from current local HEAD.
4. If dirty, review files before any branch operation.
5. If local and remote histories diverge, manually reconcile before implementation.

## Current Application Source Inventory

Search command:

`rg -n "My Pathways|My Calendar|My Capture|My Portfolio|My Data|My Reports|GuidanceProvider" app lib src`

Important current app paths found:

- `app/layout.tsx` imports and wraps `GuidanceProvider`.
- `app/components/clean/guidance/GuidanceProvider.tsx`
- `app/components/clean/guidance/GuidanceToggle.tsx`
- `app/components/clean/guidance/guidanceTours.ts`
- `app/components/clean/CleanCalendarWorkspace.tsx`
- `app/components/clean/CleanPathwaysWorkspace.tsx`
- `app/components/clean/CleanCaptureWorkspace.tsx`
- `app/components/clean/CleanPortfolioWorkspace.tsx`
- `app/components/clean/CleanReportsWorkspace.tsx`
- `app/components/clean/CleanCurriculumWorkspace.tsx`
- `app/components/clean/CleanOutputsWorkspace.tsx`
- `app/components/clean/CleanSettingsWorkspace.tsx`
- `app/components/clean/CleanReviewWorkspace.tsx`
- `app/components/clean/CleanDayWorkspace.tsx`
- `app/components/FamilyTopNavShell.tsx`
- `app/components/clean/design-v2/MyLearnaAppShellV2.tsx`
- `app/(auth)/(family)/profile/page.tsx`
- `app/(auth)/planner/layout.tsx`
- `app/(auth)/reports/layout.tsx`
- `app/(auth)/my-skills/page.tsx`
- `lib/clean/guidance/client.ts`
- `lib/familyLearners.ts`
- `lib/familyLearnerService.ts`
- `lib/familyWorkspace.ts`
- `lib/familyWorkflow.ts`
- `lib/myDay.ts`
- `lib/learningIntelligence.ts`

Navigation shell hits include:

- `app/components/FamilyTopNavShell.tsx`
- `app/components/clean/CleanAppHeader.tsx`
- `app/components/clean/design-v2/MyLearnaAppShellV2.tsx`

## Package And Tool Baseline

`package.json` scripts:

- `dev`: `next dev --webpack`
- `build`: `next build`
- `start`: `next start`
- `lint`: `eslint`
- `test`: `vitest run`

Tool versions:

- Node: `v24.12.0`
- npm: `11.6.2`

`npm.cmd ls --depth=0` completed. Top-level dependencies include:

- `next@16.1.1`
- `react@19.2.3`
- `react-dom@19.2.3`
- `@supabase/supabase-js@2.89.0`
- `@supabase/auth-helpers-nextjs@0.15.0`
- `vitest@4.1.4`
- `typescript@5.9.3`
- `eslint@9.39.2`

`npm.cmd ls --depth=0` also reported several extraneous packages, including `@emnapi/core`, `@emnapi/runtime`, `@emnapi/wasi-threads`, `@napi-rs/wasm-runtime`, and `@tybys/wasm-util`.

No `npm install` was run.

## Baseline Verification

### Build

Command: `npm.cmd run build`

Result: passed.

Notes:

- Next.js 16.1.1 Turbopack build completed successfully.
- 112 static pages generated.
- Build environment reported `.env.local` loaded.
- Warning: Browserslist data is 7 months old.

### Lint

Command: `npm.cmd run lint`

Result: failed.

First useful failures and categories:

- `app/(auth)/portfolio/share/[token]/page.tsx`: multiple `@typescript-eslint/no-explicit-any` errors and unused warnings.
- `app/(auth)/reports/presets/page.tsx`: multiple `@typescript-eslint/no-explicit-any` errors.
- `app/components/CohortSnapshot.tsx`: `@typescript-eslint/no-explicit-any` errors.
- `app/components/FamilyGuidanceDebugPanel.tsx`: `react-hooks/set-state-in-effect` error.
- `app/components/FamilyHandoffNote.tsx`: `react-hooks/set-state-in-effect` error.
- `app/components/MyMonthWorkspace.tsx`: `react/no-unescaped-entities` error.
- `app/components/day/MyDayOverviewComponents.tsx`: `react/no-unescaped-entities` error.
- Multiple report/export/authority files include `no-explicit-any` errors.

Summary: 133 problems, 70 errors and 63 warnings.

### Tests

Command: `npm.cmd run test`

Result: failed.

Summary:

- Test files: 3 failed, 14 passed, 17 total.
- Tests: 21 failed, 105 passed, 126 total.

First useful failure groups:

- `lib/reportPack.test.ts`: `buildSubmissionPack is not a function`.
- `app/api/reports/pdf/route.test.ts`: expected `draftId` query behaviour, actual route expects `reportDocumentId`; multiple status code assertion failures.
- `app/api/reports/submission-pack/route.test.ts`: expected pack helper calls/status codes, actual responses return 503 in several cases.

No failures were fixed in Stage 0.

## Stage 1 Inventory

### TODO / RLS / coming later / phase / worksheet_evidence / escaped apostrophes / hand added / v1

Search command:

`rg -n -i "TODO|RLS|coming later|will come later|this phase|worksheet_evidence|&apos;|hand added|v1" app lib src`

Representative hits:

- `app/manifest.ts:16` TODO for placeholder app icons.
- `app/components/clean/CleanReviewWorkspace.tsx:499` TODO to persist review sessions once table and RLS policy are introduced.
- `lib/clean/assessments/assessmentPermissions.ts:15` TODO for canonical staff role/claim.
- `app/components/clean/CleanReportsWorkspace.tsx:2652`, `2711`, `2720` Coming later report customisation areas.
- `app/components/clean/CleanAssessmentsWorkspace.tsx:2560`, `2574`, `3082` Coming later assessment areas.
- `app/components/clean/CleanPathwaysWorkspace.tsx:638` worksheet evidence source query parameter.
- `app/components/clean/pathways/WorksheetEvidenceCapture.tsx:291` `Source: worksheet_evidence`.
- `app/components/clean/CleanCaptureWorkspace.tsx:1425`, `2836` worksheet evidence source references.
- Multiple local-storage v1 keys across family settings, planning, pathways and assessment registries.

### Worksheet resource paths and keys

Search command:

`rg -n "/resources/worksheets|worksheetResource|resourcePath|source_key|sourceKey" app lib src`

Representative hits:

- `lib/clean/resources/mathWorksheetResources.ts` contains extensive `/resources/worksheets/maths/...` generated worksheet href mappings.
- `lib/clean/resources/mathWorksheetResources.test.ts:9` canonical worksheet href prefix.
- `app/components/clean/CleanPathwaysWorkspace.tsx:632`, `639-642`, `3224-3269`, `4284-4328`, `4692` worksheet resource and worksheet evidence handoff handling.
- `app/components/clean/CleanPathwayStepActionRow.tsx:23`, `51-60`, `87-148` worksheet resource capture/download handling.
- `app/components/clean/pathways/WorksheetEvidenceCapture.tsx:34`, `164`, `281-307`, `398-415` worksheet evidence capture handling.

### Delete/archive actions

Search command:

`rg -n "Delete evidence|Delete report|Archive report|deleteEvidence|deleteReport|archiveReport" app lib src`

Hits:

- `app/components/clean/CleanPortfolioWorkspace.tsx:1504` Delete evidence.
- `app/components/clean/CleanPortfolioWorkspace.tsx:1607` Delete evidence submit label.
- `lib/reportDrafts.ts:462` `archiveReportDraft`.
- `lib/reportDrafts.ts:466` `deleteReportDraft`.
- `app/(auth)/reports/library/page.tsx:6-7` archive/delete imports.
- `app/(auth)/reports/library/page.tsx:318` delete report draft call.
- `app/(auth)/reports/library/page.tsx:366` archive report draft call.

### Portfolio/report CTAs

Search command:

`rg -n "Continue to My Portfolio|Open My Portfolio|Continue to My Reports|Open My Reports|Start report" app lib src`

Hits include:

- `app/components/clean/CleanCaptureWorkspace.tsx:3259`, `3264` Continue/Open My Portfolio.
- `app/components/clean/CleanPortfolioWorkspace.tsx:1528`, `1532` Continue/Open My Reports.
- `app/components/clean/CleanReportsWorkspace.tsx:1360`, `1584`, `1842` Start report.
- `lib/clean/guidance/client.ts:170`, `186` Open My Portfolio/My Reports.
- `lib/reporting.ts:1946` Start report draft.
- `lib/learningIntelligence.ts:240` Open My Reports.

### My Review

Search command:

`rg -n "My Review|my-review" app lib src`

Hits:

- `app/components/clean/CleanReviewWorkspace.tsx:282` My Review workspace title.
- `app/components/clean/design-v2/MyLearnaAppShellV2.tsx:34` My Review nav item.
- `app/components/clean/activity-player-v5/adapters/myReviewV5Adapter.ts:411`, `418`, `420` My Review adapter references.
- `app/components/clean/activity-player-v5/answerChecking.test.ts:571` My Review visual fraction test.

## Files Changed By Stage 0

Documentation only:

- `docs/qa/QA_REMEDIATION_BASELINE.md`

No product source files were intentionally changed.

## Completion Criteria Status

- No local work overwritten: yes.
- Current app identified: yes, from source inventory.
- Divergence documented: blocked, Git unavailable so divergence cannot be verified.
- Build/lint/test baseline recorded: yes.
- Stage 1 inventory complete: yes, representative paths and line numbers recorded.
- Safe implementation branch created: no, blocked because Git is unavailable and working tree state cannot be verified.
- Product code changed: no.

## Final Status

BASELINE BLOCKED - local/remote histories require manual reconciliation
