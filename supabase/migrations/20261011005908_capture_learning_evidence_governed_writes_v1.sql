-- Harden an already-migrated Capture -> EI V1 environment. Authenticated family
-- members retain RLS-governed reads, while all construct-link writes must pass
-- through the staging-only, staff-authorised server operation. This prevents a
-- browser from supplying invented construct metadata directly to PostgREST.

alter table public.learning_evidence_artifact_links
  add column if not exists evidence_source_type text;

update public.learning_evidence_artifact_links
set evidence_source_type = 'note'
where evidence_source_type is null;

alter table public.learning_evidence_artifact_links
  alter column evidence_source_type set not null;

alter table public.learning_evidence_artifact_links
  drop constraint if exists learning_evidence_artifact_links_source_type_check;
alter table public.learning_evidence_artifact_links
  add constraint learning_evidence_artifact_links_source_type_check
  check (evidence_source_type in (
    'captured-photo',
    'captured-video',
    'work-sample',
    'parent-observation',
    'practical-observation',
    'note',
    'document-file'
  ));

create or replace function public.mylearna_protect_capture_evidence_construct_identity()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $function$
begin
  if old.family_id is distinct from new.family_id
    or old.learner_id is distinct from new.learner_id
    or old.evidence_entry_id is distinct from new.evidence_entry_id
    or old.evidence_source_type is distinct from new.evidence_source_type
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

revoke insert, update, delete on table public.learning_evidence_artifact_links
  from authenticated;
grant select on table public.learning_evidence_artifact_links
  to authenticated;
grant select, insert, update, delete on table public.learning_evidence_artifact_links
  to service_role;

comment on table public.learning_evidence_artifact_links is
  'Human-controlled canonical construct associations for existing governed Capture evidence. Authenticated users have RLS-governed reads; writes require the governed server operation. This table records evidence relevance, not developmental judgement.';
