# MyLearna Number & Operations Baseline Persistence v1

Status: **design contract only — no Supabase migration is applied by this branch**

## Purpose

The new Number & Operations baseline is not a single pathway-step check.

It can assess and route independently across:

- Number and place value
- Counting processes
- Additive strategies
- Multiplicative strategies
- Understanding money

The existing `public.assessment_attempts` schema requires a single:

- `stage_key`
- `pathway_step_id`
- `step_key`

That shape is appropriate for the existing pathway-step assessment flow, but it is not a truthful persistence model for one baseline that spans several independent progression continua.

This document therefore defines the storage contract implied by the staff-only baseline prototype. It does **not** replace the existing pathway assessment tables and does **not** authorise a database migration.

## Canonical in-code contracts

The branch now produces:

- `NumberOperationsSubElementAttemptTrace`
- `NumberOperationsProfile`
- `NumberOperationsEvidencePreview`
- `NumberOperationsBaselineSummarySnapshot`
- `NumberOperationsBaselinePersistenceDraft`

The persistence draft deliberately omits:

- family ID
- learner ID
- created-by user ID
- database IDs

Those belong to the authenticated persistence boundary, not the measurement engine.

## Proposed future tables

### `assessment_baseline_attempts`

One row per all-in-one baseline session.

Proposed fields:

| Field | Type | Purpose |
|---|---|---|
| `id` | uuid PK | Baseline attempt identity |
| `family_id` | uuid FK | Family tenancy |
| `learner_id` | uuid FK | Learner |
| `framework_id` | text | e.g. `MYL-MATH-AU-NUMERACY-V9` |
| `form_id` | text | `number-operations-baseline` |
| `form_version` | integer | Exact baseline form contract |
| `schema_version` | integer | Summary/persistence schema version |
| `mode` | text | `diagnostic` initially |
| `status` | text | `in_progress`, `complete`, `partial`, `abandoned` |
| `source_route` | text | Product entry route |
| `assessed_sub_elements` | integer | Count with reportable result |
| `expected_sub_elements` | integer | Five for v1 |
| `unresolved_sub_elements` | text[] | Areas intentionally withheld |
| `profile_snapshot` | jsonb | Exact multi-dimensional result shown |
| `evidence_preview_snapshot` | jsonb | Exact evidence handoff shown |
| `started_at` | timestamptz | Start |
| `completed_at` | timestamptz | Completion |
| `created_by_user_id` | uuid | Auth user |
| `created_at` | timestamptz | Audit |
| `updated_at` | timestamptz | Audit |

### `assessment_baseline_responses`

One row per administered/scored response.

Proposed fields:

| Field | Type | Purpose |
|---|---|---|
| `id` | uuid PK | Response identity |
| `baseline_attempt_id` | uuid FK | Parent baseline |
| `family_id` | uuid FK | RLS/tenancy |
| `learner_id` | uuid FK | Learner |
| `sub_element_key` | text | Canonical continuum |
| `stage_kind` | text | `initial`, `reserve`, `branch`, `search`, `boundary` |
| `progression_level` | integer | P level targeted |
| `stage_direction` | text nullable | `up` / `down` |
| `bracket_lower_p` | integer nullable | Boundary context |
| `bracket_upper_p` | integer nullable | Boundary context |
| `item_id` | text | Versioned item identity |
| `item_order` | integer | Whole-session order |
| `selected_option_ids` | jsonb | Multi/single choice raw response |
| `response_value` | text nullable | Numeric/short answer raw response |
| `correct` | boolean | Local deterministic score |
| `skill_id` | text | Construct identity |
| `misconception_tags` | jsonb | Diagnostic metadata |
| `time_spent_seconds` | integer nullable | Telemetry only in v1 |
| `item_snapshot` | jsonb | Exact item/version shown |
| `submitted_at` | timestamptz | Audit |
| `created_by_user_id` | uuid | Auth user |

## Trust rules

The persistence layer may automatically save what happened in the session:

- administered items
- raw responses
- local deterministic scoring
- route trace
- multi-dimensional result profile
- suggested next verification

It must **not** automatically:

- mark a pathway step Secure
- overwrite assessment confidence
- generate a formal report statement
- create a Portfolio item
- convert routing-only evidence into high-confidence placement
- average the five sub-elements into one learner level

The current staff evidence preview therefore keeps:

- `requiresParentConfirmation: true`
- `portfolioEligibleAfterConfirmation: true`
- `reportEligibleAfterConfirmation: true`

## RLS direction

If/when implemented, both tables should follow the existing family tenancy model:

- select only when `public.is_family_member(family_id)`
- inserts require family membership
- `created_by_user_id = auth.uid()`
- updates/deletes restricted to own family

No service-role-only customer write path is proposed.

## Migration gate

Do **not** create or apply the migration until all of the following are true:

1. Staff baseline route passes hosted preview QA.
2. Mobile/phone visual QA passes.
3. The item/version snapshot payload is finalised.
4. The assessment profile/result language is accepted.
5. The parent confirmation/evidence UX is agreed.
6. RLS and rollback SQL are reviewed.
7. A staging persistence smoke test is authorised.

Until then, the branch remains preview/staff-only and the persistence mapper remains an in-code draft only.
