create extension if not exists pgcrypto;

create table if not exists public.family_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  owner_user_id text,
  family_display_name text,
  preferred_market text,
  country text,
  curriculum_framework_id text,
  curriculum_jurisdiction_id text,
  reporting_mode text,
  academic_structure_type text,
  cycle_count integer,
  weeks_per_cycle integer,
  experience_mode text default 'family',
  default_child_id text,
  default_child_landing text,
  week_start text default 'monday',
  compact_mode boolean default false,
  show_advanced_insights boolean default false,
  show_authority_guidance boolean default true,
  auto_open_last_child boolean default true,
  evidence_privacy_default text default 'family',
  planner_auto_carry_forward boolean default true,
  planner_show_weekend boolean default true,
  portfolio_print_style text default 'calm',
  report_tone_default text default 'family-summary',
  notifications_weekly_digest boolean default true,
  notifications_readiness_alerts boolean default true,
  notifications_planner_nudges boolean default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.family_profiles
  add column if not exists owner_user_id text,
  add column if not exists country text,
  add column if not exists curriculum_framework_id text,
  add column if not exists curriculum_jurisdiction_id text,
  add column if not exists reporting_mode text,
  add column if not exists academic_structure_type text,
  add column if not exists cycle_count integer,
  add column if not exists weeks_per_cycle integer,
  add column if not exists experience_mode text default 'family',
  add column if not exists default_child_id text,
  add column if not exists default_child_landing text,
  add column if not exists week_start text default 'monday',
  add column if not exists compact_mode boolean default false,
  add column if not exists show_advanced_insights boolean default false,
  add column if not exists show_authority_guidance boolean default true,
  add column if not exists auto_open_last_child boolean default true,
  add column if not exists evidence_privacy_default text default 'family',
  add column if not exists planner_auto_carry_forward boolean default true,
  add column if not exists planner_show_weekend boolean default true,
  add column if not exists portfolio_print_style text default 'calm',
  add column if not exists report_tone_default text default 'family-summary',
  add column if not exists notifications_weekly_digest boolean default true,
  add column if not exists notifications_readiness_alerts boolean default true,
  add column if not exists notifications_planner_nudges boolean default true,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

do $$
declare
  owner_type text;
begin
  select data_type
  into owner_type
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'family_profiles'
    and column_name = 'owner_user_id';

  if owner_type = 'uuid' then
    execute 'update public.family_profiles set owner_user_id = user_id::uuid where owner_user_id is null';
  else
    execute 'update public.family_profiles set owner_user_id = user_id::text where owner_user_id is null';
  end if;
end $$;

create table if not exists public.family_settings (
  family_id text primary key,
  country_code text,
  state_code text,
  updated_at timestamptz not null default now()
);

