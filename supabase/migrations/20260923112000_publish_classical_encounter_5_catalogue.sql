-- Generated from the canonical MyLearna Classical registry. Do not hand-author catalogue metadata.
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
  'MYL-CLASSICAL-Y34-A-U1-E05',
  null,
  'classical-y3-4-a-u1-e05-trade-travel-and-exchange',
  'Trade, Travel and Exchange',
  'https://cdn.shopify.com/s/files/1/0888/9529/1710/files/mylearna-classical-y3-4-a-u1-e05-page-01.png?v=1790163493',
  'Curriculum',
  'MyLearna Classical',
  'Years 3–4 · Cycle A: The Ancient World',
  'booklet-pdf',
  true,
  '{"access_model":"family_included","band_key":"years-3-4","big_question":"How did goods, people and ideas connect early civilisations?","brand":"MyLearna Classical","bundle_hierarchy":{"cycle_key":"classical-y3-4-a","encounter_key":"classical-y3-4-a-u1-e05","unit_key":"classical-y3-4-a-u1"},"catalogue_kind":"encounter","curriculum_key":"mylearna-classical","cycle_key":"a","cycle_title":"The Ancient World","encounter_number":5,"entitlement_key":"family_subscription","future_physical_pack_supported":true,"included_with_family":true,"page_count":10,"pathway_step_id":"classical::history-and-civilisation::middle-primary::trade-travel-and-exchange","pdf_href":"/api/classical/booklets/y3-4-a-u1-e05","step_key":"trade-travel-and-exchange","unit_key":"first-civilisations","unit_title":"The First Civilisations"}'::jsonb
)
on conflict (source, external_product_id) do update
set
  external_variant_id = excluded.external_variant_id,
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
