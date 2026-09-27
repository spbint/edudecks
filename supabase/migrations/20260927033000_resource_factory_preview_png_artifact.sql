-- Persist first-page PNG previews rendered from the actual worksheet PDF.

alter table public.resource_factory_artifacts
  drop constraint if exists resource_factory_artifacts_kind_check;

alter table public.resource_factory_artifacts
  add constraint resource_factory_artifacts_kind_check
  check (
    artifact_kind in (
      'worksheet_pdf',
      'answers_pdf',
      'worksheet_preview_png',
      'thumbnail',
      'pinterest_image'
    )
  );

update storage.buckets
set allowed_mime_types = array['application/pdf', 'image/png']::text[]
where id = 'resource-factory-public';
