-- MyLearna Classical Marketplace -> My Resource Cupboard integration.
-- Central MyLearna catalogue assets are referenced by families; they are not
-- copied into family-owned PDF storage.

alter table public.family_resources
  add column if not exists marketplace_resource_id uuid
  references public.marketplace_resources(id) on delete restrict;

alter table public.family_resources
  drop constraint if exists family_resources_type_check;
alter table public.family_resources
  add constraint family_resources_type_check
  check (resource_type in ('web_link', 'reference', 'file', 'catalogue'));

alter table public.family_resources
  drop constraint if exists family_resources_source_check;
alter table public.family_resources
  add constraint family_resources_source_check check (
    (resource_type = 'web_link'
      and length(btrim(name)) > 0
      and url ~* '^https?://'
      and reference_text is null
      and resource_file_id is null
      and marketplace_resource_id is null)
    or
    (resource_type = 'reference'
      and length(btrim(name)) > 0
      and url is null
      and resource_file_id is null
      and marketplace_resource_id is null)
    or
    (resource_type = 'file'
      and length(btrim(name)) > 0
      and url is null
      and reference_text is null
      and resource_file_id is not null
      and marketplace_resource_id is null)
    or
    (resource_type = 'catalogue'
      and length(btrim(name)) > 0
      and url is null
      and reference_text is null
      and resource_file_id is null
      and marketplace_resource_id is not null)
  );

alter table public.family_resources
  drop constraint if exists family_resources_family_marketplace_unique;
alter table public.family_resources
  add constraint family_resources_family_marketplace_unique
  unique (family_id, marketplace_resource_id);

create index if not exists family_resources_marketplace_resource_idx
  on public.family_resources (marketplace_resource_id)
  where marketplace_resource_id is not null;

alter table public.custom_learning_resources
  drop constraint if exists custom_learning_resources_type_check;
alter table public.custom_learning_resources
  add constraint custom_learning_resources_type_check
  check (resource_type in ('web_link', 'reference', 'file', 'catalogue'));

alter table public.custom_learning_resources
  drop constraint if exists custom_learning_resources_source_check;
alter table public.custom_learning_resources
  add constraint custom_learning_resources_source_check check (
    (family_resource_id is not null
      and url is null
      and reference_text is null
      and resource_file_id is null)
    or
    (family_resource_id is null
      and resource_type = 'web_link'
      and length(btrim(coalesce(url, ''))) > 0
      and reference_text is null
      and resource_file_id is null)
    or
    (family_resource_id is null
      and resource_type = 'reference'
      and length(btrim(coalesce(reference_text, ''))) > 0
      and url is null
      and resource_file_id is null)
    or
    (family_resource_id is null
      and resource_type = 'file'
      and resource_file_id is not null
      and url is null
      and reference_text is null)
  );

insert into public.marketplace_resources (
  source,
  external_product_id,
  external_variant_id,
  handle,
  title,
  thumbnail_url,
  marketplace_area,
  primary_collection,
  subcollection,
  resource_format,
  is_active,
  metadata
)
values (
  'mylearna',
  'MYL-CLASSICAL-Y34-A-U1-E01',
  null,
  'classical-y3-4-a-u1-e01-from-wandering-to-settlement',
  'From Wandering to Settlement',
  'https://cdn.shopify.com/s/files/1/0888/9529/1710/files/mylearna-classical-y3-4-a-u1-e01-page-01.png?v=1789982608',
  'Curriculum',
  'MyLearna Classical',
  'Years 3-4 · Cycle A: The Ancient World',
  'booklet-pdf',
  true,
  jsonb_build_object(
    'brand', 'MyLearna Classical',
    'catalogue_kind', 'encounter',
    'curriculum_key', 'mylearna-classical',
    'band_key', 'years-3-4',
    'cycle_key', 'a',
    'cycle_title', 'The Ancient World',
    'unit_key', 'first-civilisations',
    'unit_title', 'The First Civilisations',
    'encounter_number', 1,
    'big_question', 'Why would people choose to live in one place?',
    'pathway_step_id', 'classical::history-and-civilisation::middle-primary::from-wandering-to-settlement',
    'step_key', 'from-wandering-to-settlement',
    'pdf_href', '/api/classical/booklets/y3-4-a-u1-e01',
    'page_count', 10,
    'access_model', 'family_included',
    'entitlement_key', 'family_subscription',
    'included_with_family', true,
    'bundle_hierarchy', jsonb_build_object(
      'encounter_key', 'classical-y3-4-a-u1-e01',
      'unit_key', 'classical-y3-4-a-u1',
      'cycle_key', 'classical-y3-4-a'
    ),
    'future_physical_pack_supported', true
  )
)
on conflict (source, external_product_id) do update
set
  handle = excluded.handle,
  title = excluded.title,
  thumbnail_url = excluded.thumbnail_url,
  marketplace_area = excluded.marketplace_area,
  primary_collection = excluded.primary_collection,
  subcollection = excluded.subcollection,
  resource_format = excluded.resource_format,
  is_active = excluded.is_active,
  metadata = excluded.metadata,
  updated_at = now();

