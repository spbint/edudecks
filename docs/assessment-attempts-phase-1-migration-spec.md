# Assessment Attempts Phase 1 Migration Spec

## Purpose

This document defines the migration-ready Phase 1 persistence design for MyLearna assessment attempts.

Phase 1 is intentionally limited to saving:

- assessment session metadata
- per-item assessment responses
- local closed-item results
- local adaptive summary snapshot

Phase 1 does not update formal judgement systems or downstream intelligence systems.

This spec is based on the current clean-schema conventions already used by:

- `public.assessment_skill_statuses`
- `public.evidence_entries`
- the clean family-only schema in `sql/clean`

This is a design/specification document only.

It does not create:

- a real SQL migration file
- a Supabase write path
- TypeScript client code
- assessment player wiring

## Files reviewed

- [20260507_clean_family_schema_reset_install_v2.sql](</C:/Users/seanb/edu-dashboard/sql/clean/20260507_clean_family_schema_reset_install_v2.sql:144>)
- [20260519_clean_assessment_skill_statuses.sql](</C:/Users/seanb/edu-dashboard/sql/clean/20260519_clean_assessment_skill_statuses.sql:1>)
- [20260524_clean_assessment_pathway_step_columns.sql](</C:/Users/seanb/edu-dashboard/sql/clean/20260524_clean_assessment_pathway_step_columns.sql:1>)
- [client.ts](</C:/Users/seanb/edu-dashboard/lib/clean/assessments/client.ts:22>)
- [types.ts](</C:/Users/seanb/edu-dashboard/lib/clean/assessments/types.ts:54>)
- [client.ts](</C:/Users/seanb/edu-dashboard/lib/clean/evidence/client.ts:144>)
- [types.ts](</C:/Users/seanb/edu-dashboard/lib/clean/evidence/types.ts:1>)
- [pathwayStepState.ts](</C:/Users/seanb/edu-dashboard/lib/clean/pathways/pathwayStepState.ts:22>)
- [learningIntelligenceSummary.ts](</C:/Users/seanb/edu-dashboard/lib/clean/curriculum/learningIntelligenceSummary.ts:856>)
- [assessment-trust-persistence-model.md](</C:/Users/seanb/edu-dashboard/docs/assessment-trust-persistence-model.md:1>)

## Phase 1 scope

Phase 1 should persist attempts only.

Phase 1 should save:

- one assessment attempt record per completed session
- one response record per item within that attempt
- item snapshots and summary snapshots needed to reconstruct the session later

Phase 1 should not:

- update `public.assessment_skill_statuses`
- update pathway progress
- create evidence
- update My Curriculum / Learning Intelligence
- update reports
- save parent judgement as authoritative confidence
- persist AI review outputs

## Final recommended table names

- `public.assessment_attempts`
- `public.assessment_attempt_responses`

These names match the current clean-schema naming pattern:

- plural table names
- snake_case columns
- family-scoped ownership

## Design principles

### 1. Keep attempts separate from confidence

`public.assessment_skill_statuses` is a judgement/state table.

`public.assessment_attempts` should be a session-history table.

They should remain separate.

### 2. Store canonical pathway identity at write time

Attempts should persist the same canonical step identity already used elsewhere:

- `subject_key`
- `strand_key`
- `stage_key`
- `pathway_step_id`
- `step_key`

This avoids later backfilling or ambiguous joins.

### 3. Snapshot the item and summary state used during the session

The current item bank lives in TypeScript.
It may change over time.

Attempt persistence should therefore save:

- `item_snapshot`
- `summary_snapshot`

so the attempt remains historically reconstructable.

### 4. Use existing clean-schema trust boundaries

The clean schema already uses:

- `family_id`
- `created_by_user_id`
- `created_at`
- `updated_at`
- `public.clean_set_updated_at()`
- RLS via `public.is_family_member(family_id)`

Phase 1 should follow the same pattern exactly.

## Final recommended table definitions

### Table 1: `public.assessment_attempts`

Purpose:
Represents one assessment session for one learner on one canonical pathway step.

#### Final columns

