-- MyLearna Maths Starting Point v1 — Number & Operations baseline persistence.
--
-- DESIGN / REVIEW MIGRATION ONLY.
-- DO NOT APPLY until the maths starting-point persistence foundation is explicitly approved.
-- Applying this file alone MUST NOT enable authenticated baseline writes.
--
-- This schema stores one multi-dimensional baseline attempt plus immutable item
-- responses. It deliberately does NOT:
--   * mark Pathways steps Secure;
--   * update assessment confidence;
--   * create Portfolio/report evidence;
--   * average the five Number & Operations continua into one level.
--
-- The customer route remains staff-gated and the application release gate keeps
-- persistence disabled while this SQL is under review.

create table if not exists public.assessment_baseline_attempts (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.family_profiles(id) on delete cascade,
  learner_id uuid not null references public.learners(id) on delete cascade,
  client_submission_id text not null,
  framework_id text not null,
  form_id text not null,
  form_version integer not null,
  schema_version integer not null,
  mode text not null default 'diagnostic',
  status text not null,
  source_route text not null,
  assessed_sub_elements integer not null default 0,
  expected_sub_elements integer not null default 5,
  scope_sub_elements text[] not null default array[
    'number-place-value',
    'counting-processes',
    'additive-strategies',
    'multiplicative-strategies',
    'understanding-money'
  ]::text[],
  unresolved_sub_elements text[] not null default '{}'::text[],
  profile_snapshot jsonb not null default '{}'::jsonb,
  evidence_preview_snapshot jsonb not null default '{}'::jsonb,
  started_at timestamptz not null,
  completed_at timestamptz not null,
  created_by_user_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint assessment_baseline_attempts_client_submission_check
    check (
      length(btrim(client_submission_id)) between 8 and 128
      and client_submission_id !~ '[[:space:]]'
    ),
  constraint assessment_baseline_attempts_framework_check
    check (framework_id = 'MYL-MATH-AU-NUMERACY-V9'),
  constraint assessment_baseline_attempts_form_check
    check (form_id = 'number-operations-baseline'),
  constraint assessment_baseline_attempts_version_check
    check (form_version >= 1 and schema_version >= 1),
  constraint assessment_baseline_attempts_mode_check
    check (mode = 'diagnostic'),
  constraint assessment_baseline_attempts_status_check
    check (status in ('complete', 'partial')),
  constraint assessment_baseline_attempts_source_route_check
    check (source_route = '/assessments/maths-starting-point'),
  constraint assessment_baseline_attempts_scope_check
    check (
      expected_sub_elements between 1 and 5
      and cardinality(scope_sub_elements) = expected_sub_elements
      and scope_sub_elements <@ array[
        'number-place-value',
        'counting-processes',
        'additive-strategies',
        'multiplicative-strategies',
        'understanding-money'
      ]::text[]
    ),
  constraint assessment_baseline_attempts_unresolved_check
    check (
      cardinality(unresolved_sub_elements) <= expected_sub_elements
      and unresolved_sub_elements <@ scope_sub_elements
    ),
  constraint assessment_baseline_attempts_assessed_count_check
    check (
      assessed_sub_elements >= 0
      and assessed_sub_elements <= expected_sub_elements
    ),
  constraint assessment_baseline_attempts_scope_resolution_check
    check (
      assessed_sub_elements + cardinality(unresolved_sub_elements) =
        expected_sub_elements
    ),
  constraint assessment_baseline_attempts_status_resolution_check
    check (
      (
        status = 'complete'
        and cardinality(unresolved_sub_elements) = 0
        and assessed_sub_elements = expected_sub_elements
      )
      or
      (
        status = 'partial'
        and cardinality(unresolved_sub_elements) > 0
        and assessed_sub_elements < expected_sub_elements
      )
    ),
  constraint assessment_baseline_attempts_completed_after_started_check
    check (completed_at >= started_at),
  constraint assessment_baseline_attempts_profile_object_check
    check (coalesce(jsonb_typeof(profile_snapshot), '') = 'object'),
  constraint assessment_baseline_attempts_evidence_object_check
    check (coalesce(jsonb_typeof(evidence_preview_snapshot), '') = 'object'),
  constraint assessment_baseline_attempts_unique_submission
    unique (family_id, learner_id, client_submission_id)
);

