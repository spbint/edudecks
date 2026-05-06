-- Homeschool Intelligence Layer draft additions for the clean family-only schema.
-- Draft only. Do not execute automatically.
-- This file extends the clean rebuild with guidance, terms, templates, and generation scaffolds.

create table if not exists public.learner_jurisdiction_profiles (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.family_profiles(id) on delete cascade,
  learner_id uuid not null references public.learners(id) on delete cascade,
  country_code text not null,
  jurisdiction_code text,
  curriculum_framework_id text,
  year_level text,
  required_learning_areas jsonb not null default '[]'::jsonb,
  reporting_mode text not null default 'progress-review',
  review_cycle text,
  portfolio_required boolean not null default false,
  attendance_hours_required boolean not null default false,
  assessment_required boolean not null default false,
  notes text,
  created_by_user_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint learner_jurisdiction_profiles_reporting_mode_check
    check (reporting_mode in ('low-documentation', 'attendance-hours', 'learning-plan', 'portfolio-evidence', 'progress-review', 'annual-pack')),
  constraint learner_jurisdiction_profiles_family_learner_unique
    unique (family_id, learner_id)
);

create table if not exists public.academic_years (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.family_profiles(id) on delete cascade,
  title text not null,
  country_code text,
  jurisdiction_code text,
  starts_on date not null,
  ends_on date not null,
  week_start text not null default 'monday',
  notes text,
  created_by_user_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint academic_years_date_range_check
    check (ends_on >= starts_on),
  constraint academic_years_week_start_check
    check (week_start in ('monday', 'sunday'))
);

create table if not exists public.learning_periods (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.family_profiles(id) on delete cascade,
  academic_year_id uuid not null references public.academic_years(id) on delete cascade,
  title text not null,
  period_type text not null default 'term',
  starts_on date not null,
  ends_on date not null,
  is_break boolean not null default false,
  notes text,
  created_by_user_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint learning_periods_type_check
    check (period_type in ('term', 'semester', 'unit', 'break', 'custom')),
  constraint learning_periods_date_range_check
    check (ends_on >= starts_on)
);

create table if not exists public.blackout_days (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.family_profiles(id) on delete cascade,
  academic_year_id uuid null references public.academic_years(id) on delete cascade,
  learning_period_id uuid null references public.learning_periods(id) on delete cascade,
  title text not null,
  starts_on date not null,
  ends_on date not null,
  reason text,
  is_learning_blocked boolean not null default true,
  created_by_user_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint blackout_days_date_range_check
    check (ends_on >= starts_on)
);

create table if not exists public.master_templates (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.family_profiles(id) on delete cascade,
  learner_id uuid null references public.learners(id) on delete set null,
  title text not null,
  description text,
  scope_type text not null default 'family',
  is_active boolean not null default true,
  created_by_user_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint master_templates_scope_type_check
    check (scope_type in ('family', 'learner'))
);

create table if not exists public.template_blocks (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.family_profiles(id) on delete cascade,
  master_template_id uuid not null references public.master_templates(id) on delete cascade,
  learner_id uuid null references public.learners(id) on delete set null,
  weekday integer not null,
  title text not null,
  learning_area text,
  starts_at time,
  ends_at time,
  program_id uuid null references public.programs(id) on delete set null,
  program_segment_id uuid null references public.program_segments(id) on delete set null,
  notes text,
  session_label text,
  created_by_user_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint template_blocks_weekday_check
    check (weekday between 1 and 7)
);

create table if not exists public.learner_template_overrides (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.family_profiles(id) on delete cascade,
  learner_id uuid not null references public.learners(id) on delete cascade,
  master_template_id uuid not null references public.master_templates(id) on delete cascade,
  template_block_id uuid null references public.template_blocks(id) on delete cascade,
  weekday integer not null,
  title text,
  learning_area text,
  starts_at time,
  ends_at time,
  notes text,
  is_disabled boolean not null default false,
  created_by_user_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint learner_template_overrides_weekday_check
    check (weekday between 1 and 7)
);