| Column | Type | Null | Default | References | Notes |
| --- | --- | --- | --- | --- | --- |
| `id` | `uuid` | not null | `gen_random_uuid()` | primary key | Standard clean-schema primary key |
| `family_id` | `uuid` | not null | none | `public.family_profiles(id) on delete cascade` | Family-scoped ownership |
| `learner_id` | `uuid` | not null | none | `public.learners(id) on delete cascade` | Learner who completed the attempt |
| `subject_key` | `text` | not null | none | none | Canonical subject identity |
| `strand_key` | `text` | not null | none | none | Canonical strand identity |
| `stage_key` | `text` | not null | none | none | Canonical stage identity |
| `pathway_step_id` | `text` | not null | none | none | Canonical pathway step ID |
| `step_key` | `text` | not null | none | none | Canonical step key |
| `progression_band_key` | `text` | null | none | none | Optional conceptual band key for bank-level analytics |
| `item_bank_key` | `text` | not null | none | none | Example: `number-approximation-assessment-items` |
| `mode` | `text` | not null | `'diagnostic'` | none | Session mode |
| `source_route` | `text` | null | none | none | Example: `/assessments/number-approximation-prototype` |
| `status` | `text` | not null | `'completed'` | none | Attempt lifecycle state |
| `item_count` | `integer` | not null | `0` | none | Total items in the session |
| `attempted_count` | `integer` | not null | `0` | none | Items with submitted responses |
| `auto_correct_count` | `integer` | not null | `0` | none | Closed items locally marked correct |
| `auto_incorrect_count` | `integer` | not null | `0` | none | Closed items locally marked incorrect |
| `review_needed_count` | `integer` | not null | `0` | none | Items needing adult review |
| `summary_snapshot` | `jsonb` | not null | `'{}'::jsonb` | none | Saved local insight summary shown at completion |
| `started_at` | `timestamptz` | not null | `now()` | none | Session start |
| `completed_at` | `timestamptz` | null | none | none | Session completion time |
| `created_by_user_id` | `uuid` | not null | none | none | Current authenticated user at creation |
| `created_at` | `timestamptz` | not null | `now()` | none | Standard audit column |
| `updated_at` | `timestamptz` | not null | `now()` | none | Standard audit column |

#### Recommended constraints

- primary key on `id`
- foreign keys on `family_id` and `learner_id`
- `check (mode in ('diagnostic', 'mini_check', 'post_check', 'practice_check'))`
- `check (status in ('in_progress', 'completed', 'abandoned'))`
- `check (stage_key in ('foundation-kindergarten', 'lower-primary', 'middle-primary', 'upper-primary', 'lower-secondary', 'years-9-10-consolidation'))`
- `check (item_count >= 0)`
- `check (attempted_count >= 0)`
- `check (auto_correct_count >= 0)`
- `check (auto_incorrect_count >= 0)`
- `check (review_needed_count >= 0)`
- `check (completed_at is null or completed_at >= started_at)`

### Table 2: `public.assessment_attempt_responses`

Purpose:
Represents one saved response to one item inside an assessment attempt.

#### Final columns

| Column | Type | Null | Default | References | Notes |
| --- | --- | --- | --- | --- | --- |
| `id` | `uuid` | not null | `gen_random_uuid()` | primary key | Standard clean-schema primary key |
| `family_id` | `uuid` | not null | none | `public.family_profiles(id) on delete cascade` | Family ownership for direct filtering and RLS |
| `learner_id` | `uuid` | not null | none | `public.learners(id) on delete cascade` | Learner redundancy is intentional for filtering |
| `assessment_attempt_id` | `uuid` | not null | none | `public.assessment_attempts(id) on delete cascade` | Parent attempt |
| `item_id` | `text` | not null | none | none | Stable item-bank item ID |
| `item_order` | `integer` | not null | none | none | Render/order position within the session |
| `progression_step_key` | `text` | null | none | none | Optional item-level conceptual link |
| `answer_type` | `text` | not null | none | none | Example: `multiple_choice`, `numeric`, `worked_response` |
| `local_result` | `text` | not null | `'unanswered'` | none | Local closed/open review outcome |
| `response_text` | `text` | null | none | none | Textual, numeric, or typed explanation response |
| `selected_option` | `text` | null | none | none | Selected option for multiple choice |
| `item_snapshot` | `jsonb` | not null | `'{}'::jsonb` | none | Snapshot of the exact item and review metadata shown |
| `submitted_at` | `timestamptz` | null | none | none | When the item response was submitted |
| `created_by_user_id` | `uuid` | not null | none | none | Current authenticated user at creation |
| `created_at` | `timestamptz` | not null | `now()` | none | Standard audit column |
| `updated_at` | `timestamptz` | not null | `now()` | none | Standard audit column |

#### Recommended constraints

