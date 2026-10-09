-- Capture -> Learning Evidence Bridge V1
--
-- Raw/authentic learning remains in evidence_entries and its governed media
-- store. This relation records only a human-assigned canonical educational
-- construct reference and evidence-relevance review. It deliberately has no
-- developmental status, progression placement, recommendation, Pathways or
-- Portfolio decision columns.

create table public.learning_evidence_artifact_links (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.family_profiles(id) on delete cascade,
  learner_id uuid not null,
  evidence_entry_id uuid not null references public.evidence_entries(id) on delete cascade,
  canonical_construct_id text not null check (btrim(canonical_construct_id) <> ''),
  learning_domain text not null check (btrim(learning_domain) <> ''),
  continuum_id text,
  construct_name text not null check (btrim(construct_name) <> ''),
  authority_id text not null check (btrim(authority_id) <> ''),
  framework_id text not null check (btrim(framework_id) <> ''),
  framework_version text not null check (btrim(framework_version) <> ''),
  curriculum_mapping_version text not null check (btrim(curriculum_mapping_version) <> ''),
  assigned_by_user_id uuid not null,
  assigned_at timestamptz not null default now(),
  review_state text not null default 'unreviewed'
    check (review_state in ('unreviewed', 'reviewed', 'confirmed-relevant', 'not-relevant')),
  reviewed_by_user_id uuid,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint learning_evidence_artifact_links_learner_family_fk
    foreign key (family_id, learner_id)
    references public.learners(family_id, id)
    on delete cascade,
  constraint learning_evidence_artifact_links_review_consistency check (
    (review_state = 'unreviewed' and reviewed_by_user_id is null and reviewed_at is null)
    or
    (review_state <> 'unreviewed' and reviewed_by_user_id is not null and reviewed_at is not null)
  ),
  constraint learning_evidence_artifact_links_identity unique (
    family_id,
    learner_id,
    evidence_entry_id,
    canonical_construct_id,
    curriculum_mapping_version
  )
);

create index learning_evidence_artifact_links_learner_construct_idx
  on public.learning_evidence_artifact_links (
    family_id,
    learner_id,
    canonical_construct_id,
    assigned_at desc
  );

create index learning_evidence_artifact_links_evidence_idx
  on public.learning_evidence_artifact_links (
    family_id,
    evidence_entry_id
  );

alter table public.learning_evidence_artifact_links enable row level security;

create policy "capture evidence links select own family"
on public.learning_evidence_artifact_links
for select
to authenticated
using (
  (select auth.uid()) is not null
  and public.is_family_member(family_id)
  and exists (
    select 1
    from public.evidence_entries as evidence
    where evidence.id = learning_evidence_artifact_links.evidence_entry_id
      and evidence.family_id = learning_evidence_artifact_links.family_id
  )
  and exists (
    select 1
    from public.learners as learner
    where learner.id = learning_evidence_artifact_links.learner_id
      and learner.family_id = learning_evidence_artifact_links.family_id
  )
);

create policy "capture evidence links insert own family"
on public.learning_evidence_artifact_links
for insert
to authenticated
with check (
  (select auth.uid()) is not null
  and assigned_by_user_id = (select auth.uid())
  and public.is_family_member(family_id)
  and exists (
    select 1
    from public.evidence_entries as evidence
    where evidence.id = learning_evidence_artifact_links.evidence_entry_id
      and evidence.family_id = learning_evidence_artifact_links.family_id
  )
  and exists (
    select 1
    from public.learners as learner
    where learner.id = learning_evidence_artifact_links.learner_id
      and learner.family_id = learning_evidence_artifact_links.family_id
  )
);