create table if not exists public.assessment_baseline_responses (
  id uuid primary key default gen_random_uuid(),
  baseline_attempt_id uuid not null
    references public.assessment_baseline_attempts(id) on delete cascade,
  family_id uuid not null references public.family_profiles(id) on delete cascade,
  learner_id uuid not null references public.learners(id) on delete cascade,
  sub_element_key text not null,
  stage_kind text not null,
  progression_level integer not null,
  stage_direction text null,
  bracket_lower_p integer null,
  bracket_upper_p integer null,
  item_id text not null,
  item_version integer null,
  item_pool_kind text null,
  item_pool_key text null,
  item_order integer not null,
  selected_option_ids jsonb not null default '[]'::jsonb,
  response_value text null,
  correct boolean not null,
  skill_id text not null,
  misconception_tags jsonb not null default '[]'::jsonb,
  time_spent_seconds integer null,
  item_snapshot jsonb not null,
  submitted_at timestamptz not null default now(),
  created_by_user_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint assessment_baseline_responses_sub_element_check
    check (
      sub_element_key in (
        'number-place-value',
        'counting-processes',
        'additive-strategies',
        'multiplicative-strategies',
        'understanding-money'
      )
    ),
  constraint assessment_baseline_responses_stage_kind_check
    check (
      stage_kind in ('initial', 'reserve', 'branch', 'search', 'boundary')
    ),
  constraint assessment_baseline_responses_progression_level_check
    check (
      (sub_element_key = 'counting-processes' and progression_level between 1 and 8)
      or
      (sub_element_key <> 'counting-processes' and progression_level between 1 and 10)
    ),
  constraint assessment_baseline_responses_direction_check
    check (stage_direction is null or stage_direction in ('down', 'up')),
  constraint assessment_baseline_responses_bracket_check
    check (
      (bracket_lower_p is null and bracket_upper_p is null)
      or (
        bracket_lower_p between 1 and 10
        and bracket_upper_p between 1 and 10
        and bracket_lower_p < bracket_upper_p
      )
    ),
  constraint assessment_baseline_responses_item_version_check
    check (item_version is null or item_version >= 1),
  constraint assessment_baseline_responses_pool_kind_check
    check (
      item_pool_kind is null
      or item_pool_kind in (
        'anchor',
        'reserve',
        'search',
        'boundary',
        'confirmation'
      )
    ),
  constraint assessment_baseline_responses_item_order_check
    check (item_order >= 1),
  constraint assessment_baseline_responses_selected_options_array_check
    check (coalesce(jsonb_typeof(selected_option_ids), '') = 'array'),
  constraint assessment_baseline_responses_misconceptions_array_check
    check (coalesce(jsonb_typeof(misconception_tags), '') = 'array'),
  constraint assessment_baseline_responses_item_snapshot_object_check
    check (coalesce(jsonb_typeof(item_snapshot), '') = 'object'),
  constraint assessment_baseline_responses_time_check
    check (time_spent_seconds is null or time_spent_seconds >= 0),
  constraint assessment_baseline_responses_attempt_item_unique
    unique (baseline_attempt_id, item_id),
  constraint assessment_baseline_responses_attempt_order_unique
    unique (baseline_attempt_id, item_order)
);

create index if not exists assessment_baseline_attempts_family_learner_created_idx
  on public.assessment_baseline_attempts
    (family_id, learner_id, created_at desc);

create index if not exists assessment_baseline_attempts_family_learner_completed_idx
  on public.assessment_baseline_attempts
    (family_id, learner_id, completed_at desc);

create index if not exists assessment_baseline_responses_attempt_order_idx
  on public.assessment_baseline_responses
    (baseline_attempt_id, item_order);

