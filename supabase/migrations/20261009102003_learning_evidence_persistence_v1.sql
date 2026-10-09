-- Learning Evidence Persistence V1
--
-- This migration defines an append-only persistence foundation for the
-- canonical LearningEvidenceResultV1 contract. It deliberately does not turn
-- on the Maths Starting Point application release gates. The only write RPC is
-- service-role-only so a browser cannot submit an educational interpretation
-- directly.

begin;

set local lock_timeout = '5s';
set local statement_timeout = '60s';

do $preflight$
begin
  if pg_catalog.to_regclass('public.family_profiles') is null
    or pg_catalog.to_regclass('public.family_members') is null
    or pg_catalog.to_regclass('public.learners') is null then
    raise exception 'Learning Evidence V1 requires the clean family tenancy tables';
  end if;

  if pg_catalog.to_regprocedure('public.is_family_member(uuid)') is null then
    raise exception 'Learning Evidence V1 requires public.is_family_member(uuid)';
  end if;
end
$preflight$;

do $learner_family_identity$
begin
  if not exists (
    select 1
    from pg_catalog.pg_constraint
    where conrelid = 'public.learners'::pg_catalog.regclass
      and conname = 'learners_family_id_id_key'
  ) then
    alter table public.learners
      add constraint learners_family_id_id_key unique (family_id, id);
  end if;
end
$learner_family_identity$;

create table public.learning_evidence_attempts (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.family_profiles(id) on delete cascade,
  learner_id uuid not null,
  attempt_identity text not null,
  product_id text not null,
  product_version text not null,
  module_id text not null,
  assessment_id text not null,
  assessment_version integer not null check (assessment_version > 0),
  attempt_kind text not null check (attempt_kind in ('initial', 'recheck')),
  completion_state text not null check (completion_state in ('complete', 'focused')),
  started_at timestamptz not null,
  completed_at timestamptz not null,
  evaluated_at timestamptz not null,
  source_subsystem text not null,
  result_schema_version integer not null check (result_schema_version > 0),
  scope_continuum_ids text[] not null,
  expected_result_count integer not null check (expected_result_count > 0),
  canonical_content_hash text not null check (canonical_content_hash ~ '^[0-9a-f]{64}$'),
  created_by_user_id uuid not null,
  created_at timestamptz not null default now(),
  constraint learning_evidence_attempts_learner_family_fk
    foreign key (family_id, learner_id)
    references public.learners(family_id, id)
    on delete restrict,
  constraint learning_evidence_attempts_family_learner_id_key
    unique (family_id, learner_id, id),
  constraint learning_evidence_attempts_identity_key
    unique (
      family_id,
      learner_id,
      assessment_id,
      assessment_version,
      attempt_identity,
      result_schema_version
    ),
  constraint learning_evidence_attempts_time_order_check
    check (completed_at >= started_at and evaluated_at >= started_at)
);