create policy "capture evidence links review own family"
on public.learning_evidence_artifact_links
for update
to authenticated
using (
  (select auth.uid()) is not null
  and public.is_family_member(family_id)
)
with check (
  (select auth.uid()) is not null
  and public.is_family_member(family_id)
  and assigned_by_user_id is not null
  and (reviewed_by_user_id is null or reviewed_by_user_id = (select auth.uid()))
  and exists (
    select 1
    from public.evidence_entries as evidence
    where evidence.id = learning_evidence_artifact_links.evidence_entry_id
      and evidence.family_id = learning_evidence_artifact_links.family_id
  )
  and exists (
    select 1
    from public.learners as learner
    where learner.id = learning_evidence_artifact_links.learner_id
      and learner.family_id = learning_evidence_artifact_links.family_id
  )
);

create policy "capture evidence links delete own family"
on public.learning_evidence_artifact_links
for delete
to authenticated
using (
  (select auth.uid()) is not null
  and public.is_family_member(family_id)
);

create function public.mylearna_validate_capture_evidence_construct_link()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $function$
begin
  if not exists (
    select 1
    from public.evidence_entries as evidence
    where evidence.id = new.evidence_entry_id
      and evidence.family_id = new.family_id
  ) then
    raise exception 'Captured evidence is unavailable in this family.' using errcode = '23503';
  end if;

  if not exists (
    select 1
    from public.learners as learner
    where learner.id = new.learner_id
      and learner.family_id = new.family_id
  ) then
    raise exception 'Learner is unavailable in this family.' using errcode = '23503';
  end if;

  if not exists (
    select 1
    from public.evidence_entry_learner_links as participant
    where participant.evidence_entry_id = new.evidence_entry_id
      and participant.learner_id = new.learner_id
      and participant.family_id = new.family_id
  ) then
    raise exception 'Captured evidence is not linked to this learner.' using errcode = '23503';
  end if;

  return new;
end
$function$;

create trigger learning_evidence_artifact_links_validate_owner
before insert or update on public.learning_evidence_artifact_links
for each row execute function public.mylearna_validate_capture_evidence_construct_link();

create function public.mylearna_protect_capture_evidence_construct_identity()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $function$
begin
  if old.family_id is distinct from new.family_id
    or old.learner_id is distinct from new.learner_id
    or old.evidence_entry_id is distinct from new.evidence_entry_id
    or old.canonical_construct_id is distinct from new.canonical_construct_id
    or old.learning_domain is distinct from new.learning_domain
    or old.continuum_id is distinct from new.continuum_id
    or old.construct_name is distinct from new.construct_name
    or old.authority_id is distinct from new.authority_id
    or old.framework_id is distinct from new.framework_id
    or old.framework_version is distinct from new.framework_version
    or old.curriculum_mapping_version is distinct from new.curriculum_mapping_version
    or old.assigned_by_user_id is distinct from new.assigned_by_user_id
    or old.assigned_at is distinct from new.assigned_at
  then
    raise exception 'Captured evidence construct identity is immutable.' using errcode = '55000';
  end if;
  new.updated_at := now();
  return new;
end
$function$;

create trigger learning_evidence_artifact_links_protect_identity
before update on public.learning_evidence_artifact_links
for each row execute function public.mylearna_protect_capture_evidence_construct_identity();

revoke all on table public.learning_evidence_artifact_links
  from public, anon, authenticated, service_role;
grant select, insert, update, delete on table public.learning_evidence_artifact_links
  to authenticated;
grant select, insert, update, delete on table public.learning_evidence_artifact_links
  to service_role;

revoke all on function public.mylearna_validate_capture_evidence_construct_link()
  from public, anon, authenticated, service_role;
grant execute on function public.mylearna_validate_capture_evidence_construct_link()
  to authenticated, service_role;

revoke all on function public.mylearna_protect_capture_evidence_construct_identity()
  from public, anon, authenticated, service_role;
grant execute on function public.mylearna_protect_capture_evidence_construct_identity()
  to authenticated, service_role;

comment on table public.learning_evidence_artifact_links is
  'Human-controlled canonical construct associations for existing governed Capture evidence. This table records evidence relevance, not developmental judgement.';