create table if not exists public.family_calendar_templates (
  id text primary key,
  family_profile_id text not null,
  title text not null,
  cycle_type text not null default 'weekly',
  cycle_length integer,
  academic_structure_type text,
  slots_json jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.family_calendar_templates
  add column if not exists family_profile_id text,
  add column if not exists title text,
  add column if not exists cycle_type text default 'weekly',
  add column if not exists cycle_length integer,
  add column if not exists academic_structure_type text,
  add column if not exists slots_json jsonb not null default '[]'::jsonb,
  add column if not exists updated_at timestamptz not null default now();

create table if not exists public.family_programs (
  id text primary key,
  family_profile_id text not null,
  learner_id text,
  title text not null,
  subject_id text not null,
  framework_id text not null,
  jurisdiction_id text,
  period_type text not null default 'term',
  period_label text not null,
  duration_count integer not null default 1,
  segment_type text not null default 'week',
  start_date date,
  end_date date,
  calendar_template_slot_id text,
  curriculum_outcome_ids jsonb not null default '[]'::jsonb,
  segments_json jsonb not null default '[]'::jsonb,
  schedule_mapping_json jsonb,
  updated_at timestamptz not null default now()
);

alter table public.family_programs
  add column if not exists family_profile_id text,
  add column if not exists learner_id text,
  add column if not exists title text,
  add column if not exists subject_id text,
  add column if not exists framework_id text,
  add column if not exists jurisdiction_id text,
  add column if not exists period_type text default 'term',
  add column if not exists period_label text,
  add column if not exists duration_count integer default 1,
  add column if not exists segment_type text default 'week',
  add column if not exists start_date date,
  add column if not exists end_date date,
  add column if not exists calendar_template_slot_id text,
  add column if not exists curriculum_outcome_ids jsonb not null default '[]'::jsonb,
  add column if not exists segments_json jsonb not null default '[]'::jsonb,
  add column if not exists schedule_mapping_json jsonb,
  add column if not exists updated_at timestamptz not null default now();

create table if not exists public.learning_plan_items (
  id uuid primary key default gen_random_uuid(),
  family_profile_id text,
  student_id text,
  title text,
  description text,
  planned_date date,
  week_key text,
  status text default 'planned',
  source text,
  created_by_user_id text,
  curriculum_outcome_ids text[] not null default '{}',
  generated_from_program_id text,
  generated_from_segment_id text,
  generated_from_template_slot_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.learning_plan_items
  add column if not exists family_profile_id text,
  add column if not exists student_id text,
  add column if not exists title text,
  add column if not exists description text,
  add column if not exists planned_date date,
  add column if not exists week_key text,
  add column if not exists status text default 'planned',
  add column if not exists source text,
  add column if not exists created_by_user_id text,
  add column if not exists curriculum_outcome_ids text[] not null default '{}',
  add column if not exists generated_from_program_id text,
  add column if not exists generated_from_segment_id text,
  add column if not exists generated_from_template_slot_id text,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

create or replace function public.mylearna_family_profile_owned_by_auth(target_family_profile_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.family_profiles fp
    where fp.id::text = target_family_profile_id
      and (
        fp.user_id::text = auth.uid()::text
        or fp.owner_user_id::text = auth.uid()::text
      )
  );
$$;

grant execute on function public.mylearna_family_profile_owned_by_auth(text) to authenticated;

alter table public.family_profiles enable row level security;
alter table public.family_settings enable row level security;
alter table public.family_calendar_templates enable row level security;
alter table public.family_programs enable row level security;
alter table public.learning_plan_items enable row level security;

drop policy if exists "mylearna family profiles select own" on public.family_profiles;
create policy "mylearna family profiles select own"
on public.family_profiles
for select
to authenticated
using (
  user_id::text = auth.uid()::text
  or owner_user_id::text = auth.uid()::text
);

drop policy if exists "mylearna family profiles insert own" on public.family_profiles;
create policy "mylearna family profiles insert own"
on public.family_profiles
for insert
to authenticated
with check (
  user_id::text = auth.uid()::text
  and (
    owner_user_id is null
    or owner_user_id::text = auth.uid()::text
  )
);

drop policy if exists "mylearna family profiles update own" on public.family_profiles;
create policy "mylearna family profiles update own"
on public.family_profiles
for update
to authenticated
using (
  user_id::text = auth.uid()::text
  or owner_user_id::text = auth.uid()::text
)
with check (
  user_id::text = auth.uid()::text
  or owner_user_id::text = auth.uid()::text
);

drop policy if exists "mylearna family settings own" on public.family_settings;
create policy "mylearna family settings own"
on public.family_settings
for all
to authenticated
using (public.mylearna_family_profile_owned_by_auth(family_id))
with check (public.mylearna_family_profile_owned_by_auth(family_id));

drop policy if exists "mylearna calendar templates own" on public.family_calendar_templates;
create policy "mylearna calendar templates own"
on public.family_calendar_templates
for all
to authenticated
using (public.mylearna_family_profile_owned_by_auth(family_profile_id))
with check (public.mylearna_family_profile_owned_by_auth(family_profile_id));

drop policy if exists "mylearna programs own" on public.family_programs;
create policy "mylearna programs own"
on public.family_programs
for all
to authenticated
using (public.mylearna_family_profile_owned_by_auth(family_profile_id))
with check (public.mylearna_family_profile_owned_by_auth(family_profile_id));

drop policy if exists "mylearna learning plan items own" on public.learning_plan_items;
create policy "mylearna learning plan items own"
on public.learning_plan_items
for all
to authenticated
using (
  created_by_user_id::text = auth.uid()::text
  or public.mylearna_family_profile_owned_by_auth(family_profile_id)
)
with check (
  created_by_user_id::text = auth.uid()::text
  or public.mylearna_family_profile_owned_by_auth(family_profile_id)
);

create index if not exists family_profiles_user_idx
  on public.family_profiles (user_id);

create index if not exists family_calendar_templates_family_updated_idx
  on public.family_calendar_templates (family_profile_id, updated_at desc);

create index if not exists family_programs_family_learner_updated_idx
  on public.family_programs (family_profile_id, learner_id, updated_at desc);

create index if not exists learning_plan_items_family_student_date_idx
  on public.learning_plan_items (family_profile_id, student_id, planned_date);