create index if not exists assessment_baseline_responses_family_learner_attempt_idx
  on public.assessment_baseline_responses
    (family_id, learner_id, baseline_attempt_id);

drop trigger if exists clean_assessment_baseline_attempts_updated_at
  on public.assessment_baseline_attempts;
create trigger clean_assessment_baseline_attempts_updated_at
before update on public.assessment_baseline_attempts
for each row execute function public.clean_set_updated_at();

drop trigger if exists clean_assessment_baseline_responses_updated_at
  on public.assessment_baseline_responses;
create trigger clean_assessment_baseline_responses_updated_at
before update on public.assessment_baseline_responses
for each row execute function public.clean_set_updated_at();

alter table public.assessment_baseline_attempts enable row level security;
alter table public.assessment_baseline_responses enable row level security;

revoke all on public.assessment_baseline_attempts from public;
revoke all on public.assessment_baseline_attempts from anon;
revoke all on public.assessment_baseline_attempts from authenticated;

revoke all on public.assessment_baseline_responses from public;
revoke all on public.assessment_baseline_responses from anon;
revoke all on public.assessment_baseline_responses from authenticated;

drop policy if exists "maths baseline attempts select own family"
  on public.assessment_baseline_attempts;
create policy "maths baseline attempts select own family"
on public.assessment_baseline_attempts
for select
to authenticated
using (
  public.is_family_member(family_id)
  and exists (
    select 1
    from public.learners learner
    where learner.id = learner_id
      and learner.family_id = public.assessment_baseline_attempts.family_id
  )
);

drop policy if exists "maths baseline attempts insert own family"
  on public.assessment_baseline_attempts;
create policy "maths baseline attempts insert own family"
on public.assessment_baseline_attempts
for insert
to authenticated
with check (
  public.is_family_member(family_id)
  and created_by_user_id = (select auth.uid())
  and exists (
    select 1
    from public.learners learner
    where learner.id = learner_id
      and learner.family_id = public.assessment_baseline_attempts.family_id
  )
);

drop policy if exists "maths baseline responses select own family"
  on public.assessment_baseline_responses;
create policy "maths baseline responses select own family"
on public.assessment_baseline_responses
for select
to authenticated
using (
  public.is_family_member(family_id)
  and exists (
    select 1
    from public.learners learner
    where learner.id = learner_id
      and learner.family_id = public.assessment_baseline_responses.family_id
  )
  and exists (
    select 1
    from public.assessment_baseline_attempts attempt
    where attempt.id = baseline_attempt_id
      and attempt.family_id = public.assessment_baseline_responses.family_id
      and attempt.learner_id = public.assessment_baseline_responses.learner_id
  )
);

drop policy if exists "maths baseline responses insert own family"
  on public.assessment_baseline_responses;
create policy "maths baseline responses insert own family"
on public.assessment_baseline_responses
for insert
to authenticated
with check (
  public.is_family_member(family_id)
  and created_by_user_id = (select auth.uid())
  and exists (
    select 1
    from public.learners learner
    where learner.id = learner_id
      and learner.family_id = public.assessment_baseline_responses.family_id
  )
  and exists (
    select 1
    from public.assessment_baseline_attempts attempt
    where attempt.id = baseline_attempt_id
      and attempt.family_id = public.assessment_baseline_responses.family_id
      and attempt.learner_id = public.assessment_baseline_responses.learner_id
      and attempt.created_by_user_id = (select auth.uid())
  )
);