create table if not exists public.generation_runs (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.family_profiles(id) on delete cascade,
  academic_year_id uuid null references public.academic_years(id) on delete set null,
  learning_period_id uuid null references public.learning_periods(id) on delete set null,
  master_template_id uuid null references public.master_templates(id) on delete set null,
  week_starts_on date not null,
  week_ends_on date not null,
  merge_strategy text not null default 'fill-empty',
  status text not null default 'preview',
  preview_payload jsonb not null default '[]'::jsonb,
  created_items_count integer not null default 0,
  skipped_items_count integer not null default 0,
  notes text,
  created_by_user_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint generation_runs_date_range_check
    check (week_ends_on >= week_starts_on),
  constraint generation_runs_merge_strategy_check
    check (merge_strategy in ('fill-empty', 'confirm-each', 'dry-run')),
  constraint generation_runs_status_check
    check (status in ('preview', 'recorded', 'applied', 'cancelled'))
);

create table if not exists public.guidance_states (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.family_profiles(id) on delete cascade,
  current_step_key text,
  completed_steps jsonb not null default '[]'::jsonb,
  dismissed_steps jsonb not null default '[]'::jsonb,
  is_my_day_ready boolean not null default false,
  notes text,
  created_by_user_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint guidance_states_family_unique
    unique (family_id)
);

alter table public.calendar_items
  add column if not exists source_type text not null default 'manual';

alter table public.calendar_items
  add column if not exists source_template_block_id uuid null references public.template_blocks(id) on delete set null;

alter table public.calendar_items
  add column if not exists source_program_segment_id uuid null references public.program_segments(id) on delete set null;

alter table public.calendar_items
  add column if not exists generation_run_id uuid null references public.generation_runs(id) on delete set null;

alter table public.calendar_items
  add column if not exists learning_area text;

alter table public.calendar_items
  add column if not exists session_label text;

alter table public.calendar_items
  drop constraint if exists calendar_items_source_type_check;

alter table public.calendar_items
  add constraint calendar_items_source_type_check
  check (source_type in ('manual', 'generated', 'template'));

create index if not exists learner_jurisdiction_profiles_family_learner_idx
  on public.learner_jurisdiction_profiles (family_id, learner_id);

create index if not exists academic_years_family_dates_idx
  on public.academic_years (family_id, starts_on, ends_on);

create index if not exists learning_periods_family_year_dates_idx
  on public.learning_periods (family_id, academic_year_id, starts_on, ends_on);

create index if not exists blackout_days_family_dates_idx
  on public.blackout_days (family_id, starts_on, ends_on);

create index if not exists master_templates_family_scope_idx
  on public.master_templates (family_id, learner_id, is_active);

create index if not exists template_blocks_template_weekday_idx
  on public.template_blocks (master_template_id, weekday, starts_at);

create index if not exists learner_template_overrides_family_learner_idx
  on public.learner_template_overrides (family_id, learner_id, master_template_id);

create index if not exists generation_runs_family_week_idx
  on public.generation_runs (family_id, week_starts_on, week_ends_on);

create index if not exists guidance_states_family_idx
  on public.guidance_states (family_id);

create index if not exists calendar_items_generation_idx
  on public.calendar_items (family_id, planned_date, source_type, generation_run_id);

drop trigger if exists clean_learner_jurisdiction_profiles_updated_at on public.learner_jurisdiction_profiles;
create trigger clean_learner_jurisdiction_profiles_updated_at
before update on public.learner_jurisdiction_profiles
for each row execute function public.clean_set_updated_at();

drop trigger if exists clean_academic_years_updated_at on public.academic_years;
create trigger clean_academic_years_updated_at
before update on public.academic_years
for each row execute function public.clean_set_updated_at();

drop trigger if exists clean_learning_periods_updated_at on public.learning_periods;
create trigger clean_learning_periods_updated_at
before update on public.learning_periods
for each row execute function public.clean_set_updated_at();

drop trigger if exists clean_blackout_days_updated_at on public.blackout_days;
create trigger clean_blackout_days_updated_at
before update on public.blackout_days
for each row execute function public.clean_set_updated_at();

drop trigger if exists clean_master_templates_updated_at on public.master_templates;
create trigger clean_master_templates_updated_at
before update on public.master_templates
for each row execute function public.clean_set_updated_at();

drop trigger if exists clean_template_blocks_updated_at on public.template_blocks;
create trigger clean_template_blocks_updated_at
before update on public.template_blocks
for each row execute function public.clean_set_updated_at();

drop trigger if exists clean_learner_template_overrides_updated_at on public.learner_template_overrides;
create trigger clean_learner_template_overrides_updated_at
before update on public.learner_template_overrides
for each row execute function public.clean_set_updated_at();

