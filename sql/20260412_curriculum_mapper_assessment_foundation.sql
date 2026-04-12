create extension if not exists pgcrypto;

create table if not exists public.family_profiles (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  family_name text,
  home_country text,
  home_jurisdiction text,
  settings jsonb not null default '{}'::jsonb,
  curriculum_preferences jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_user_id)
);

alter table public.family_profiles
  add column if not exists user_id uuid references auth.users(id) on delete cascade,
  add column if not exists family_name text,
  add column if not exists home_country text,
  add column if not exists home_jurisdiction text,
  add column if not exists settings jsonb not null default '{}'::jsonb,
  add column if not exists curriculum_preferences jsonb not null default '{}'::jsonb,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

do $$
begin
  execute '
    update public.family_profiles
    set
      user_id = coalesce(user_id, owner_user_id),
      updated_at = coalesce(updated_at, now())
  ';

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'family_profiles'
      and column_name = 'family_display_name'
  ) then
    execute '
      update public.family_profiles
      set family_name = coalesce(nullif(family_name, ''''), nullif(family_display_name, ''''))
      where coalesce(family_name, '''') = ''''
    ';
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'family_profiles'
      and column_name = 'preferred_market'
  ) then
    execute '
      update public.family_profiles
      set home_country = coalesce(nullif(home_country, ''''), nullif(preferred_market, ''''))
      where coalesce(home_country, '''') = ''''
    ';
  end if;
end
$$;

create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  family_profile_id uuid not null references public.family_profiles(id) on delete cascade,
  first_name text not null,
  preferred_name text,
  surname text,
  dob date,
  year_level_label text,
  learning_notes jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.students
  add column if not exists family_profile_id uuid references public.family_profiles(id) on delete cascade,
  add column if not exists preferred_name text,
  add column if not exists surname text,
  add column if not exists dob date,
  add column if not exists year_level_label text,
  add column if not exists learning_notes jsonb not null default '{}'::jsonb,
  add column if not exists is_active boolean not null default true,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

do $$
begin
  execute '
    update public.students
    set
      preferred_name = coalesce(nullif(preferred_name, ''''), nullif(first_name, '''')),
      updated_at = coalesce(updated_at, now())
  ';

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'students'
      and column_name = 'family_name'
  ) then
    execute '
      update public.students
      set surname = coalesce(nullif(surname, ''''), nullif(family_name, ''''))
      where coalesce(surname, '''') = ''''
    ';
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'students'
      and column_name = 'year_level'
  ) then
    execute '
      update public.students
      set year_level_label = coalesce(nullif(year_level_label, ''''), concat(''Year '', year_level::text))
      where year_level is not null
        and coalesce(year_level_label, '''') = ''''
    ';
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'students'
      and column_name = 'user_id'
  ) then
    execute '
      update public.students s
      set family_profile_id = fp.id
      from public.family_profiles fp
      where s.family_profile_id is null
        and s.user_id is not null
        and fp.owner_user_id = s.user_id
    ';
  end if;
end
$$;

create table if not exists public.parent_student_links (
  id uuid primary key default gen_random_uuid(),
  family_profile_id uuid not null references public.family_profiles(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  relationship_role text not null default 'parent',
  created_at timestamptz not null default now(),
  unique (user_id, student_id)
);

alter table public.parent_student_links
  add column if not exists family_profile_id uuid references public.family_profiles(id) on delete cascade,
  add column if not exists user_id uuid references auth.users(id) on delete cascade,
  add column if not exists parent_user_id uuid references auth.users(id) on delete cascade,
  add column if not exists relationship_role text not null default 'parent',
  add column if not exists created_at timestamptz not null default now();

do $$
begin
  execute '
    update public.parent_student_links psl
    set
      user_id = coalesce(psl.user_id, psl.parent_user_id),
      created_at = coalesce(psl.created_at, now())
  ';

  execute '
    update public.parent_student_links psl
    set family_profile_id = coalesce(psl.family_profile_id, s.family_profile_id)
    from public.students s
    where s.id = psl.student_id
  ';

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'parent_student_links'
      and column_name = 'relationship_label'
  ) then
    execute '
      update public.parent_student_links
      set relationship_role = coalesce(nullif(relationship_role, ''''), nullif(relationship_label, ''''), ''parent'')
      where coalesce(relationship_role, '''') = ''''
    ';
  else
    execute '
      update public.parent_student_links
      set relationship_role = coalesce(nullif(relationship_role, ''''), ''parent'')
      where coalesce(relationship_role, '''') = ''''
    ';
  end if;
end
$$;

create table if not exists public.curriculum_frameworks (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  country text not null,
  jurisdiction text,
  version text not null,
  framework_type text not null,
  framework_scope text not null default 'national',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.curriculum_frameworks
  add column if not exists country text,
  add column if not exists jurisdiction text,
  add column if not exists version text,
  add column if not exists framework_scope text not null default 'national';

do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'curriculum_countries'
  ) then
    execute '
      update public.curriculum_frameworks cf
      set
        country = coalesce(nullif(cf.country, ''''), cc.code),
        version = coalesce(nullif(cf.version, ''''), ''legacy''),
        framework_scope = coalesce(
          nullif(cf.framework_scope, ''''),
          case when cf.region_id is null then ''national'' else ''regional'' end
        )
      from public.curriculum_countries cc
      where cc.id = cf.country_id
    ';
  else
    execute '
      update public.curriculum_frameworks
      set
        version = coalesce(nullif(version, ''''), ''legacy''),
        framework_scope = coalesce(nullif(framework_scope, ''''), ''national'')
    ';
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'curriculum_frameworks'
      and column_name = 'version_label'
  ) then
    execute '
      update public.curriculum_frameworks
      set version = coalesce(nullif(version, ''''), nullif(version_label, ''''), ''legacy'')
      where coalesce(version, '''') = ''''
    ';
  end if;

  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'curriculum_regions'
  ) then
    execute '
      update public.curriculum_frameworks cf
      set jurisdiction = coalesce(nullif(cf.jurisdiction, ''''), cr.code)
      from public.curriculum_regions cr
      where cf.region_id = cr.id
        and coalesce(cf.jurisdiction, '''') = ''''
    ';
  end if;
end
$$;

create unique index if not exists idx_curriculum_frameworks_code
  on public.curriculum_frameworks(code);

create table if not exists public.curriculum_levels (
  id uuid primary key default gen_random_uuid(),
  framework_id uuid not null references public.curriculum_frameworks(id) on delete cascade,
  level_code text not null,
  level_label text not null,
  level_type text not null default 'year',
  sort_order integer not null default 0,
  unique (framework_id, level_code)
);

alter table public.curriculum_levels
  add column if not exists level_code text,
  add column if not exists level_label text,
  add column if not exists sort_order integer not null default 0;

do $$
begin
  execute '
    update public.curriculum_levels
    set level_type = coalesce(nullif(level_type, ''''), ''year'')
  ';

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'curriculum_levels'
      and column_name = 'official_level_label'
  ) then
    execute '
      update public.curriculum_levels
      set
        level_code = coalesce(nullif(level_code, ''''), nullif(official_level_label, '''')),
        level_label = coalesce(nullif(level_label, ''''), nullif(official_level_label, ''''))
    ';
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'curriculum_levels'
      and column_name = 'normalized_level_label'
  ) then
    execute '
      update public.curriculum_levels
      set level_label = coalesce(nullif(level_label, ''''), nullif(normalized_level_label, ''''))
      where coalesce(level_label, '''') = ''''
    ';
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'curriculum_levels'
      and column_name = 'normalized_sort_order'
  ) then
    execute '
      update public.curriculum_levels
      set sort_order = coalesce(sort_order, normalized_sort_order, 0)
    ';
  end if;
end
$$;

create unique index if not exists idx_curriculum_levels_framework_code
  on public.curriculum_levels(framework_id, level_code);

create table if not exists public.curriculum_learning_areas (
  id uuid primary key default gen_random_uuid(),
  framework_id uuid not null references public.curriculum_frameworks(id) on delete cascade,
  code text not null,
  name text not null,
  sort_order integer not null default 0,
  unique (framework_id, code)
);

do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'curriculum_subjects'
  ) then
    insert into public.curriculum_learning_areas (framework_id, code, name, sort_order)
    select
      cs.framework_id,
      cs.code,
      cs.name,
      coalesce(cs.sort_order, 0)
    from public.curriculum_subjects cs
    on conflict (framework_id, code) do update
    set
      name = excluded.name,
      sort_order = excluded.sort_order;
  end if;
end
$$;

create table if not exists public.curriculum_strands (
  id uuid primary key default gen_random_uuid(),
  learning_area_id uuid not null references public.curriculum_learning_areas(id) on delete cascade,
  code text not null,
  name text not null,
  sort_order integer not null default 0,
  unique (learning_area_id, code)
);

alter table public.curriculum_strands
  add column if not exists learning_area_id uuid references public.curriculum_learning_areas(id) on delete cascade;

do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'curriculum_subjects'
  ) then
    execute '
      update public.curriculum_strands cs
      set learning_area_id = cla.id
      from public.curriculum_subjects subj
      join public.curriculum_learning_areas cla
        on cla.framework_id = subj.framework_id
       and cla.code = subj.code
      where cs.learning_area_id is null
        and cs.subject_id = subj.id
    ';
  end if;
end
$$;

create unique index if not exists idx_curriculum_strands_learning_area_code
  on public.curriculum_strands(learning_area_id, code)
  where learning_area_id is not null;

create table if not exists public.curriculum_substrands (
  id uuid primary key default gen_random_uuid(),
  strand_id uuid not null references public.curriculum_strands(id) on delete cascade,
  code text not null,
  name text not null,
  sort_order integer not null default 0,
  unique (strand_id, code)
);

create table if not exists public.curriculum_outcomes (
  id uuid primary key default gen_random_uuid(),
  framework_id uuid not null references public.curriculum_frameworks(id) on delete cascade,
  learning_area_id uuid not null references public.curriculum_learning_areas(id) on delete cascade,
  strand_id uuid not null references public.curriculum_strands(id) on delete cascade,
  substrand_id uuid references public.curriculum_substrands(id) on delete set null,
  level_id uuid not null references public.curriculum_levels(id) on delete cascade,
  code text not null,
  external_ref text,
  short_label text,
  full_text text not null,
  outcome_type text not null default 'content_descriptor',
  sort_order integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  unique (framework_id, code)
);

create table if not exists public.curriculum_elaborations (
  id uuid primary key default gen_random_uuid(),
  outcome_id uuid not null references public.curriculum_outcomes(id) on delete cascade,
  text text not null,
  sort_order integer not null default 0
);

create table if not exists public.learner_curriculum_profiles (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  framework_id uuid not null references public.curriculum_frameworks(id) on delete restrict,
  level_id uuid not null references public.curriculum_levels(id) on delete restrict,
  jurisdiction text,
  reporting_mode text,
  is_active boolean not null default true,
  started_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (student_id, framework_id, level_id)
);

create table if not exists public.learner_outcome_status (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  outcome_id uuid not null references public.curriculum_outcomes(id) on delete cascade,
  status text not null default 'not_introduced',
  mastery_level text,
  confidence_level text,
  evidence_count integer not null default 0,
  plan_count integer not null default 0,
  assessment_count integer not null default 0,
  latest_planned_at timestamptz,
  latest_evidence_at timestamptz,
  latest_assessed_at timestamptz,
  next_step text,
  notes text,
  updated_at timestamptz not null default now(),
  unique (student_id, outcome_id)
);

create table if not exists public.learning_plan_items (
  id uuid primary key default gen_random_uuid(),
  family_profile_id uuid not null references public.family_profiles(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  title text not null,
  description text,
  planned_date date,
  week_key text,
  status text not null default 'planned',
  source text not null default 'manual',
  created_by_user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.learning_plan_item_outcomes (
  id uuid primary key default gen_random_uuid(),
  learning_plan_item_id uuid not null references public.learning_plan_items(id) on delete cascade,
  outcome_id uuid not null references public.curriculum_outcomes(id) on delete cascade,
  unique (learning_plan_item_id, outcome_id)
);

create table if not exists public.evidence_entries (
  id uuid primary key default gen_random_uuid(),
  family_profile_id uuid not null references public.family_profiles(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  created_by_user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  summary text,
  body text,
  evidence_type text not null default 'note',
  occurred_on date,
  visibility text not null default 'private',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  is_deleted boolean not null default false
);

alter table public.evidence_entries
  add column if not exists family_profile_id uuid references public.family_profiles(id) on delete cascade,
  add column if not exists created_by_user_id uuid references auth.users(id) on delete cascade,
  add column if not exists metadata jsonb not null default '{}'::jsonb,
  add column if not exists updated_at timestamptz not null default now();

do $$
begin
  execute '
    update public.evidence_entries
    set updated_at = coalesce(updated_at, created_at, now())
  ';

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'evidence_entries'
      and column_name = 'user_id'
  ) then
    execute '
      update public.evidence_entries
      set created_by_user_id = coalesce(created_by_user_id, user_id)
    ';

    execute '
      update public.evidence_entries ee
      set family_profile_id = coalesce(ee.family_profile_id, s.family_profile_id, fp.id)
      from public.students s
      left join public.family_profiles fp
        on fp.owner_user_id = ee.user_id
      where s.id = ee.student_id
    ';
  else
    execute '
      update public.evidence_entries ee
      set family_profile_id = coalesce(ee.family_profile_id, s.family_profile_id)
      from public.students s
      where s.id = ee.student_id
    ';
  end if;
end
$$;

create table if not exists public.evidence_outcomes (
  id uuid primary key default gen_random_uuid(),
  evidence_id uuid not null references public.evidence_entries(id) on delete cascade,
  outcome_id uuid not null references public.curriculum_outcomes(id) on delete cascade,
  unique (evidence_id, outcome_id)
);

create table if not exists public.evidence_files (
  id uuid primary key default gen_random_uuid(),
  evidence_id uuid not null references public.evidence_entries(id) on delete cascade,
  bucket_name text not null,
  object_path text not null,
  original_filename text,
  mime_type text,
  file_size_bytes bigint,
  uploaded_by_user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.assessment_instruments (
  id uuid primary key default gen_random_uuid(),
  framework_id uuid references public.curriculum_frameworks(id) on delete set null,
  learning_area_id uuid references public.curriculum_learning_areas(id) on delete set null,
  title text not null,
  assessment_type text not null,
  description text,
  is_system boolean not null default false,
  created_by_user_id uuid references auth.users(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.assessment_items (
  id uuid primary key default gen_random_uuid(),
  instrument_id uuid not null references public.assessment_instruments(id) on delete cascade,
  outcome_id uuid references public.curriculum_outcomes(id) on delete set null,
  item_type text not null,
  prompt text not null,
  answer_key text,
  rubric jsonb,
  sort_order integer not null default 0
);

create table if not exists public.assessment_sessions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  instrument_id uuid references public.assessment_instruments(id) on delete set null,
  title text not null,
  administered_at timestamptz not null default now(),
  administered_by_user_id uuid not null references auth.users(id) on delete cascade,
  mode text not null default 'parent_led',
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.assessment_results (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.assessment_sessions(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  outcome_id uuid not null references public.curriculum_outcomes(id) on delete cascade,
  raw_score numeric,
  percentage numeric,
  mastery_level text,
  confidence_level text,
  judgment_note text,
  next_step text,
  recorded_at timestamptz not null default now()
);

create table if not exists public.assessment_result_evidence (
  id uuid primary key default gen_random_uuid(),
  assessment_result_id uuid not null references public.assessment_results(id) on delete cascade,
  evidence_id uuid not null references public.evidence_entries(id) on delete cascade,
  unique (assessment_result_id, evidence_id)
);

create table if not exists public.learner_learning_area_rollups (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  framework_id uuid not null references public.curriculum_frameworks(id) on delete cascade,
  learning_area_id uuid not null references public.curriculum_learning_areas(id) on delete cascade,
  total_outcomes integer not null default 0,
  planned_outcomes integer not null default 0,
  evidenced_outcomes integer not null default 0,
  assessed_outcomes integer not null default 0,
  secure_outcomes integer not null default 0,
  review_needed_outcomes integer not null default 0,
  updated_at timestamptz not null default now(),
  unique (student_id, framework_id, learning_area_id)
);

create or replace function public.set_row_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.current_family_profile_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select fp.id
  from public.family_profiles fp
  where fp.owner_user_id = auth.uid()
  limit 1
$$;

create or replace function public.user_can_access_student(target_student_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.students s
    left join public.parent_student_links psl
      on psl.student_id = s.id
    where s.id = target_student_id
      and (
        s.family_profile_id = public.current_family_profile_id()
        or coalesce(psl.user_id, psl.parent_user_id) = auth.uid()
      )
  )
$$;

create or replace function public.user_can_access_plan_item(target_plan_item_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.learning_plan_items lpi
    where lpi.id = target_plan_item_id
      and (
        lpi.family_profile_id = public.current_family_profile_id()
        or public.user_can_access_student(lpi.student_id)
      )
  )
$$;

create or replace function public.user_can_access_evidence(target_evidence_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.evidence_entries ee
    where ee.id = target_evidence_id
      and (
        ee.family_profile_id = public.current_family_profile_id()
        or public.user_can_access_student(ee.student_id)
      )
  )
$$;

create or replace function public.user_can_access_assessment_session(target_session_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.assessment_sessions sess
    where sess.id = target_session_id
      and public.user_can_access_student(sess.student_id)
  )
$$;

create or replace function public.user_can_access_assessment_result(target_result_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.assessment_results ar
    where ar.id = target_result_id
      and public.user_can_access_student(ar.student_id)
  )
$$;

revoke all on function public.current_family_profile_id() from public;
revoke all on function public.user_can_access_student(uuid) from public;
revoke all on function public.user_can_access_plan_item(uuid) from public;
revoke all on function public.user_can_access_evidence(uuid) from public;
revoke all on function public.user_can_access_assessment_session(uuid) from public;
revoke all on function public.user_can_access_assessment_result(uuid) from public;

grant execute on function public.current_family_profile_id() to authenticated;
grant execute on function public.user_can_access_student(uuid) to authenticated;
grant execute on function public.user_can_access_plan_item(uuid) to authenticated;
grant execute on function public.user_can_access_evidence(uuid) to authenticated;
grant execute on function public.user_can_access_assessment_session(uuid) to authenticated;
grant execute on function public.user_can_access_assessment_result(uuid) to authenticated;

create index if not exists idx_students_family_profile_id
  on public.students(family_profile_id);
create index if not exists idx_parent_student_links_user_id
  on public.parent_student_links(user_id);
create index if not exists idx_parent_student_links_family_profile_id
  on public.parent_student_links(family_profile_id);
create index if not exists idx_parent_student_links_student_id
  on public.parent_student_links(student_id);
create unique index if not exists idx_parent_student_links_user_student_unique
  on public.parent_student_links(user_id, student_id)
  where user_id is not null;
create index if not exists idx_curriculum_outcomes_framework_level
  on public.curriculum_outcomes(framework_id, level_id);
create index if not exists idx_curriculum_outcomes_learning_area
  on public.curriculum_outcomes(learning_area_id);
create index if not exists idx_learner_outcome_status_student_id
  on public.learner_outcome_status(student_id);
create index if not exists idx_learner_outcome_status_status
  on public.learner_outcome_status(status);
create index if not exists idx_learning_plan_items_student_date
  on public.learning_plan_items(student_id, planned_date);
create index if not exists idx_learning_plan_items_family_profile_id
  on public.learning_plan_items(family_profile_id);
create index if not exists idx_learning_plan_item_outcomes_outcome_id
  on public.learning_plan_item_outcomes(outcome_id);
create index if not exists idx_evidence_entries_student_date
  on public.evidence_entries(student_id, occurred_on);
create index if not exists idx_evidence_entries_family_profile_id
  on public.evidence_entries(family_profile_id);
create index if not exists idx_evidence_outcomes_outcome_id
  on public.evidence_outcomes(outcome_id);
create index if not exists idx_evidence_files_evidence_id
  on public.evidence_files(evidence_id);
create index if not exists idx_assessment_sessions_student_date
  on public.assessment_sessions(student_id, administered_at);
create index if not exists idx_assessment_results_student_outcome
  on public.assessment_results(student_id, outcome_id);
create index if not exists idx_assessment_results_session_id
  on public.assessment_results(session_id);
create index if not exists idx_learner_curriculum_profiles_student_id
  on public.learner_curriculum_profiles(student_id);
create index if not exists idx_learner_learning_area_rollups_student_framework
  on public.learner_learning_area_rollups(student_id, framework_id);

alter table public.family_profiles enable row level security;
alter table public.students enable row level security;
alter table public.parent_student_links enable row level security;
alter table public.learner_curriculum_profiles enable row level security;
alter table public.learner_outcome_status enable row level security;
alter table public.learning_plan_items enable row level security;
alter table public.learning_plan_item_outcomes enable row level security;
alter table public.evidence_entries enable row level security;
alter table public.evidence_outcomes enable row level security;
alter table public.evidence_files enable row level security;
alter table public.assessment_instruments enable row level security;
alter table public.assessment_items enable row level security;
alter table public.assessment_sessions enable row level security;
alter table public.assessment_results enable row level security;
alter table public.assessment_result_evidence enable row level security;
alter table public.learner_learning_area_rollups enable row level security;

drop policy if exists "family profiles own read" on public.family_profiles;
create policy "family profiles own read"
on public.family_profiles
for select
to authenticated
using (owner_user_id = auth.uid());

drop policy if exists "family profiles own insert" on public.family_profiles;
create policy "family profiles own insert"
on public.family_profiles
for insert
to authenticated
with check (owner_user_id = auth.uid());

drop policy if exists "family profiles own update" on public.family_profiles;
create policy "family profiles own update"
on public.family_profiles
for update
to authenticated
using (owner_user_id = auth.uid())
with check (owner_user_id = auth.uid());

drop policy if exists "students linked family read" on public.students;
create policy "students linked family read"
on public.students
for select
to authenticated
using (public.user_can_access_student(id));

drop policy if exists "students own family insert" on public.students;
create policy "students own family insert"
on public.students
for insert
to authenticated
with check (family_profile_id = public.current_family_profile_id());

drop policy if exists "students own family update" on public.students;
create policy "students own family update"
on public.students
for update
to authenticated
using (public.user_can_access_student(id))
with check (family_profile_id = public.current_family_profile_id());

drop policy if exists "students own family delete" on public.students;
create policy "students own family delete"
on public.students
for delete
to authenticated
using (family_profile_id = public.current_family_profile_id());

drop policy if exists "parent student links own read" on public.parent_student_links;
create policy "parent student links own read"
on public.parent_student_links
for select
to authenticated
using (
  family_profile_id = public.current_family_profile_id()
  or user_id = auth.uid()
  or parent_user_id = auth.uid()
);

drop policy if exists "parent student links own insert" on public.parent_student_links;
create policy "parent student links own insert"
on public.parent_student_links
for insert
to authenticated
with check (
  family_profile_id = public.current_family_profile_id()
  and coalesce(user_id, parent_user_id) = auth.uid()
);

drop policy if exists "parent student links own update" on public.parent_student_links;
create policy "parent student links own update"
on public.parent_student_links
for update
to authenticated
using (
  family_profile_id = public.current_family_profile_id()
  or user_id = auth.uid()
  or parent_user_id = auth.uid()
)
with check (
  family_profile_id = public.current_family_profile_id()
  and coalesce(user_id, parent_user_id) = auth.uid()
);

drop policy if exists "parent student links own delete" on public.parent_student_links;
create policy "parent student links own delete"
on public.parent_student_links
for delete
to authenticated
using (
  family_profile_id = public.current_family_profile_id()
  or user_id = auth.uid()
  or parent_user_id = auth.uid()
);

drop policy if exists "learner curriculum profiles linked read" on public.learner_curriculum_profiles;
create policy "learner curriculum profiles linked read"
on public.learner_curriculum_profiles
for select
to authenticated
using (public.user_can_access_student(student_id));

drop policy if exists "learner curriculum profiles linked write" on public.learner_curriculum_profiles;
create policy "learner curriculum profiles linked write"
on public.learner_curriculum_profiles
for all
to authenticated
using (public.user_can_access_student(student_id))
with check (public.user_can_access_student(student_id));

drop policy if exists "learner outcome status linked read" on public.learner_outcome_status;
create policy "learner outcome status linked read"
on public.learner_outcome_status
for select
to authenticated
using (public.user_can_access_student(student_id));

drop policy if exists "learner outcome status linked write" on public.learner_outcome_status;
create policy "learner outcome status linked write"
on public.learner_outcome_status
for all
to authenticated
using (public.user_can_access_student(student_id))
with check (public.user_can_access_student(student_id));

drop policy if exists "learning plan items family read" on public.learning_plan_items;
create policy "learning plan items family read"
on public.learning_plan_items
for select
to authenticated
using (
  family_profile_id = public.current_family_profile_id()
  or public.user_can_access_student(student_id)
);

drop policy if exists "learning plan items family insert" on public.learning_plan_items;
create policy "learning plan items family insert"
on public.learning_plan_items
for insert
to authenticated
with check (
  family_profile_id = public.current_family_profile_id()
  and public.user_can_access_student(student_id)
  and created_by_user_id = auth.uid()
);

drop policy if exists "learning plan items family update" on public.learning_plan_items;
create policy "learning plan items family update"
on public.learning_plan_items
for update
to authenticated
using (
  family_profile_id = public.current_family_profile_id()
  and public.user_can_access_student(student_id)
)
with check (
  family_profile_id = public.current_family_profile_id()
  and public.user_can_access_student(student_id)
);

drop policy if exists "learning plan items family delete" on public.learning_plan_items;
create policy "learning plan items family delete"
on public.learning_plan_items
for delete
to authenticated
using (family_profile_id = public.current_family_profile_id());

drop policy if exists "learning plan item outcomes family read" on public.learning_plan_item_outcomes;
create policy "learning plan item outcomes family read"
on public.learning_plan_item_outcomes
for select
to authenticated
using (public.user_can_access_plan_item(learning_plan_item_id));

drop policy if exists "learning plan item outcomes family write" on public.learning_plan_item_outcomes;
create policy "learning plan item outcomes family write"
on public.learning_plan_item_outcomes
for all
to authenticated
using (public.user_can_access_plan_item(learning_plan_item_id))
with check (public.user_can_access_plan_item(learning_plan_item_id));

drop policy if exists "evidence entries family read" on public.evidence_entries;
create policy "evidence entries family read"
on public.evidence_entries
for select
to authenticated
using (
  family_profile_id = public.current_family_profile_id()
  or public.user_can_access_student(student_id)
);

drop policy if exists "evidence entries family insert" on public.evidence_entries;
create policy "evidence entries family insert"
on public.evidence_entries
for insert
to authenticated
with check (
  family_profile_id = public.current_family_profile_id()
  and public.user_can_access_student(student_id)
  and created_by_user_id = auth.uid()
);

drop policy if exists "evidence entries family update" on public.evidence_entries;
create policy "evidence entries family update"
on public.evidence_entries
for update
to authenticated
using (
  family_profile_id = public.current_family_profile_id()
  and public.user_can_access_student(student_id)
)
with check (
  family_profile_id = public.current_family_profile_id()
  and public.user_can_access_student(student_id)
);

drop policy if exists "evidence entries family delete" on public.evidence_entries;
create policy "evidence entries family delete"
on public.evidence_entries
for delete
to authenticated
using (family_profile_id = public.current_family_profile_id());

drop policy if exists "evidence outcomes family read" on public.evidence_outcomes;
create policy "evidence outcomes family read"
on public.evidence_outcomes
for select
to authenticated
using (public.user_can_access_evidence(evidence_id));

drop policy if exists "evidence outcomes family write" on public.evidence_outcomes;
create policy "evidence outcomes family write"
on public.evidence_outcomes
for all
to authenticated
using (public.user_can_access_evidence(evidence_id))
with check (public.user_can_access_evidence(evidence_id));

drop policy if exists "evidence files family read" on public.evidence_files;
create policy "evidence files family read"
on public.evidence_files
for select
to authenticated
using (public.user_can_access_evidence(evidence_id));

drop policy if exists "evidence files family write" on public.evidence_files;
create policy "evidence files family write"
on public.evidence_files
for all
to authenticated
using (public.user_can_access_evidence(evidence_id))
with check (
  public.user_can_access_evidence(evidence_id)
  and uploaded_by_user_id = auth.uid()
);

drop policy if exists "assessment instruments visible" on public.assessment_instruments;
create policy "assessment instruments visible"
on public.assessment_instruments
for select
to authenticated
using (is_system = true or created_by_user_id = auth.uid());

drop policy if exists "assessment instruments own insert" on public.assessment_instruments;
create policy "assessment instruments own insert"
on public.assessment_instruments
for insert
to authenticated
with check (is_system = false and created_by_user_id = auth.uid());

drop policy if exists "assessment instruments own update" on public.assessment_instruments;
create policy "assessment instruments own update"
on public.assessment_instruments
for update
to authenticated
using (created_by_user_id = auth.uid())
with check (created_by_user_id = auth.uid());

drop policy if exists "assessment instruments own delete" on public.assessment_instruments;
create policy "assessment instruments own delete"
on public.assessment_instruments
for delete
to authenticated
using (created_by_user_id = auth.uid());

drop policy if exists "assessment items visible" on public.assessment_items;
create policy "assessment items visible"
on public.assessment_items
for select
to authenticated
using (
  exists (
    select 1
    from public.assessment_instruments ai
    where ai.id = instrument_id
      and (ai.is_system = true or ai.created_by_user_id = auth.uid())
  )
);

drop policy if exists "assessment items own write" on public.assessment_items;
create policy "assessment items own write"
on public.assessment_items
for all
to authenticated
using (
  exists (
    select 1
    from public.assessment_instruments ai
    where ai.id = instrument_id
      and ai.created_by_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.assessment_instruments ai
    where ai.id = instrument_id
      and ai.created_by_user_id = auth.uid()
  )
);

drop policy if exists "assessment sessions linked read" on public.assessment_sessions;
create policy "assessment sessions linked read"
on public.assessment_sessions
for select
to authenticated
using (public.user_can_access_student(student_id));

drop policy if exists "assessment sessions linked write" on public.assessment_sessions;
create policy "assessment sessions linked write"
on public.assessment_sessions
for all
to authenticated
using (public.user_can_access_student(student_id))
with check (
  public.user_can_access_student(student_id)
  and administered_by_user_id = auth.uid()
);

drop policy if exists "assessment results linked read" on public.assessment_results;
create policy "assessment results linked read"
on public.assessment_results
for select
to authenticated
using (public.user_can_access_student(student_id));

drop policy if exists "assessment results linked write" on public.assessment_results;
create policy "assessment results linked write"
on public.assessment_results
for all
to authenticated
using (public.user_can_access_student(student_id))
with check (
  public.user_can_access_student(student_id)
  and public.user_can_access_assessment_session(session_id)
);

drop policy if exists "assessment result evidence linked read" on public.assessment_result_evidence;
create policy "assessment result evidence linked read"
on public.assessment_result_evidence
for select
to authenticated
using (
  public.user_can_access_assessment_result(assessment_result_id)
  and public.user_can_access_evidence(evidence_id)
);

drop policy if exists "assessment result evidence linked write" on public.assessment_result_evidence;
create policy "assessment result evidence linked write"
on public.assessment_result_evidence
for all
to authenticated
using (
  public.user_can_access_assessment_result(assessment_result_id)
  and public.user_can_access_evidence(evidence_id)
)
with check (
  public.user_can_access_assessment_result(assessment_result_id)
  and public.user_can_access_evidence(evidence_id)
);

drop policy if exists "learner learning area rollups linked read" on public.learner_learning_area_rollups;
create policy "learner learning area rollups linked read"
on public.learner_learning_area_rollups
for select
to authenticated
using (public.user_can_access_student(student_id));

drop policy if exists "learner learning area rollups linked write" on public.learner_learning_area_rollups;
create policy "learner learning area rollups linked write"
on public.learner_learning_area_rollups
for all
to authenticated
using (public.user_can_access_student(student_id))
with check (public.user_can_access_student(student_id));

drop trigger if exists trg_family_profiles_set_updated_at on public.family_profiles;
create trigger trg_family_profiles_set_updated_at
before update on public.family_profiles
for each row
execute function public.set_row_updated_at();

drop trigger if exists trg_students_set_updated_at on public.students;
create trigger trg_students_set_updated_at
before update on public.students
for each row
execute function public.set_row_updated_at();

drop trigger if exists trg_learner_curriculum_profiles_set_updated_at on public.learner_curriculum_profiles;
create trigger trg_learner_curriculum_profiles_set_updated_at
before update on public.learner_curriculum_profiles
for each row
execute function public.set_row_updated_at();

drop trigger if exists trg_learner_outcome_status_set_updated_at on public.learner_outcome_status;
create trigger trg_learner_outcome_status_set_updated_at
before update on public.learner_outcome_status
for each row
execute function public.set_row_updated_at();

drop trigger if exists trg_learning_plan_items_set_updated_at on public.learning_plan_items;
create trigger trg_learning_plan_items_set_updated_at
before update on public.learning_plan_items
for each row
execute function public.set_row_updated_at();

drop trigger if exists trg_evidence_entries_set_updated_at on public.evidence_entries;
create trigger trg_evidence_entries_set_updated_at
before update on public.evidence_entries
for each row
execute function public.set_row_updated_at();

drop trigger if exists trg_learner_learning_area_rollups_set_updated_at on public.learner_learning_area_rollups;
create trigger trg_learner_learning_area_rollups_set_updated_at
before update on public.learner_learning_area_rollups
for each row
execute function public.set_row_updated_at();

-- Storage assumptions:
-- 1. Supabase Storage bucket "evidence" should exist as a private bucket.
--    Suggested object path format:
--    evidence/{family_profile_id}/{student_id}/{uuid}-{filename}
-- 2. Supabase Storage bucket "reports" should exist as a private bucket.
--    Suggested object path format:
--    reports/{family_profile_id}/{student_id}/{report_id}.pdf
-- 3. evidence_files stores Storage object references only. File bytes stay in Storage.
-- 4. This migration intentionally aligns with the existing evidence_entries table in place.
-- 5. Existing legacy curriculum_subjects / curriculum_standards tables are preserved.
--    Canonical family-first curriculum mapping should move forward through:
--    curriculum_learning_areas, curriculum_strands, curriculum_substrands,
--    curriculum_outcomes, curriculum_elaborations.