create or replace function public.mylearna_validate_assessment_baseline_attempt()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null and not public.is_family_member(new.family_id) then
    raise exception 'Family workspace unavailable.' using errcode = '42501';
  end if;

  if not exists (
    select 1
    from public.learners learner
    where learner.id = new.learner_id
      and learner.family_id = new.family_id
  ) then
    raise exception 'Choose a learner from this family.' using errcode = '23503';
  end if;

  if cardinality(new.scope_sub_elements) <> (
    select count(distinct scoped.value)
    from unnest(new.scope_sub_elements) as scoped(value)
  ) then
    raise exception 'Baseline attempt scope must not contain duplicates.'
      using errcode = '22023';
  end if;

  if cardinality(new.unresolved_sub_elements) <> (
    select count(distinct unresolved.value)
    from unnest(new.unresolved_sub_elements) as unresolved(value)
  ) then
    raise exception 'Baseline unresolved areas must not contain duplicates.'
      using errcode = '22023';
  end if;

  if tg_op = 'UPDATE' and (
    new.family_id is distinct from old.family_id
    or new.learner_id is distinct from old.learner_id
    or new.client_submission_id is distinct from old.client_submission_id
    or new.framework_id is distinct from old.framework_id
    or new.form_id is distinct from old.form_id
    or new.form_version is distinct from old.form_version
    or new.schema_version is distinct from old.schema_version
    or new.mode is distinct from old.mode
    or new.expected_sub_elements is distinct from old.expected_sub_elements
    or new.scope_sub_elements is distinct from old.scope_sub_elements
    or new.started_at is distinct from old.started_at
    or new.created_by_user_id is distinct from old.created_by_user_id
  ) then
    raise exception 'Baseline attempt identity cannot be changed.'
      using errcode = '22023';
  end if;

  return new;
end;
$$;

revoke all
  on function public.mylearna_validate_assessment_baseline_attempt()
  from public;

drop trigger if exists mylearna_validate_assessment_baseline_attempt_before_write
  on public.assessment_baseline_attempts;
create trigger mylearna_validate_assessment_baseline_attempt_before_write
before insert or update on public.assessment_baseline_attempts
for each row
execute function public.mylearna_validate_assessment_baseline_attempt();

create or replace function public.mylearna_validate_assessment_baseline_response()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null and not public.is_family_member(new.family_id) then
    raise exception 'Family workspace unavailable.' using errcode = '42501';
  end if;

  if not exists (
    select 1
    from public.learners learner
    where learner.id = new.learner_id
      and learner.family_id = new.family_id
  ) then
    raise exception 'Choose a learner from this family.' using errcode = '23503';
  end if;

  if not exists (
    select 1
    from public.assessment_baseline_attempts attempt
    where attempt.id = new.baseline_attempt_id
      and attempt.family_id = new.family_id
      and attempt.learner_id = new.learner_id
      and new.sub_element_key = any(attempt.scope_sub_elements)
  ) then
    raise exception 'Baseline response does not match its attempt scope.'
      using errcode = '23503';
  end if;

  if tg_op = 'UPDATE' and (
    new.baseline_attempt_id is distinct from old.baseline_attempt_id
    or new.family_id is distinct from old.family_id
    or new.learner_id is distinct from old.learner_id
    or new.sub_element_key is distinct from old.sub_element_key
    or new.stage_kind is distinct from old.stage_kind
    or new.progression_level is distinct from old.progression_level
    or new.item_id is distinct from old.item_id
    or new.item_version is distinct from old.item_version
    or new.item_order is distinct from old.item_order
    or new.created_by_user_id is distinct from old.created_by_user_id
  ) then
    raise exception 'Baseline response identity cannot be changed.'
      using errcode = '22023';
  end if;

  return new;
end;
$$;

revoke all
  on function public.mylearna_validate_assessment_baseline_response()
  from public;

drop trigger if exists mylearna_validate_assessment_baseline_response_before_write
  on public.assessment_baseline_responses;
create trigger mylearna_validate_assessment_baseline_response_before_write
before insert or update on public.assessment_baseline_responses
for each row
execute function public.mylearna_validate_assessment_baseline_response();