drop trigger if exists clean_generation_runs_updated_at on public.generation_runs;
create trigger clean_generation_runs_updated_at
before update on public.generation_runs
for each row execute function public.clean_set_updated_at();

drop trigger if exists clean_guidance_states_updated_at on public.guidance_states;
create trigger clean_guidance_states_updated_at
before update on public.guidance_states
for each row execute function public.clean_set_updated_at();

alter table public.learner_jurisdiction_profiles enable row level security;
alter table public.academic_years enable row level security;
alter table public.learning_periods enable row level security;
alter table public.blackout_days enable row level security;
alter table public.master_templates enable row level security;
alter table public.template_blocks enable row level security;
alter table public.learner_template_overrides enable row level security;
alter table public.generation_runs enable row level security;
alter table public.guidance_states enable row level security;

drop policy if exists "clean learner jurisdiction profiles select own family" on public.learner_jurisdiction_profiles;
create policy "clean learner jurisdiction profiles select own family"
on public.learner_jurisdiction_profiles
for select to authenticated
using (public.is_family_member(family_id));

drop policy if exists "clean learner jurisdiction profiles insert own family" on public.learner_jurisdiction_profiles;
create policy "clean learner jurisdiction profiles insert own family"
on public.learner_jurisdiction_profiles
for insert to authenticated
with check (public.is_family_member(family_id) and created_by_user_id = auth.uid());

drop policy if exists "clean learner jurisdiction profiles update own family" on public.learner_jurisdiction_profiles;
create policy "clean learner jurisdiction profiles update own family"
on public.learner_jurisdiction_profiles
for update to authenticated
using (public.is_family_member(family_id))
with check (public.is_family_member(family_id));

drop policy if exists "clean learner jurisdiction profiles delete own family" on public.learner_jurisdiction_profiles;
create policy "clean learner jurisdiction profiles delete own family"
on public.learner_jurisdiction_profiles
for delete to authenticated
using (public.is_family_member(family_id));

drop policy if exists "clean academic years select own family" on public.academic_years;
create policy "clean academic years select own family"
on public.academic_years
for select to authenticated
using (public.is_family_member(family_id));

drop policy if exists "clean academic years insert own family" on public.academic_years;
create policy "clean academic years insert own family"
on public.academic_years
for insert to authenticated
with check (public.is_family_member(family_id) and created_by_user_id = auth.uid());

drop policy if exists "clean academic years update own family" on public.academic_years;
create policy "clean academic years update own family"
on public.academic_years
for update to authenticated
using (public.is_family_member(family_id))
with check (public.is_family_member(family_id));

drop policy if exists "clean academic years delete own family" on public.academic_years;
create policy "clean academic years delete own family"
on public.academic_years
for delete to authenticated
using (public.is_family_member(family_id));

drop policy if exists "clean learning periods select own family" on public.learning_periods;
create policy "clean learning periods select own family"
on public.learning_periods
for select to authenticated
using (public.is_family_member(family_id));

drop policy if exists "clean learning periods insert own family" on public.learning_periods;
create policy "clean learning periods insert own family"
on public.learning_periods
for insert to authenticated
with check (public.is_family_member(family_id) and created_by_user_id = auth.uid());

drop policy if exists "clean learning periods update own family" on public.learning_periods;
create policy "clean learning periods update own family"
on public.learning_periods
for update to authenticated
using (public.is_family_member(family_id))
with check (public.is_family_member(family_id));

drop policy if exists "clean learning periods delete own family" on public.learning_periods;
create policy "clean learning periods delete own family"
on public.learning_periods
for delete to authenticated
using (public.is_family_member(family_id));

drop policy if exists "clean blackout days select own family" on public.blackout_days;
create policy "clean blackout days select own family"
on public.blackout_days
for select to authenticated
using (public.is_family_member(family_id));

drop policy if exists "clean blackout days insert own family" on public.blackout_days;
create policy "clean blackout days insert own family"
on public.blackout_days
for insert to authenticated
with check (public.is_family_member(family_id) and created_by_user_id = auth.uid());

drop policy if exists "clean blackout days update own family" on public.blackout_days;
create policy "clean blackout days update own family"
on public.blackout_days
for update to authenticated
using (public.is_family_member(family_id))
with check (public.is_family_member(family_id));

drop policy if exists "clean blackout days delete own family" on public.blackout_days;
create policy "clean blackout days delete own family"
on public.blackout_days
for delete to authenticated
using (public.is_family_member(family_id));