create table public.learning_evidence_results (
  id uuid primary key default gen_random_uuid(),
  result_identity text not null,
  attempt_id uuid not null,
  family_id uuid not null,
  learner_id uuid not null,
  product_id text not null,
  module_id text not null,
  assessment_id text not null,
  assessment_version integer not null check (assessment_version > 0),
  attempt_identity text not null,
  attempt_kind text not null check (attempt_kind in ('initial', 'recheck')),
  continuum_id text not null,
  construct_id text not null,
  developmental_status text not null check (
    developmental_status in (
      'secure',
      'consolidating',
      'developing',
      'needs-support',
      'not-enough-evidence',
      'practical-confirmation-required'
    )
  ),
  evidence_sufficiency text not null check (
    evidence_sufficiency in (
      'sufficient',
      'limited',
      'not-enough-evidence',
      'unavailable',
      'unresolved',
      'unknown'
    )
  ),
  evidence_ceiling text not null check (
    evidence_ceiling in ('routing-only', 'provisional', 'no-claim')
  ),
  practical_confirmation_state text not null check (
    practical_confirmation_state in ('not-required', 'required', 'confirmed', 'unavailable')
  ),
  deterministic_rule_id text not null,
  deterministic_rule_version text not null,
  curriculum_mapping_version text not null,
  originating_subsystem text not null,
  recommendation_id text null,
  recommendation_version text null,
  pathway_mutation text not null default 'not-requested'
    check (pathway_mutation = 'not-requested'),
  evaluated_at timestamptz not null,
  result_schema_version integer not null check (result_schema_version > 0),
  canonical_payload jsonb not null check (pg_catalog.jsonb_typeof(canonical_payload) = 'object'),
  canonical_content_hash text not null check (canonical_content_hash ~ '^[0-9a-f]{64}$'),
  created_at timestamptz not null default now(),
  constraint learning_evidence_results_attempt_family_learner_fk
    foreign key (family_id, learner_id, attempt_id)
    references public.learning_evidence_attempts(family_id, learner_id, id)
    on delete restrict,
  constraint learning_evidence_results_learner_family_fk
    foreign key (family_id, learner_id)
    references public.learners(family_id, id)
    on delete restrict,
  constraint learning_evidence_results_identity_key
    unique (
      family_id,
      learner_id,
      assessment_id,
      assessment_version,
      attempt_identity,
      construct_id,
      result_schema_version
    ),
  constraint learning_evidence_results_result_identity_key
    unique (family_id, result_identity),
  constraint learning_evidence_results_family_learner_id_key
    unique (family_id, learner_id, id),
  constraint learning_evidence_results_payload_identity_check
    check (canonical_payload ->> 'id' = result_identity),
  constraint learning_evidence_results_payload_schema_check
    check (
      canonical_payload ->> 'schema' = 'mylearna-learning-evidence-result'
      and (canonical_payload ->> 'schemaVersion')::integer = result_schema_version
    )
);

-- Mutable human decisions are separated from the immutable educational
-- interpretation. No customer mutation policy is introduced in this phase.
create table public.learning_evidence_result_reviews (
  result_id uuid primary key references public.learning_evidence_results(id) on delete restrict,
  family_id uuid not null,
  learner_id uuid not null,
  review_state text not null default 'not-reviewed'
    check (review_state in ('not-reviewed', 'reviewed', 'accepted', 'rejected')),
  confirmation_state text not null default 'not-confirmed'
    check (confirmation_state in ('not-confirmed', 'confirmed', 'declined')),
  portfolio_inclusion text not null default 'not-decided'
    check (portfolio_inclusion in ('not-decided', 'include', 'exclude')),
  human_note_reference text null,
  reviewed_by_user_id uuid null,
  reviewed_at timestamptz null,
  updated_at timestamptz not null default now(),
  constraint learning_evidence_result_reviews_learner_family_fk
    foreign key (family_id, learner_id)
    references public.learners(family_id, id)
    on delete restrict,
  constraint learning_evidence_result_reviews_result_owner_fk
    foreign key (family_id, learner_id, result_id)
    references public.learning_evidence_results(family_id, learner_id, id)
    on delete restrict
);

create index learning_evidence_attempts_learner_history_idx
  on public.learning_evidence_attempts (family_id, learner_id, evaluated_at desc);
create index learning_evidence_attempts_assessment_history_idx
  on public.learning_evidence_attempts (
    family_id,
    learner_id,
    module_id,
    assessment_id,
    evaluated_at desc
  );
create index learning_evidence_results_construct_history_idx
  on public.learning_evidence_results (
    family_id,
    learner_id,
    continuum_id,
    construct_id,
    evaluated_at desc
  );
create index learning_evidence_results_status_idx
  on public.learning_evidence_results (
    family_id,
    learner_id,
    developmental_status,
    evidence_sufficiency,
    evaluated_at desc
  );
create index learning_evidence_results_attempt_owner_idx
  on public.learning_evidence_results (family_id, learner_id, attempt_id);
create index learning_evidence_result_reviews_owner_idx
  on public.learning_evidence_result_reviews (family_id, learner_id, result_id);

alter table public.learning_evidence_attempts enable row level security;
alter table public.learning_evidence_results enable row level security;
alter table public.learning_evidence_result_reviews enable row level security;

create policy "learning evidence attempts select own family"
on public.learning_evidence_attempts
for select
to authenticated
using (
  (select auth.uid()) is not null
  and public.is_family_member(family_id)
  and exists (
    select 1
    from public.learners as learner
    where learner.id = learning_evidence_attempts.learner_id
      and learner.family_id = learning_evidence_attempts.family_id
  )
);

