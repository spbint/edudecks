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

create index if not exists assessment_attempts_family_learner_pathway_created_idx
  on public.assessment_attempts (family_id, learner_id, pathway_step_id, created_at desc);

create index if not exists assessment_attempts_family_learner_status_created_idx
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