- primary key on `id`
- foreign keys on `family_id`, `learner_id`, `assessment_attempt_id`
- `unique (assessment_attempt_id, item_id)`
- `check (item_order >= 1)`
- `check (local_result in ('correct', 'incorrect', 'review_needed', 'unanswered'))`

Note:
No strict `answer_type` check is recommended in Phase 1.

Reason:
The item-bank model is still evolving and may gain additional answer types before migration lands.

## Exact check constraint values

### `mode`

```sql
check (
  mode in (
    'diagnostic',
    'mini_check',
    'post_check',
    'practice_check'
  )
)
```

### `status`

```sql
check (
  status in (
    'in_progress',
    'completed',
    'abandoned'
  )
)
```

### `local_result`

```sql
check (
  local_result in (
    'correct',
    'incorrect',
    'review_needed',
    'unanswered'
  )
)
```

### `stage_key`

Recommended for new attempt tables:

```sql
check (
  stage_key in (
    'foundation-kindergarten',
    'lower-primary',
    'middle-primary',
    'upper-primary',
    'lower-secondary',
    'years-9-10-consolidation'
  )
)
```

Reason:
Unlike `assessment_skill_statuses`, these new tables do not need legacy human-readable stage labels for backward compatibility.

## Recommended indexes

### `public.assessment_attempts`

```sql
create index if not exists assessment_attempts_family_learner_created_idx
  on public.assessment_attempts (family_id, learner_id, created_at desc);

create index if not exists assessment_attempts_family_learner_pathway_step_idx
  on public.assessment_attempts (family_id, learner_id, pathway_step_id, created_at desc);

create index if not exists assessment_attempts_family_learner_status_idx
  on public.assessment_attempts (family_id, learner_id, status, created_at desc);
```

Optional later if query needs emerge:

```sql
create index if not exists assessment_attempts_pathway_step_idx
  on public.assessment_attempts (pathway_step_id);
```

### `public.assessment_attempt_responses`

```sql
create index if not exists assessment_attempt_responses_attempt_order_idx
  on public.assessment_attempt_responses (assessment_attempt_id, item_order);

create index if not exists assessment_attempt_responses_family_learner_attempt_idx
  on public.assessment_attempt_responses (family_id, learner_id, assessment_attempt_id);
```

Optional later if misconception analytics move into SQL:

```sql
create index if not exists assessment_attempt_responses_local_result_idx
  on public.assessment_attempt_responses (local_result);
```

## Recommended `updated_at` triggers

Use the existing shared trigger function:

- `public.clean_set_updated_at()`

Recommended trigger definitions:

```sql
drop trigger if exists clean_assessment_attempts_updated_at on public.assessment_attempts;
create trigger clean_assessment_attempts_updated_at
before update on public.assessment_attempts
for each row execute function public.clean_set_updated_at();

drop trigger if exists clean_assessment_attempt_responses_updated_at on public.assessment_attempt_responses;
create trigger clean_assessment_attempt_responses_updated_at
before update on public.assessment_attempt_responses
for each row execute function public.clean_set_updated_at();
```

## Recommended RLS enablement and policies

Phase 1 should mirror `assessment_skill_statuses` and `evidence_entries`.

### RLS enablement

```sql
alter table public.assessment_attempts enable row level security;
alter table public.assessment_attempt_responses enable row level security;
```

### Policies for `public.assessment_attempts`

```sql
drop policy if exists "clean assessment attempts select own family" on public.assessment_attempts;
create policy "clean assessment attempts select own family"
on public.assessment_attempts
for select
to authenticated
using (
  public.is_family_member(family_id)
);

drop policy if exists "clean assessment attempts insert own family" on public.assessment_attempts;
create policy "clean assessment attempts insert own family"
on public.assessment_attempts
for insert
to authenticated
with check (
  public.is_family_member(family_id)
  and created_by_user_id = auth.uid()
);

drop policy if exists "clean assessment attempts update own family" on public.assessment_attempts;
create policy "clean assessment attempts update own family"
on public.assessment_attempts
for update
to authenticated
using (
  public.is_family_member(family_id)
)
with check (
  public.is_family_member(family_id)
);

drop policy if exists "clean assessment attempts delete own family" on public.assessment_attempts;
create policy "clean assessment attempts delete own family"
on public.assessment_attempts
for delete
to authenticated
using (
  public.is_family_member(family_id)
);
```

### Policies for `public.assessment_attempt_responses`