create policy "learning evidence results select own family"
on public.learning_evidence_results
for select
to authenticated
using (
  (select auth.uid()) is not null
  and public.is_family_member(family_id)
  and exists (
    select 1
    from public.learners as learner
    where learner.id = learning_evidence_results.learner_id
      and learner.family_id = learning_evidence_results.family_id
  )
);

create policy "learning evidence reviews select own family"
on public.learning_evidence_result_reviews
for select
to authenticated
using (
  (select auth.uid()) is not null
  and public.is_family_member(family_id)
  and exists (
    select 1
    from public.learners as learner
    where learner.id = learning_evidence_result_reviews.learner_id
      and learner.family_id = learning_evidence_result_reviews.family_id
  )
);

revoke all on table public.learning_evidence_attempts from public, anon, authenticated, service_role;
revoke all on table public.learning_evidence_results from public, anon, authenticated, service_role;
revoke all on table public.learning_evidence_result_reviews from public, anon, authenticated, service_role;
grant select on table public.learning_evidence_attempts to authenticated;
grant select on table public.learning_evidence_results to authenticated;
grant select on table public.learning_evidence_result_reviews to authenticated;
grant select, insert on table public.learning_evidence_attempts to service_role;
grant select, insert on table public.learning_evidence_results to service_role;
grant select, insert on table public.learning_evidence_result_reviews to service_role;

create function public.mylearna_reject_learning_evidence_history_mutation()
returns trigger
language plpgsql
set search_path = ''
as $function$
begin
  raise exception 'Learning evidence history is append-only.' using errcode = '55000';
end
$function$;

revoke all on function public.mylearna_reject_learning_evidence_history_mutation()
  from public, anon, authenticated, service_role;

create trigger learning_evidence_attempts_append_only
before update or delete on public.learning_evidence_attempts
for each row execute function public.mylearna_reject_learning_evidence_history_mutation();

create trigger learning_evidence_results_append_only
before update or delete on public.learning_evidence_results
for each row execute function public.mylearna_reject_learning_evidence_history_mutation();

