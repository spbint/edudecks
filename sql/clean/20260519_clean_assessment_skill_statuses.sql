create table if not exists public.assessment_skill_statuses (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.family_profiles(id) on delete cascade,
  learner_id uuid not null references public.learners(id) on delete cascade,
  subject_key text not null,
  skill_key text not null,
  stage_key text not null,
  status text not null default 'Not assessed yet',
  note text,
  created_by_user_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint assessment_skill_statuses_subject_key_check
    check (subject_key in ('mathematics', 'english')),
  constraint assessment_skill_statuses_stage_key_check
    check (stage_key in ('Foundation', 'Lower Primary', 'Middle Primary', 'Upper Primary', 'Lower Secondary')),
  constraint assessment_skill_statuses_status_check
    check (status in ('Not assessed yet', 'Still developing', 'Developing', 'Secure', 'Strong')),
  constraint assessment_skill_statuses_family_learner_skill_stage_unique
    unique (family_id, learner_id, subject_key, skill_key, stage_key)
);

create index if not exists assessment_skill_statuses_family_learner_subject_idx
  on public.assessment_skill_statuses (family_id, learner_id, subject_key, updated_at desc);

drop trigger if exists clean_assessment_skill_statuses_updated_at on public.assessment_skill_statuses;
create trigger clean_assessment_skill_statuses_updated_at
before update on public.assessment_skill_statuses
for each row execute function public.clean_set_updated_at();

alter table public.assessment_skill_statuses enable row level security;

drop policy if exists "clean assessment skill statuses select own family" on public.assessment_skill_statuses;
create policy "clean assessment skill statuses select own family"
on public.assessment_skill_statuses
for select
to authenticated
using (
  public.is_family_member(family_id)
);

drop policy if exists "clean assessment skill statuses insert own family" on public.assessment_skill_statuses;
create policy "clean assessment skill statuses insert own family"
on public.assessment_skill_statuses
for insert
to authenticated
with check (
  public.is_family_member(family_id)
  and created_by_user_id = auth.uid()
);

drop policy if exists "clean assessment skill statuses update own family" on public.assessment_skill_statuses;
create policy "clean assessment skill statuses update own family"
on public.assessment_skill_statuses
for update
to authenticated
using (
  public.is_family_member(family_id)
)
with check (
  public.is_family_member(family_id)
);

drop policy if exists "clean assessment skill statuses delete own family" on public.assessment_skill_statuses;
create policy "clean assessment skill statuses delete own family"
on public.assessment_skill_statuses
for delete
to authenticated
using (
  public.is_family_member(family_id)
);