drop policy if exists "clean master templates select own family" on public.master_templates;
create policy "clean master templates select own family"
on public.master_templates
for select to authenticated
using (public.is_family_member(family_id));

drop policy if exists "clean master templates insert own family" on public.master_templates;
create policy "clean master templates insert own family"
on public.master_templates
for insert to authenticated
with check (public.is_family_member(family_id) and created_by_user_id = auth.uid());

drop policy if exists "clean master templates update own family" on public.master_templates;
create policy "clean master templates update own family"
on public.master_templates
for update to authenticated
using (public.is_family_member(family_id))
with check (public.is_family_member(family_id));

drop policy if exists "clean master templates delete own family" on public.master_templates;
create policy "clean master templates delete own family"
on public.master_templates
for delete to authenticated
using (public.is_family_member(family_id));

drop policy if exists "clean template blocks select own family" on public.template_blocks;
create policy "clean template blocks select own family"
on public.template_blocks
for select to authenticated
using (public.is_family_member(family_id));

drop policy if exists "clean template blocks insert own family" on public.template_blocks;
create policy "clean template blocks insert own family"
on public.template_blocks
for insert to authenticated
with check (public.is_family_member(family_id) and created_by_user_id = auth.uid());

drop policy if exists "clean template blocks update own family" on public.template_blocks;
create policy "clean template blocks update own family"
on public.template_blocks
for update to authenticated
using (public.is_family_member(family_id))
with check (public.is_family_member(family_id));

drop policy if exists "clean template blocks delete own family" on public.template_blocks;
create policy "clean template blocks delete own family"
on public.template_blocks
for delete to authenticated
using (public.is_family_member(family_id));

drop policy if exists "clean learner template overrides select own family" on public.learner_template_overrides;
create policy "clean learner template overrides select own family"
on public.learner_template_overrides
for select to authenticated
using (public.is_family_member(family_id));

drop policy if exists "clean learner template overrides insert own family" on public.learner_template_overrides;
create policy "clean learner template overrides insert own family"
on public.learner_template_overrides
for insert to authenticated
with check (public.is_family_member(family_id) and created_by_user_id = auth.uid());

drop policy if exists "clean learner template overrides update own family" on public.learner_template_overrides;
create policy "clean learner template overrides update own family"
on public.learner_template_overrides
for update to authenticated
using (public.is_family_member(family_id))
with check (public.is_family_member(family_id));

drop policy if exists "clean learner template overrides delete own family" on public.learner_template_overrides;
create policy "clean learner template overrides delete own family"
on public.learner_template_overrides
for delete to authenticated
using (public.is_family_member(family_id));

drop policy if exists "clean generation runs select own family" on public.generation_runs;
create policy "clean generation runs select own family"
on public.generation_runs
for select to authenticated
using (public.is_family_member(family_id));

drop policy if exists "clean generation runs insert own family" on public.generation_runs;
create policy "clean generation runs insert own family"
on public.generation_runs
for insert to authenticated
with check (public.is_family_member(family_id) and created_by_user_id = auth.uid());

drop policy if exists "clean generation runs update own family" on public.generation_runs;
create policy "clean generation runs update own family"
on public.generation_runs
for update to authenticated
using (public.is_family_member(family_id))
with check (public.is_family_member(family_id));

drop policy if exists "clean generation runs delete own family" on public.generation_runs;
create policy "clean generation runs delete own family"
on public.generation_runs
for delete to authenticated
using (public.is_family_member(family_id));

drop policy if exists "clean guidance states select own family" on public.guidance_states;
create policy "clean guidance states select own family"
on public.guidance_states
for select to authenticated
using (public.is_family_member(family_id));

drop policy if exists "clean guidance states insert own family" on public.guidance_states;
create policy "clean guidance states insert own family"
on public.guidance_states
for insert to authenticated
with check (public.is_family_member(family_id) and created_by_user_id = auth.uid());

drop policy if exists "clean guidance states update own family" on public.guidance_states;
create policy "clean guidance states update own family"
on public.guidance_states
for update to authenticated
using (public.is_family_member(family_id))
with check (public.is_family_member(family_id));

drop policy if exists "clean guidance states delete own family" on public.guidance_states;
create policy "clean guidance states delete own family"
on public.guidance_states
for delete to authenticated
using (public.is_family_member(family_id));
