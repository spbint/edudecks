-- MyLearna Intelligence Engine v1 least-privilege privileges and RLS correction.
-- Apply after:
--   1. 20260723_intelligence_engine_v1.sql
--   2. 20260724_recommendation_engine_v1.sql
--   3. 20260724_shopify_commerce_pilot_v1.sql
--
-- This migration is intentionally limited to the 13 intelligence_* tables.
-- It does not apply migrations, create backups, or alter application features.
-- The caller should execute this file in the same transaction as the preceding
-- migration batch, with ON_ERROR_STOP enabled.

-- Remove inherited/default access before adding the explicit allow-list.
revoke all privileges on table
  public.intelligence_ideas,
  public.intelligence_idea_sources,
  public.intelligence_lesson_plans,
  public.intelligence_unit_plans,
  public.intelligence_lesson_sequences,
  public.intelligence_resource_requirements,
  public.intelligence_plan_versions,
  public.intelligence_family_owned_resources,
  public.intelligence_recommendation_interaction_events,
  public.intelligence_commerce_resource_mappings,
  public.intelligence_learning_baskets,
  public.intelligence_learning_basket_items,
  public.intelligence_commerce_events
from public, anon, authenticated, service_role;

-- Core idea/source/plan data is user-owned and requires CRUD for the current
-- repository flows, including draft rollback and parent review edits.
grant select, insert, update, delete on table
  public.intelligence_ideas,
  public.intelligence_idea_sources,
  public.intelligence_lesson_plans,
  public.intelligence_unit_plans,
  public.intelligence_lesson_sequences,
  public.intelligence_resource_requirements
to authenticated;

-- Plan versions are append-oriented but parent approval updates approval fields.
-- No application flow requires deleting a version.
grant select, insert, update on table
  public.intelligence_plan_versions
to authenticated;

-- Family-owned resources are explicitly manageable by their owning parent.
grant select, insert, update, delete on table
  public.intelligence_family_owned_resources
to authenticated;

-- Recommendation interactions are append-only from the application perspective.
grant select, insert on table
  public.intelligence_recommendation_interaction_events
to authenticated;

-- Mappings are readable by authenticated users. The authenticated table-level
-- write grant is required because PostgreSQL checks table privileges before RLS.
-- RLS below still restricts INSERT/UPDATE/DELETE to JWTs whose app_metadata role
-- is admin. A safer future application design is a server-only repository using
-- service_role after an explicit app_metadata admin check; service_role must
-- never be exposed to browser code.
grant select, insert, update, delete on table
  public.intelligence_commerce_resource_mappings
to authenticated;

-- Basket writes are user-owned. Removal is represented by an item status update;
-- no DELETE privilege is required by the current application.
grant select, insert, update on table
  public.intelligence_learning_baskets,
  public.intelligence_learning_basket_items
to authenticated;

-- Commerce and demand events are append-only. The current application does not
-- read these rows through the authenticated client.
grant insert on table
  public.intelligence_commerce_events
to authenticated;

-- service_role is intentionally granted full table access for server-only
-- repositories, migrations, operational repair, and analytics workflows. It
-- bypasses RLS by design and must never be placed in NEXT_PUBLIC_* variables or
-- sent to the client.
grant all privileges on table
  public.intelligence_ideas,
  public.intelligence_idea_sources,
  public.intelligence_lesson_plans,
  public.intelligence_unit_plans,
  public.intelligence_lesson_sequences,
  public.intelligence_resource_requirements,
  public.intelligence_plan_versions,
  public.intelligence_family_owned_resources,
  public.intelligence_recommendation_interaction_events,
  public.intelligence_commerce_resource_mappings,
  public.intelligence_learning_baskets,
  public.intelligence_learning_basket_items,
  public.intelligence_commerce_events
to service_role;

-- Reassert RLS ownership and operation boundaries. These drops make the
-- correction rerunnable after the original broad FOR ALL policies exist.
alter table public.intelligence_ideas enable row level security;
alter table public.intelligence_idea_sources enable row level security;
alter table public.intelligence_lesson_plans enable row level security;
alter table public.intelligence_unit_plans enable row level security;
alter table public.intelligence_lesson_sequences enable row level security;
alter table public.intelligence_resource_requirements enable row level security;
alter table public.intelligence_plan_versions enable row level security;
alter table public.intelligence_family_owned_resources enable row level security;
alter table public.intelligence_recommendation_interaction_events enable row level security;
alter table public.intelligence_commerce_resource_mappings enable row level security;
alter table public.intelligence_learning_baskets enable row level security;
alter table public.intelligence_learning_basket_items enable row level security;
alter table public.intelligence_commerce_events enable row level security;

