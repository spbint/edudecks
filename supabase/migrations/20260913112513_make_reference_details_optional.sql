-- 3K.4A.2: reference details are helpful but not required when a resource has a name.
alter table public.family_resources
  drop constraint if exists family_resources_source_check;

alter table public.family_resources
  add constraint family_resources_source_check check (
    (resource_type = 'web_link' and length(btrim(name)) > 0 and url ~* '^https?://' and reference_text is null and resource_file_id is null)
    or (resource_type = 'reference' and length(btrim(name)) > 0 and url is null and resource_file_id is null)
    or (resource_type = 'file' and length(btrim(name)) > 0 and url is null and reference_text is null and resource_file_id is not null)
  );