create or replace function public.mylearna_save_number_operations_baseline(
  p_family_id uuid,
  p_learner_id uuid,
  p_client_submission_id text,
  p_attempt jsonb,
  p_responses jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_attempt_id uuid;
  v_response jsonb;
begin
  if v_user_id is null then
    raise exception 'Sign in to save this Maths starting point.'
      using errcode = '42501';
  end if;

  if not public.is_family_member(p_family_id) then
    raise exception 'Family workspace unavailable.'
      using errcode = '42501';
  end if;

  if not exists (
    select 1
    from public.learners learner
    where learner.id = p_learner_id
      and learner.family_id = p_family_id
  ) then
    raise exception 'Choose a learner from this family.'
      using errcode = '23503';
  end if;

  if length(btrim(coalesce(p_client_submission_id, ''))) not between 8 and 128 then
    raise exception 'Invalid baseline submission id.'
      using errcode = '22023';
  end if;

  if jsonb_typeof(p_attempt) <> 'object' then
    raise exception 'Baseline attempt payload must be an object.'
      using errcode = '22023';
  end if;

  if jsonb_typeof(p_responses) <> 'array' then
    raise exception 'Baseline responses payload must be an array.'
      using errcode = '22023';
  end if;

  if coalesce(jsonb_typeof(p_attempt->'scopeSubElements'), '') <> 'array' then
    raise exception 'scopeSubElements must be an array.'
      using errcode = '22023';
  end if;

  if (p_attempt->>'expectedSubElements')::integer not between 1 and 5 then
    raise exception 'expectedSubElements must be between 1 and 5.'
      using errcode = '22023';
  end if;

  if jsonb_array_length(p_attempt->'scopeSubElements') <>
     (p_attempt->>'expectedSubElements')::integer then
    raise exception 'scopeSubElements must match expectedSubElements.'
      using errcode = '22023';
  end if;

  if exists (
    select 1
    from jsonb_array_elements_text(p_attempt->'scopeSubElements') as scoped(value)
    where scoped.value not in (
      'number-place-value',
      'counting-processes',
      'additive-strategies',
      'multiplicative-strategies',
      'understanding-money'
    )
  ) then
    raise exception 'scopeSubElements contains an unsupported area.'
      using errcode = '22023';
  end if;

  if (
    select count(*)
    from jsonb_array_elements_text(p_attempt->'scopeSubElements')
  ) <> (
    select count(distinct scoped.value)
    from jsonb_array_elements_text(p_attempt->'scopeSubElements') as scoped(value)
  ) then
    raise exception 'scopeSubElements must not contain duplicates.'
      using errcode = '22023';
  end if;

  if (p_attempt->>'assessedSubElements')::integer < 0
     or (p_attempt->>'assessedSubElements')::integer >
        (p_attempt->>'expectedSubElements')::integer then
    raise exception 'assessedSubElements must fit inside the requested scope.'
      using errcode = '22023';
  end if;

  if coalesce(
    jsonb_typeof(p_attempt->'profileSnapshot'->'expectedSubElementKeys'),
    ''
  ) <> 'array' then
    raise exception 'profileSnapshot.expectedSubElementKeys must be an array.'
      using errcode = '22023';
  end if;

  if (p_attempt->'profileSnapshot'->'expectedSubElementKeys') <>
     (p_attempt->'scopeSubElements') then
    raise exception 'profileSnapshot scope must match scopeSubElements.'
      using errcode = '22023';
  end if;

  if nullif(p_attempt->'profileSnapshot'->>'expectedSubElements', '')::integer <>
     (p_attempt->>'expectedSubElements')::integer then
    raise exception 'profileSnapshot expectedSubElements must match the attempt.'
      using errcode = '22023';
  end if;

  if nullif(p_attempt->'profileSnapshot'->>'assessedSubElements', '')::integer <>
     (p_attempt->>'assessedSubElements')::integer then
    raise exception 'profileSnapshot assessedSubElements must match the attempt.'
      using errcode = '22023';
  end if;

  if coalesce(
    jsonb_typeof(p_attempt->'evidencePreviewSnapshot'->'scopeSubElements'),
    ''
  ) <> 'array' then
    raise exception 'evidencePreviewSnapshot.scopeSubElements must be an array.'
      using errcode = '22023';
  end if;

  if (p_attempt->'evidencePreviewSnapshot'->'scopeSubElements') <>
     (p_attempt->'scopeSubElements') then
    raise exception 'evidencePreviewSnapshot scope must match scopeSubElements.'
      using errcode = '22023';
  end if;

  if nullif(p_attempt->'evidencePreviewSnapshot'->>'expectedSubElements', '')::integer <>
     (p_attempt->>'expectedSubElements')::integer then
    raise exception 'evidencePreviewSnapshot expectedSubElements must match the attempt.'
      using errcode = '22023';
  end if;

  if nullif(p_attempt->'evidencePreviewSnapshot'->>'assessedSubElements', '')::integer <>
     (p_attempt->>'assessedSubElements')::integer then
    raise exception 'evidencePreviewSnapshot assessedSubElements must match the attempt.'
      using errcode = '22023';
  end if;

  if coalesce(jsonb_typeof(p_attempt->'unresolvedSubElements'), '') <> 'array' then
    raise exception 'unresolvedSubElements must be an array.'
      using errcode = '22023';
  end if;

  if exists (
    select 1
    from jsonb_array_elements_text(p_attempt->'unresolvedSubElements') as unresolved(value)
    where not ((p_attempt->'scopeSubElements') ? unresolved.value)
  ) then
    raise exception 'unresolvedSubElements must stay inside scopeSubElements.'
      using errcode = '22023';
  end if;

  if (
    select count(*)
    from jsonb_array_elements_text(p_attempt->'unresolvedSubElements')
  ) <> (
    select count(distinct unresolved.value)
    from jsonb_array_elements_text(p_attempt->'unresolvedSubElements') as unresolved(value)
  ) then
    raise exception 'unresolvedSubElements must not contain duplicates.'
      using errcode = '22023';
  end if;

  if (p_attempt->>'assessedSubElements')::integer +
       jsonb_array_length(p_attempt->'unresolvedSubElements') <>
       (p_attempt->>'expectedSubElements')::integer then
    raise exception 'Every requested scope area must be assessed or unresolved.'
      using errcode = '22023';
  end if;

  if p_attempt->>'status' = 'complete' and (
    (p_attempt->>'assessedSubElements')::integer <>
      (p_attempt->>'expectedSubElements')::integer
    or jsonb_array_length(p_attempt->'unresolvedSubElements') <> 0
  ) then
    raise exception 'A complete baseline must cover its full requested scope.'
      using errcode = '22023';
  end if;

  insert into public.assessment_baseline_attempts (
    family_id,
    learner_id,
    client_submission_id,
    framework_id,
    form_id,
    form_version,
    schema_version,
    mode,
    status,
    source_route,
    assessed_sub_elements,
    expected_sub_elements,
    scope_sub_elements,
    unresolved_sub_elements,
    profile_snapshot,
    evidence_preview_snapshot,
    started_at,
    completed_at,
    created_by_user_id
  )
  values (
    p_family_id,
    p_learner_id,
    p_client_submission_id,
    p_attempt->>'frameworkId',
    p_attempt->>'formId',
    (p_attempt->>'formVersion')::integer,
    (p_attempt->>'schemaVersion')::integer,
    p_attempt->>'mode',
    p_attempt->>'status',
    p_attempt->>'sourceRoute',
    (p_attempt->>'assessedSubElements')::integer,
    (p_attempt->>'expectedSubElements')::integer,
    array(
      select jsonb_array_elements_text(p_attempt->'scopeSubElements')
    ),
    array(
      select jsonb_array_elements_text(
        coalesce(p_attempt->'unresolvedSubElements', '[]'::jsonb)
      )
    ),
    coalesce(p_attempt->'profileSnapshot', '{}'::jsonb),
    coalesce(p_attempt->'evidencePreviewSnapshot', '{}'::jsonb),
    (p_attempt->>'startedAt')::timestamptz,
    (p_attempt->>'completedAt')::timestamptz,
    v_user_id
  )
  on conflict (family_id, learner_id, client_submission_id)
  do nothing
  returning id into v_attempt_id;

  if v_attempt_id is null then
    select attempt.id
    into v_attempt_id
    from public.assessment_baseline_attempts attempt
    where attempt.family_id = p_family_id
      and attempt.learner_id = p_learner_id
      and attempt.client_submission_id = p_client_submission_id;

    if v_attempt_id is null then
      raise exception 'Baseline save could not resolve its idempotent attempt.'
        using errcode = '40001';
    end if;

    return v_attempt_id;
  end if;

  for v_response in
    select value
    from jsonb_array_elements(p_responses)
  loop
    if coalesce(jsonb_typeof(v_response), '') <> 'object' then
      raise exception 'Each baseline response must be an object.'
        using errcode = '22023';
    end if;

    if coalesce(jsonb_typeof(v_response->'selectedOptionIds'), '') <> 'array' then
      raise exception 'selectedOptionIds must be an array.'
        using errcode = '22023';
    end if;

    if coalesce(jsonb_typeof(v_response->'misconceptionTags'), '') <> 'array' then
      raise exception 'misconceptionTags must be an array.'
        using errcode = '22023';
    end if;

    if coalesce(jsonb_typeof(v_response->'itemSnapshot'), '') <> 'object' then
      raise exception 'A versioned item snapshot is required.'
        using errcode = '22023';
    end if;

    insert into public.assessment_baseline_responses (
      baseline_attempt_id,
      family_id,
      learner_id,
      sub_element_key,
      stage_kind,
      progression_level,
      stage_direction,
      bracket_lower_p,
      bracket_upper_p,
      item_id,
      item_version,
      item_pool_kind,
      item_pool_key,
      item_order,
      selected_option_ids,
      response_value,
      correct,
      skill_id,
      misconception_tags,
      time_spent_seconds,
      item_snapshot,
      created_by_user_id
    )
    values (
      v_attempt_id,
      p_family_id,
      p_learner_id,
      v_response->>'subElementKey',
      v_response->>'stageKind',
      (v_response->>'progressionLevel')::integer,
      nullif(v_response->>'stageDirection', ''),
      nullif(v_response->>'bracketLowerP', '')::integer,
      nullif(v_response->>'bracketUpperP', '')::integer,
      v_response->>'itemId',
      nullif(v_response->>'itemVersion', '')::integer,
      nullif(v_response->>'itemPoolKind', ''),
      nullif(v_response->>'itemPoolKey', ''),
      (v_response->>'itemOrder')::integer,
      v_response->'selectedOptionIds',
      nullif(v_response->>'responseValue', ''),
      (v_response->>'correct')::boolean,
      v_response->>'skillId',
      v_response->'misconceptionTags',
      nullif(v_response->>'timeSpentSeconds', '')::integer,
      v_response->'itemSnapshot',
      v_user_id
    );
  end loop;

  return v_attempt_id;
end;
$$;

revoke all on function public.mylearna_save_number_operations_baseline(
  uuid,
  uuid,
  text,
  jsonb,
  jsonb
) from public;

revoke all on function public.mylearna_save_number_operations_baseline(
  uuid,
  uuid,
  text,
  jsonb,
  jsonb
) from anon;

-- Foundation stays dark even if this review migration is later applied.
-- Write activation is a separate, explicit migration/release decision.
revoke all on function public.mylearna_save_number_operations_baseline(
  uuid,
  uuid,
  text,
  jsonb,
  jsonb
) from authenticated;

-- Rollback (manual, only if no retained customer baseline data is required):
--
-- revoke execute on function public.mylearna_save_number_operations_baseline(
--   uuid, uuid, text, jsonb, jsonb
-- ) from authenticated;
-- drop function if exists public.mylearna_save_number_operations_baseline(
--   uuid, uuid, text, jsonb, jsonb
-- );
-- drop table if exists public.assessment_baseline_responses;
-- drop table if exists public.assessment_baseline_attempts;