drop policy if exists "intelligence ideas own" on public.intelligence_ideas;
create policy "intelligence ideas own"
on public.intelligence_ideas for all to authenticated
using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "intelligence sources own" on public.intelligence_idea_sources;
create policy "intelligence sources own"
on public.intelligence_idea_sources for all to authenticated
using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "intelligence lesson plans own" on public.intelligence_lesson_plans;
create policy "intelligence lesson plans own"
on public.intelligence_lesson_plans for all to authenticated
using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "intelligence unit plans own" on public.intelligence_unit_plans;
create policy "intelligence unit plans own"
on public.intelligence_unit_plans for all to authenticated
using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "intelligence sequences own" on public.intelligence_lesson_sequences;
create policy "intelligence sequences own"
on public.intelligence_lesson_sequences for all to authenticated
using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "intelligence resources own" on public.intelligence_resource_requirements;
create policy "intelligence resources own"
on public.intelligence_resource_requirements for all to authenticated
using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "intelligence plan versions own" on public.intelligence_plan_versions;
create policy "intelligence plan versions own"
on public.intelligence_plan_versions for all to authenticated
using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "intelligence owned resources own" on public.intelligence_family_owned_resources;
create policy "intelligence owned resources own"
on public.intelligence_family_owned_resources for all to authenticated
using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "intelligence recommendation events own" on public.intelligence_recommendation_interaction_events;
drop policy if exists "intelligence recommendation events select own" on public.intelligence_recommendation_interaction_events;
drop policy if exists "intelligence recommendation events insert own" on public.intelligence_recommendation_interaction_events;
create policy "intelligence recommendation events select own"
on public.intelligence_recommendation_interaction_events for select to authenticated
using (user_id = auth.uid());
create policy "intelligence recommendation events insert own"
on public.intelligence_recommendation_interaction_events for insert to authenticated
with check (user_id = auth.uid());

drop policy if exists "intelligence commerce mappings read authenticated" on public.intelligence_commerce_resource_mappings;
drop policy if exists "intelligence commerce mappings admin write" on public.intelligence_commerce_resource_mappings;
drop policy if exists "intelligence commerce mappings admin insert" on public.intelligence_commerce_resource_mappings;
drop policy if exists "intelligence commerce mappings admin update" on public.intelligence_commerce_resource_mappings;
drop policy if exists "intelligence commerce mappings admin delete" on public.intelligence_commerce_resource_mappings;
create policy "intelligence commerce mappings read authenticated"
on public.intelligence_commerce_resource_mappings for select to authenticated
using (true);
create policy "intelligence commerce mappings admin insert"
on public.intelligence_commerce_resource_mappings for insert to authenticated
with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
create policy "intelligence commerce mappings admin update"
on public.intelligence_commerce_resource_mappings for update to authenticated
using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
create policy "intelligence commerce mappings admin delete"
on public.intelligence_commerce_resource_mappings for delete to authenticated
using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "intelligence learning baskets own" on public.intelligence_learning_baskets;
create policy "intelligence learning baskets own"
on public.intelligence_learning_baskets for all to authenticated
using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "intelligence basket items own basket" on public.intelligence_learning_basket_items;
drop policy if exists "intelligence basket items select own basket" on public.intelligence_learning_basket_items;
drop policy if exists "intelligence basket items insert own basket" on public.intelligence_learning_basket_items;
drop policy if exists "intelligence basket items update own basket" on public.intelligence_learning_basket_items;
create policy "intelligence basket items select own basket"
on public.intelligence_learning_basket_items for select to authenticated
using (exists (
  select 1 from public.intelligence_learning_baskets b
  where b.id = basket_id and b.user_id = auth.uid()
));
create policy "intelligence basket items insert own basket"
on public.intelligence_learning_basket_items for insert to authenticated
with check (exists (
  select 1 from public.intelligence_learning_baskets b
  where b.id = basket_id and b.user_id = auth.uid()
));
create policy "intelligence basket items update own basket"
on public.intelligence_learning_basket_items for update to authenticated
using (exists (
  select 1 from public.intelligence_learning_baskets b
  where b.id = basket_id and b.user_id = auth.uid()
))
with check (exists (
  select 1 from public.intelligence_learning_baskets b
  where b.id = basket_id and b.user_id = auth.uid()
));

drop policy if exists "intelligence commerce events own" on public.intelligence_commerce_events;
drop policy if exists "intelligence commerce events insert own" on public.intelligence_commerce_events;
create policy "intelligence commerce events insert own"
on public.intelligence_commerce_events for insert to authenticated
with check (user_id = auth.uid());

-- Privilege inspection query. Execute separately after migration application;
-- it is intentionally commented out in this migration.
--
-- with proposed_tables(table_name) as (
--   values
--     ('intelligence_ideas'), ('intelligence_idea_sources'),
--     ('intelligence_lesson_plans'), ('intelligence_unit_plans'),
--     ('intelligence_lesson_sequences'), ('intelligence_resource_requirements'),
--     ('intelligence_plan_versions'), ('intelligence_family_owned_resources'),
--     ('intelligence_recommendation_interaction_events'),
--     ('intelligence_commerce_resource_mappings'),
--     ('intelligence_learning_baskets'),
--     ('intelligence_learning_basket_items'), ('intelligence_commerce_events')
-- ), roles(role_name) as (
--   values ('anon'), ('authenticated'), ('service_role')
-- ), privileges(privilege_name) as (
--   values ('SELECT'), ('INSERT'), ('UPDATE'), ('DELETE')
-- )
-- select t.table_name, r.role_name, p.privilege_name,
--        has_table_privilege(r.role_name, format('public.%I', t.table_name), p.privilege_name) as granted
-- from proposed_tables t cross join roles r cross join privileges p
-- order by t.table_name, r.role_name, p.privilege_name;
