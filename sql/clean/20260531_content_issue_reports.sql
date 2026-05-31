create table if not exists public.content_issue_reports (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  reporter_user_id uuid,
  learner_id uuid,
  mode text not null,
  issue_type text not null,
  note text,
  source_url text,
  subject_key text,
  strand_key text,
  stage_key text,
  pathway_step_id text,
  step_key text,
  step_title text,
  assessment_depth text,
  practice_depth text,
  step_assessment_key text,
  step_practice_key text,
  parent_item_bank_key text,
  parent_practice_module_key text,
  item_id text,
  task_id text,
  prompt text,
  response_type text,
  selected_answer text,
  expected_answer text,
  visual_support jsonb,
  context jsonb not null default '{}'::jsonb,
  status text not null default 'new',
  constraint content_issue_reports_mode_check
    check (mode in ('assessment', 'practice', 'summary')),
  constraint content_issue_reports_status_check
    check (status in ('new', 'reviewing', 'resolved', 'dismissed')),
  constraint content_issue_reports_issue_type_check
    check (
      issue_type in (
        'visual_wrong_or_missing',
        'question_wording_confusing',
        'correct_answer_seems_wrong',
        'answer_options_unclear',
        'visual_question_mismatch',
        'save_or_navigation_problem',
        'other'
      )
    )
);

create index if not exists content_issue_reports_created_idx
  on public.content_issue_reports (created_at desc);

create index if not exists content_issue_reports_status_created_idx
  on public.content_issue_reports (status, created_at desc);

create index if not exists content_issue_reports_step_idx
  on public.content_issue_reports (step_key, pathway_step_id);

alter table public.content_issue_reports enable row level security;

drop policy if exists "content issue reports insert own report" on public.content_issue_reports;
create policy "content issue reports insert own report"
on public.content_issue_reports
for insert
to authenticated
with check (
  reporter_user_id = auth.uid()
);

drop policy if exists "content issue reports no public select" on public.content_issue_reports;
create policy "content issue reports no public select"
on public.content_issue_reports
for select
to authenticated
using (false);
