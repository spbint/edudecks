-- Manage Media V1 keeps evidence rows and learner links intact while removing
-- one private evidence object. Storage API deletion remains authoritative; the
-- existing Storage DELETE transaction performs quota accounting first and this
-- lifecycle trigger then purges the asset row and detaches only that path.

create or replace function public.mylearna_evidence_attachment_matches_path(
  p_reference jsonb,
  p_object_path text
)
returns boolean
language plpgsql
immutable
set search_path = public
as $$
declare
  reference_text text;
  parsed_reference jsonb;
begin
  if p_reference is null or nullif(btrim(p_object_path), '') is null then
    return false;
  end if;

  if jsonb_typeof(p_reference) = 'object' then
    return coalesce(
      nullif(btrim(p_reference ->> 'path'), ''),
      nullif(btrim(p_reference ->> 'storagePath'), ''),
      nullif(btrim(p_reference ->> 'objectPath'), '')
    ) = p_object_path;
  end if;

  if jsonb_typeof(p_reference) <> 'string' then
    return false;
  end if;

  reference_text := p_reference #>> '{}';
  if reference_text = p_object_path then
    return true;
  end if;

  if left(ltrim(reference_text), 1) = '{' then
    begin
      parsed_reference := reference_text::jsonb;
      return public.mylearna_evidence_attachment_matches_path(
        parsed_reference,
        p_object_path
      );
    exception
      when invalid_text_representation then
        return false;
    end;
  end if;

  return false;
end;
$$;

create or replace function public.mylearna_detach_evidence_attachment_path(
  p_references jsonb,
  p_object_path text
)
returns jsonb
language plpgsql
immutable
set search_path = public
as $$
declare
  filtered_references jsonb;
begin
  if p_references is null then
    return null;
  end if;

  if jsonb_typeof(p_references) <> 'array' then
    if public.mylearna_evidence_attachment_matches_path(
      p_references,
      p_object_path
    ) then
      return null;
    end if;
    return p_references;
  end if;

  select coalesce(jsonb_agg(reference.value order by reference.ordinality), '[]'::jsonb)
  into filtered_references
  from jsonb_array_elements(p_references) with ordinality as reference(value, ordinality)
  where not public.mylearna_evidence_attachment_matches_path(
    reference.value,
    p_object_path
  );

  if jsonb_array_length(filtered_references) = 0 then
    return null;
  end if;

  return filtered_references;
end;
$$;

revoke all on function public.mylearna_evidence_attachment_matches_path(jsonb, text)
  from public, anon, authenticated;
revoke all on function public.mylearna_detach_evidence_attachment_path(jsonb, text)
  from public, anon, authenticated;
grant execute on function public.mylearna_evidence_attachment_matches_path(jsonb, text)
  to service_role;
grant execute on function public.mylearna_detach_evidence_attachment_path(jsonb, text)
  to service_role;

create or replace function public.mylearna_mark_evidence_media_asset_purged_from_storage()
returns trigger
language plpgsql
security definer
set search_path = public, storage
as $$
declare
  asset_row public.family_media_assets;
begin
  if old.bucket_id <> 'evidence' then
    return old;
  end if;

  select asset.*
  into asset_row
  from public.family_media_assets as asset
  where asset.object_path = old.name
  limit 1
  for update;

  if asset_row.id is null then
    return old;
  end if;

  update public.family_media_assets as asset
  set lifecycle_status = 'purged',
      purge_after = null,
      purged_at = coalesce(asset.purged_at, now()),
      updated_at = now()
  where asset.id = asset_row.id
    and asset.lifecycle_status <> 'purged';

  if asset_row.evidence_entry_id is not null then
    update public.evidence_entries as evidence
    set attachment_urls = public.mylearna_detach_evidence_attachment_path(
          evidence.attachment_urls,
          old.name
        ),
        image_url = case when btrim(coalesce(evidence.image_url, '')) = old.name
          then null else evidence.image_url end,
        file_url = case when btrim(coalesce(evidence.file_url, '')) = old.name
          then null else evidence.file_url end,
        audio_url = case when btrim(coalesce(evidence.audio_url, '')) = old.name
          then null else evidence.audio_url end,
        updated_at = now()
    where evidence.id = asset_row.evidence_entry_id
      and evidence.family_id = asset_row.family_id;
  end if;

  return old;
end;
$$;

revoke all on function public.mylearna_mark_evidence_media_asset_purged_from_storage()
  from public, anon, authenticated;
grant execute on function public.mylearna_mark_evidence_media_asset_purged_from_storage()
  to service_role;