```sql
drop policy if exists "clean assessment attempt responses select own family" on public.assessment_attempt_responses;
create policy "clean assessment attempt responses select own family"
on public.assessment_attempt_responses
for select
to authenticated
using (
  public.is_family_member(family_id)
);

drop policy if exists "clean assessment attempt responses insert own family" on public.assessment_attempt_responses;
create policy "clean assessment attempt responses insert own family"
on public.assessment_attempt_responses
for insert
to authenticated
with check (
  public.is_family_member(family_id)
  and created_by_user_id = auth.uid()
);

drop policy if exists "clean assessment attempt responses update own family" on public.assessment_attempt_responses;
create policy "clean assessment attempt responses update own family"
on public.assessment_attempt_responses
for update
to authenticated
using (
  public.is_family_member(family_id)
)
with check (
  public.is_family_member(family_id)
);

drop policy if exists "clean assessment attempt responses delete own family" on public.assessment_attempt_responses;
create policy "clean assessment attempt responses delete own family"
on public.assessment_attempt_responses
for delete
to authenticated
using (
  public.is_family_member(family_id)
);
```

## Draft SQL migration text

This is draft SQL only.
It belongs in this markdown spec for review.
It should not be copied into a real migration until approved.

```sql
create table if not exists public.assessment_attempts (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.family_profiles(id) on delete cascade,
  learner_id uuid not null references public.learners(id) on delete cascade,
  subject_key text not null,
  strand_key text not null,
  stage_key text not null,
  pathway_step_id text not null,
  step_key text not null,
  progression_band_key text,
  item_bank_key text not null,
  mode text not null default 'diagnostic',
  source_route text,
  status text not null default 'completed',
  item_count integer not null default 0,
  attempted_count integer not null default 0,
  auto_correct_count integer not null default 0,
  auto_incorrect_count integer not null default 0,
  review_needed_count integer not null default 0,
  summary_snapshot jsonb not null default '{}'::jsonb,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_by_user_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint assessment_attempts_mode_check
    check (
      mode in (
        'diagnostic',
        'mini_check',
        'post_check',
        'practice_check'
      )
    ),
  constraint assessment_attempts_status_check
    check (
      status in (
        'in_progress',
        'completed',
        'abandoned'
      )
    ),
  constraint assessment_attempts_stage_key_check
    check (
      stage_key in (
        'foundation-kindergarten',
        'lower-primary',
        'middle-primary',
        'upper-primary',
        'lower-secondary',
        'years-9-10-consolidation'
      )
    ),
  constraint assessment_attempts_item_count_check
    check (item_count >= 0),
  constraint assessment_attempts_attempted_count_check
    check (attempted_count >= 0),
  constraint assessment_attempts_auto_correct_count_check
    check (auto_correct_count >= 0),
  constraint assessment_attempts_auto_incorrect_count_check
    check (auto_incorrect_count >= 0),
  constraint assessment_attempts_review_needed_count_check
    check (review_needed_count >= 0),
  constraint assessment_attempts_completed_after_started_check
    check (completed_at is null or completed_at >= started_at)
);

create table if not exists public.assessment_attempt_responses (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.family_profiles(id) on delete cascade,
  learner_id uuid not null references public.learners(id) on delete cascade,
  assessment_attempt_id uuid not null references public.assessment_attempts(id) on delete cascade,
  item_id text not null,
  item_order integer not null,
  progression_step_key text,
  answer_type text not null,
  local_result text not null default 'unanswered',
  response_text text,
  selected_option text,
  item_snapshot jsonb not null default '{}'::jsonb,
  submitted_at timestamptz,
  created_by_user_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint assessment_attempt_responses_attempt_item_unique
    unique (assessment_attempt_id, item_id),
  constraint assessment_attempt_responses_item_order_check
    check (item_order >= 1),
  constraint assessment_attempt_responses_local_result_check
    check (
      local_result in (
        'correct',
        'incorrect',
        'review_needed',
        'unanswered'
      )
    )
);

create index if not exists assessment_attempts_family_learner_created_idx
  on public.assessment_attempts (family_id, learner_id, created_at desc);

create index if not exists assessment_attempts_family_learner_pathway_step_idx
  on public.assessment_attempts (family_id, learner_id, pathway_step_id, created_at desc);

create index if not exists assessment_attempts_family_learner_status_idx
  on public.assessment_attempts (family_id, learner_id, status, created_at desc);

create index if not exists assessment_attempt_responses_attempt_order_idx
  on public.assessment_attempt_responses (assessment_attempt_id, item_order);

create index if not exists assessment_attempt_responses_family_learner_attempt_idx
  on public.assessment_attempt_responses (family_id, learner_id, assessment_attempt_id);

drop trigger if exists clean_assessment_attempts_updated_at on public.assessment_attempts;
create trigger clean_assessment_attempts_updated_at
before update on public.assessment_attempts
for each row execute function public.clean_set_updated_at();

drop trigger if exists clean_assessment_attempt_responses_updated_at on public.assessment_attempt_responses;
create trigger clean_assessment_attempt_responses_updated_at
before update on public.assessment_attempt_responses
for each row execute function public.clean_set_updated_at();

alter table public.assessment_attempts enable row level security;
alter table public.assessment_attempt_responses enable row level security;

drop policy if exists "clean assessment attempts select own family" on public.assessment_attempts;
create policy "clean assessment attempts select own family"
on public.assessment_attempts
for select
to authenticated
using (
  public.is_family_member(family_id)
);

drop policy if exists "clean assessment attempts insert own family" on public.assessment_attempts;
create policy "clean assessment attempts insert own family"
on public.assessment_attempts
for insert
to authenticated
with check (
  public.is_family_member(family_id)
  and created_by_user_id = auth.uid()
);

drop policy if exists "clean assessment attempts update own family" on public.assessment_attempts;
create policy "clean assessment attempts update own family"
on public.assessment_attempts
for update
to authenticated
using (
  public.is_family_member(family_id)
)
with check (
  public.is_family_member(family_id)
);

drop policy if exists "clean assessment attempts delete own family" on public.assessment_attempts;
create policy "clean assessment attempts delete own family"
on public.assessment_attempts
for delete
to authenticated
using (
  public.is_family_member(family_id)
);

drop policy if exists "clean assessment attempt responses select own family" on public.assessment_attempt_responses;
create policy "clean assessment attempt responses select own family"
on public.assessment_attempt_responses
for select
to authenticated
using (
  public.is_family_member(family_id)
);

drop policy if exists "clean assessment attempt responses insert own family" on public.assessment_attempt_responses;
create policy "clean assessment attempt responses insert own family"
on public.assessment_attempt_responses
for insert
to authenticated
with check (
  public.is_family_member(family_id)
  and created_by_user_id = auth.uid()
);

drop policy if exists "clean assessment attempt responses update own family" on public.assessment_attempt_responses;
create policy "clean assessment attempt responses update own family"
on public.assessment_attempt_responses
for update
to authenticated
using (
  public.is_family_member(family_id)
)
with check (
  public.is_family_member(family_id)
);

drop policy if exists "clean assessment attempt responses delete own family" on public.assessment_attempt_responses;
create policy "clean assessment attempt responses delete own family"
on public.assessment_attempt_responses
for delete
to authenticated
using (
  public.is_family_member(family_id)
);
```