-- Atomic and idempotent save. The function accepts canonical records only
-- from a trusted server that has already replayed assessment evidence. It is
-- intentionally not executable by browser roles.
create function public.mylearna_save_learning_evidence_results_v1(
  p_actor_user_id uuid,
  p_family_id uuid,
  p_learner_id uuid,
  p_attempt jsonb,
  p_results jsonb
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  saved_attempt_id uuid;
  existing_attempt record;
  result_payload jsonb;
  existing_result record;
  attempt_hash text;
  result_hash text;
  expected_count integer;
  existing_count integer;
  continuum_ids text[];
  was_reused boolean := false;
begin
  if p_actor_user_id is null
    or p_family_id is null
    or p_learner_id is null then
    raise exception 'Learning evidence ownership is required.' using errcode = '22023';
  end if;

  if not exists (
    select 1
    from public.family_members as membership
    where membership.family_id = p_family_id
      and membership.user_id = p_actor_user_id
  ) then
    raise exception 'Family workspace unavailable.' using errcode = '42501';
  end if;

  if not exists (
    select 1
    from public.learners as learner
    where learner.id = p_learner_id
      and learner.family_id = p_family_id
  ) then
    raise exception 'Learner does not belong to this family.' using errcode = '42501';
  end if;

  if pg_catalog.jsonb_typeof(p_attempt) <> 'object'
    or pg_catalog.jsonb_typeof(p_results) <> 'array' then
    raise exception 'Canonical attempt and result payloads are required.' using errcode = '22023';
  end if;

  if pg_catalog.jsonb_typeof(p_attempt -> 'scopeContinuumIds') <> 'array'
    or nullif(pg_catalog.btrim(p_attempt ->> 'attemptId'), '') is null
    or nullif(pg_catalog.btrim(p_attempt ->> 'assessmentId'), '') is null then
    raise exception 'Canonical attempt identity and scope are required.' using errcode = '22023';
  end if;

  expected_count := (p_attempt ->> 'expectedResultCount')::integer;
  continuum_ids := array(
    select value
    from pg_catalog.jsonb_array_elements_text(p_attempt -> 'scopeContinuumIds')
  );

  if expected_count <= 0
    or pg_catalog.jsonb_array_length(p_results) <> expected_count then
    raise exception 'The canonical result set is incomplete.' using errcode = '22023';
  end if;

  if pg_catalog.cardinality(continuum_ids) <> (
    select pg_catalog.count(distinct scope_entry)
    from pg_catalog.unnest(continuum_ids) as scope_entry
  ) then
    raise exception 'Attempt scope continua must be unique.' using errcode = '22023';
  end if;

  if p_attempt ->> 'assessmentId' = 'number-operations-baseline'
    and (
      expected_count <> 5
      or (
        select pg_catalog.count(distinct result_entry -> 'construct' ->> 'continuumId')
        from pg_catalog.jsonb_array_elements(p_results) as result_entry
      ) <> 5
    ) then
    raise exception 'Number & Operations persistence requires five independent continuum results.' using errcode = '22023';
  end if;

  attempt_hash := pg_catalog.encode(
    extensions.digest(pg_catalog.convert_to(p_attempt::text, 'UTF8'), 'sha256'),
    'hex'
  );

  select attempt.id, attempt.canonical_content_hash
  into existing_attempt
  from public.learning_evidence_attempts as attempt
  where attempt.family_id = p_family_id
    and attempt.learner_id = p_learner_id
    and attempt.assessment_id = p_attempt ->> 'assessmentId'
    and attempt.assessment_version = (p_attempt ->> 'assessmentVersion')::integer
    and attempt.attempt_identity = p_attempt ->> 'attemptId'
    and attempt.result_schema_version = (p_attempt ->> 'resultSchemaVersion')::integer;

  if existing_attempt.id is not null then
    was_reused := true;
    if existing_attempt.canonical_content_hash <> attempt_hash then
      raise exception 'Canonical attempt identity conflicts with different educational content.' using errcode = '23505';
    end if;
    saved_attempt_id := existing_attempt.id;

    select pg_catalog.count(*) into existing_count
    from public.learning_evidence_results as result
    where result.attempt_id = saved_attempt_id;

    if existing_count <> expected_count then
      raise exception 'Existing canonical attempt has an incomplete result set.' using errcode = '55000';
    end if;
  else
    insert into public.learning_evidence_attempts (
      family_id,
      learner_id,
      attempt_identity,
      product_id,
      product_version,
      module_id,
      assessment_id,
      assessment_version,
      attempt_kind,
      completion_state,
      started_at,
      completed_at,
      evaluated_at,
      source_subsystem,
      result_schema_version,
      scope_continuum_ids,
      expected_result_count,
      canonical_content_hash,
      created_by_user_id
    ) values (
      p_family_id,
      p_learner_id,
      p_attempt ->> 'attemptId',
      p_attempt ->> 'productId',
      p_attempt ->> 'productVersion',
      p_attempt ->> 'moduleId',
      p_attempt ->> 'assessmentId',
      (p_attempt ->> 'assessmentVersion')::integer,
      p_attempt ->> 'attemptKind',
      p_attempt ->> 'completionState',
      (p_attempt ->> 'startedAt')::timestamptz,
      (p_attempt ->> 'completedAt')::timestamptz,
      (p_attempt ->> 'evaluatedAt')::timestamptz,
      p_attempt ->> 'sourceSubsystem',
      (p_attempt ->> 'resultSchemaVersion')::integer,
      continuum_ids,
      expected_count,
      attempt_hash,
      p_actor_user_id
    ) returning id into saved_attempt_id;
  end if;

  for result_payload in
    select value from pg_catalog.jsonb_array_elements(p_results)
  loop
    if result_payload ->> 'learnerId' is distinct from p_learner_id::text
      or result_payload #>> '{assessment,attemptId}' is distinct from p_attempt ->> 'attemptId'
      or result_payload #>> '{assessment,assessmentId}' is distinct from p_attempt ->> 'assessmentId'
      or (result_payload #>> '{assessment,assessmentVersion}')::integer
        is distinct from (p_attempt ->> 'assessmentVersion')::integer
      or result_payload #>> '{assessment,attemptKind}' is distinct from p_attempt ->> 'attemptKind'
      or (result_payload ->> 'schemaVersion')::integer
        is distinct from (p_attempt ->> 'resultSchemaVersion')::integer
      or result_payload #>> '{product,productId}' is distinct from p_attempt ->> 'productId'
      or result_payload #>> '{product,productVersion}' is distinct from p_attempt ->> 'productVersion'
      or result_payload #>> '{product,moduleId}' is distinct from p_attempt ->> 'moduleId'
      or result_payload #>> '{provenance,originatingSubsystem}' is distinct from p_attempt ->> 'sourceSubsystem'
      or (result_payload ->> 'evaluatedAt')::timestamptz
        is distinct from (p_attempt ->> 'evaluatedAt')::timestamptz
      or (
        result_payload #>> '{recommendation,pathwayMutation}' is distinct from 'not-requested'
        and coalesce(result_payload -> 'recommendation', 'null'::jsonb) <> 'null'::jsonb
      )
      or result_payload #>> '{humanControl,reviewState}' is distinct from 'not-reviewed'
      or result_payload #>> '{humanControl,confirmationState}' is distinct from 'not-confirmed'
      or result_payload #>> '{humanControl,portfolioInclusion}' is distinct from 'not-decided'
      or result_payload #>> '{humanControl,humanNoteReference}' is not null
      then
      raise exception 'Result payload does not match its trusted attempt envelope.' using errcode = '22023';
    end if;

    result_hash := pg_catalog.encode(
      extensions.digest(pg_catalog.convert_to(result_payload::text, 'UTF8'), 'sha256'),
      'hex'
    );

    select result.id, result.canonical_content_hash
    into existing_result
    from public.learning_evidence_results as result
    where result.family_id = p_family_id
      and result.result_identity = result_payload ->> 'id';

    if existing_result.id is not null then
      if existing_result.canonical_content_hash <> result_hash then
        raise exception 'Canonical result identity conflicts with different educational content.' using errcode = '23505';
      end if;
      continue;
    end if;

    insert into public.learning_evidence_results (
      result_identity,
      attempt_id,
      family_id,
      learner_id,
      product_id,
      module_id,
      assessment_id,
      assessment_version,
      attempt_identity,
      attempt_kind,
      continuum_id,
      construct_id,
      developmental_status,
      evidence_sufficiency,
      evidence_ceiling,
      practical_confirmation_state,
      deterministic_rule_id,
      deterministic_rule_version,
      curriculum_mapping_version,
      originating_subsystem,
      recommendation_id,
      recommendation_version,
      pathway_mutation,
      evaluated_at,
      result_schema_version,
      canonical_payload,
      canonical_content_hash
    ) values (
      result_payload ->> 'id',
      saved_attempt_id,
      p_family_id,
      p_learner_id,
      result_payload #>> '{product,productId}',
      result_payload #>> '{product,moduleId}',
      result_payload #>> '{assessment,assessmentId}',
      (result_payload #>> '{assessment,assessmentVersion}')::integer,
      result_payload #>> '{assessment,attemptId}',
      result_payload #>> '{assessment,attemptKind}',
      result_payload #>> '{construct,continuumId}',
      result_payload #>> '{construct,constructId}',
      result_payload #>> '{interpretation,developmentalStatus}',
      result_payload #>> '{evidence,sufficiency,state}',
      result_payload #>> '{provenance,evidenceCeiling}',
      result_payload #>> '{evidence,practicalConfirmation,state}',
      result_payload #>> '{provenance,deterministicRule,ruleId}',
      result_payload #>> '{provenance,deterministicRule,ruleVersion}',
      result_payload #>> '{provenance,curriculumMappingVersion}',
      result_payload #>> '{provenance,originatingSubsystem}',
      result_payload #>> '{recommendation,recommendationId}',
      result_payload #>> '{recommendation,recommendationVersion}',
      coalesce(result_payload #>> '{recommendation,pathwayMutation}', 'not-requested'),
      (result_payload ->> 'evaluatedAt')::timestamptz,
      (result_payload ->> 'schemaVersion')::integer,
      result_payload,
      result_hash
    ) returning id into existing_result.id;

    insert into public.learning_evidence_result_reviews (
      result_id,
      family_id,
      learner_id
    ) values (
      existing_result.id,
      p_family_id,
      p_learner_id
    );
  end loop;

  return pg_catalog.jsonb_build_object(
    'attemptStorageId', saved_attempt_id,
    'reused', was_reused
  );
end
$function$;

revoke all on function public.mylearna_save_learning_evidence_results_v1(uuid, uuid, uuid, jsonb, jsonb)
  from public, anon, authenticated;
grant execute on function public.mylearna_save_learning_evidence_results_v1(uuid, uuid, uuid, jsonb, jsonb)
  to service_role;

commit;