create or replace function public.mylearna_validate_family_resource()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  file_row public.family_resource_files;
  catalogue_row public.marketplace_resources;
begin
  if auth.uid() is null or not public.is_family_member(new.family_id) then
    raise exception 'Family workspace unavailable.' using errcode = '42501';
  end if;

  if new.created_by_user_id <> auth.uid() then
    raise exception 'Resource creator must be the signed-in user.' using errcode = '42501';
  end if;

  if new.resource_type = 'web_link' and new.url !~* '^https?://[^[:space:]]+$' then
    raise exception 'Use a web link starting with http:// or https://.' using errcode = '22023';
  end if;

  if new.resource_type = 'file' then
    select *
    into file_row
    from public.family_resource_files
    where id = new.resource_file_id
      and family_id = new.family_id
      and status = 'ready';

    if file_row.id is null then
      raise exception 'PDF resource is not ready yet.' using errcode = '23503';
    end if;
  elsif new.resource_file_id is not null then
    raise exception 'Only PDF resources may reference a stored file.' using errcode = '23514';
  end if;

  if new.resource_type = 'catalogue' then
    select *
    into catalogue_row
    from public.marketplace_resources
    where id = new.marketplace_resource_id
      and is_active = true;

    if catalogue_row.id is null then
      raise exception 'This Marketplace resource is not available.' using errcode = '23503';
    end if;

    new.name := catalogue_row.title;
    new.url := null;
    new.reference_text := null;
    new.resource_file_id := null;
  elsif new.marketplace_resource_id is not null then
    raise exception 'Only catalogue resources may reference a Marketplace resource.' using errcode = '23514';
  end if;

  return new;
end;
$$;

revoke all on function public.mylearna_validate_family_resource() from public, anon;

create or replace function public.mylearna_save_marketplace_resource_to_cupboard(
  p_family_id uuid,
  p_external_product_id text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  catalogue_row public.marketplace_resources;
  saved_id uuid;
begin
  if auth.uid() is null or not public.is_family_member(p_family_id) then
    raise exception 'Family workspace unavailable.' using errcode = '42501';
  end if;

  select *
  into catalogue_row
  from public.marketplace_resources
  where source = 'mylearna'
    and external_product_id = btrim(coalesce(p_external_product_id, ''))
    and is_active = true;

  if catalogue_row.id is null then
    raise exception 'This MyLearna resource is not available.' using errcode = '23503';
  end if;

  insert into public.family_resources (
    family_id,
    resource_type,
    name,
    marketplace_resource_id,
    created_by_user_id
  )
  values (
    p_family_id,
    'catalogue',
    catalogue_row.title,
    catalogue_row.id,
    auth.uid()
  )
  on conflict (family_id, marketplace_resource_id) do nothing
  returning id into saved_id;

  if saved_id is null then
    select id
    into saved_id
    from public.family_resources
    where family_id = p_family_id
      and marketplace_resource_id = catalogue_row.id;
  end if;

  if saved_id is null then
    raise exception 'This MyLearna resource could not be saved.' using errcode = 'P0001';
  end if;

  return saved_id;
end;
$$;

revoke all on function public.mylearna_save_marketplace_resource_to_cupboard(uuid, text)
  from public, anon;
grant execute on function public.mylearna_save_marketplace_resource_to_cupboard(uuid, text)
  to authenticated;