## Future TypeScript client helper shape

These helpers should live in a clean assessment client later.

They are not implemented in Phase 1 spec.

### `createAssessmentAttempt(...)`

Suggested shape:

```ts
type CreateAssessmentAttemptInput = {
  learnerId: string;
  subjectKey: string;
  strandKey: string;
  stageKey: string;
  pathwayStepId: string;
  stepKey: string;
  progressionBandKey?: string | null;
  itemBankKey: string;
  mode: "diagnostic" | "mini_check" | "post_check" | "practice_check";
  sourceRoute?: string | null;
  itemCount: number;
  startedAt?: string | null;
};

async function createAssessmentAttempt(
  familyId: string,
  input: CreateAssessmentAttemptInput,
): Promise<AssessmentAttempt> {}
```

### `createAssessmentAttemptResponses(...)`

Suggested shape:

```ts
type CreateAssessmentAttemptResponseInput = {
  assessmentAttemptId: string;
  learnerId: string;
  itemId: string;
  itemOrder: number;
  progressionStepKey?: string | null;
  answerType: string;
  localResult: "correct" | "incorrect" | "review_needed" | "unanswered";
  responseText?: string | null;
  selectedOption?: string | null;
  itemSnapshot: Record<string, unknown>;
  submittedAt?: string | null;
};

async function createAssessmentAttemptResponses(
  familyId: string,
  responses: CreateAssessmentAttemptResponseInput[],
): Promise<AssessmentAttemptResponse[]> {}
```

### `completeAssessmentAttempt(...)`

