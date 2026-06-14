# Product Analytics V1

## Tooling

Product Analytics V1 sends events to PostHog's capture API from authenticated app pages.

Required environment variables:

- `NEXT_PUBLIC_POSTHOG_KEY`
- `NEXT_PUBLIC_POSTHOG_HOST`

If either value is missing, product analytics no-ops. No package dependency is required in this pass.

Meta Pixel remains limited to public marketing pages and is not used for authenticated product analytics.

## Events Implemented

| Event | Where | Safe properties |
| --- | --- | --- |
| `product_signed_in` | Authenticated v2 app shell | `route`, `area` |
| `app_page_viewed` | Authenticated v2 app shell | `route`, `area` |
| `daily_plan_viewed` | My Day route view | `route`, `area` |
| `pathway_viewed` | My Pathways / pathway activity route view | `route`, `area` |
| `portfolio_viewed` | My Portfolio route view | `route`, `area` |
| `report_previewed` | My Reports route view | `route`, `area` |
| `calendar_block_created` | My Calendar and My Day quick add | `area`, `route`, `hasLearner`, `hasLearningArea`, `hasStartTime`, `hasEndTime`, `blockType` |
| `calendar_block_updated` | My Calendar | `area`, `route`, `hasLearner`, `hasLearningArea`, `hasStartTime`, `hasEndTime`, `blockType` |
| `calendar_block_deleted` | My Calendar | `area`, `route`, `hasLearner`, `hasLearningArea`, `hasStartTime`, `hasEndTime`, `blockType` |
| `daily_plan_pdf_downloaded` | My Day and My Calendar | `area`, `route`, `viewType` |
| `weekly_plan_pdf_downloaded` | My Calendar | `area`, `route`, `viewType` |
| `monthly_plan_pdf_downloaded` | My Calendar | `area`, `route`, `viewType` |
| `evidence_created` | My Capture | `area`, `route`, `hasLearner`, `hasEvidence`, `subject`, `strand`, `source` |
| `evidence_updated` | My Capture | `area`, `route`, `hasLearner`, `hasEvidence`, `subject`, `strand`, `source` |
| `assessment_completed` | My Pathways assessment save completion | `area`, `route`, `subject`, `strand`, `stepNumber`, `questionCount`, `correctCount`, `incorrectCount`, `notSureCount`, `supportRecommendedCount`, `scoreBand`, `parentJudgementPresent` |
| `output_pdf_downloaded` | My Outputs PDF download | `area`, `route`, `hasEvidence`, `learnerCount` |

Each event also includes a generated `timestamp` property.

## Privacy Exclusions

The analytics helper strips properties that are not explicitly allowlisted. It also blocks keys that look like:

- names
- email addresses
- text/body fields
- notes
- descriptions
- answers/responses
- file/photo/content fields
- messages

Do not send these values to analytics:

- child names
- evidence text
- report body text
- portfolio content
- assessment answers
- raw learner work
- uploaded file names or file contents
- parent notes

## Suggested PostHog Funnel

1. `product_signed_in`
2. `calendar_block_created` or `pathway_viewed`
3. `assessment_completed` or `evidence_created`
4. `report_previewed`
5. `output_pdf_downloaded` or `daily_plan_pdf_downloaded`

Optional activation dashboard cards:

- Signed-in users by day
- First feature used after sign-in
- Calendar block creation rate
- Evidence creation rate
- Assessment completion rate
- Output PDF download rate
- Drop-off from `report_previewed` to `output_pdf_downloaded`

## What Remains Untracked

- `learner_created` / learner count changes
- report period update details
- report creation and status transitions
- practice started / practice completed
- portfolio highlight changes
- support/report submissions
- My Skills / H5P prototype activity starts or completions

These should be added only where safe event points are clear and no learner content is sent.

## Testing

1. Configure `NEXT_PUBLIC_POSTHOG_KEY` and `NEXT_PUBLIC_POSTHOG_HOST`.
2. Restart the dev server or redeploy so public env values are available client-side.
3. Sign in and visit `/my-day`, `/my-calendar`, `/my-pathways`, `/my-capture`, `/my-reports`, and `/my-outputs`.
4. Create a calendar block, create evidence, complete an assessment, and download a PDF.
5. Confirm events appear in PostHog.
6. Inspect event payloads and confirm no child names, evidence text, report text, assessment answers, notes or file data are present.
7. Remove or unset the PostHog env vars and confirm the app still works with no analytics errors.