Suggested shape:

```ts
type CompleteAssessmentAttemptInput = {
  attemptId: string;
  attemptedCount: number;
  autoCorrectCount: number;
  autoIncorrectCount: number;
  reviewNeededCount: number;
  summarySnapshot: Record<string, unknown>;
  completedAt?: string | null;
};

async function completeAssessmentAttempt(
  familyId: string,
  input: CompleteAssessmentAttemptInput,
): Promise<AssessmentAttempt> {}
```

### `listAssessmentAttemptsForLearner(...)`

Suggested shape:

```ts
type ListAssessmentAttemptsOptions = {
  learnerId: string;
  subjectKey?: string | null;
  pathwayStepId?: string | null;
  status?: "in_progress" | "completed" | "abandoned" | null;
  limit?: number;
};

async function listAssessmentAttemptsForLearner(
  familyId: string,
  options: ListAssessmentAttemptsOptions,
): Promise<AssessmentAttempt[]> {}
```

### `getAssessmentAttemptWithResponses(...)`

Suggested shape:

```ts
async function getAssessmentAttemptWithResponses(
  familyId: string,
  attemptId: string,
): Promise<{
  attempt: AssessmentAttempt | null;
  responses: AssessmentAttemptResponse[];
}> {}
```

## Snapshot guidance

### `summary_snapshot`

Recommended keys:

- `attemptedCount`
- `correctCount`
- `incorrectCount`
- `reviewNeededCount`
- `topMisconceptionTargets`
- `topPracticeRecommendations`
- `suggestedFocusAreas`
- `suggestedNextStep`
- `parentJudgementPreview`

Note:
`parentJudgementPreview` may be shown in UI and included in the saved snapshot for historical reconstruction, but it must not be treated as authoritative confidence in Phase 1.

### `item_snapshot`

Recommended keys:

- `title`
- `prompt`
- `difficulty`
- `format`
- `options`
- `expectedAnswer`
- `acceptableAnswers`
- `markingGuide`
- `workedSolution`
- `misconceptionTargets`
- `adaptiveRoute`
- `visualSupport`
- `openResponseReview`

This is intentionally denormalized for auditability and replay safety.

## Explicit exclusions

Phase 1 must not do any of the following:

- no `assessment_skill_statuses` updates
- no pathway progress updates
- no evidence creation
- no My Curriculum writes
- no report updates
- no parent judgement as authoritative status
- no AI review persistence

Also excluded:

- no automatic Secure/Strong update
- no automatic prerequisite routing writes
- no learning intelligence aggregation writes
- no portfolio/report exports from assessment attempts

## Open questions before implementation

### 1. Should Phase 1 save only completed attempts?

Recommended initial answer:
- yes

Reason:
- lower write complexity
- avoids half-finished noise
- aligns with current local-only completion summary flow

### 2. Should abandoned attempts be saved later?

Recommended initial answer:
- not in the first rollout

The schema supports `abandoned`, but the first implementation can ignore it.

### 3. Should `selected_option` also be copied into `response_text`?

Recommended initial answer:
- no

Keep them separate and let `item_snapshot` preserve the option labels.

### 4. Should `answer_type` be constrained in SQL?

Recommended initial answer:
- no in Phase 1

The TypeScript item-bank model is still evolving.

### 5. Should `subject_key` also get a SQL check constraint?

Recommended initial answer:
- optional, but not required for Phase 1

The repo already enforces subject sets elsewhere, but this table can stay more flexible while item banks evolve.

### 6. Should attempts be unique per learner/step/day?

Recommended initial answer:
- no

Multiple attempts over time are valuable history.

### 7. Should responses duplicate `family_id` and `learner_id`?

Recommended answer:
- yes

Reason:
- simpler RLS
- simpler direct filtering
- matches existing clean client patterns

### 8. Should `summary_snapshot` include parent judgement preview?

Recommended answer:
- yes as a historical snapshot only

But it must not be treated as authoritative status.

### 9. Should `pathway_step_id` and `step_key` both be stored?

Recommended answer:
- yes

`pathway_step_id` is the canonical global identifier.
`step_key` remains useful for filtering and debugging.

## Recommended next step

After review and approval of this spec:

1. create the real SQL migration for `assessment_attempts` and `assessment_attempt_responses`
2. add clean TypeScript types and client helpers
3. wire the local assessment player to save completed attempts only
4. keep My Assessments, pathway progress, evidence, and curriculum updates out of that first implementation
