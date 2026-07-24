-- Reverse of 20260725_intelligence_privileges_v1.sql.
-- Staging/disposable-target use only. Restore the pre-migration ACL snapshot
-- instead when exact pre-migration default privileges must be preserved.

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

-- Restore the original broad authenticated RLS policy shape from the three
-- preceding migrations. The exact prior ACL state must come from the ACL
-- snapshot taken before applying the privilege migration.
drop policy if exists "intelligence recommendation events select own" on public.intelligence_recommendation_interaction_events;
drop policy if exists "intelligence recommendation events insert own" on public.intelligence_recommendation_interaction_events;
drop policy if exists "intelligence recommendation events own" on public.intelligence_recommendation_interaction_events;
create policy "intelligence recommendation events own"
on public.intelligence_recommendation_interaction_events for all to authenticated
using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "intelligence commerce mappings read authenticated" on public.intelligence_commerce_resource_mappings;
drop policy if exists "intelligence commerce mappings admin insert" on public.intelligence_commerce_resource_mappings;
drop policy if exists "intelligence commerce mappings admin update" on public.intelligence_commerce_resource_mappings;
drop policy if exists "intelligence commerce mappings admin delete" on public.intelligence_commerce_resource_mappings;
drop policy if exists "intelligence commerce mappings admin write" on public.intelligence_commerce_resource_mappings;
create policy "intelligence commerce mappings read authenticated"
on public.intelligence_commerce_resource_mappings for select to authenticated using (true);
create policy "intelligence commerce mappings admin write"
on public.intelligence_commerce_resource_mappings for all to authenticated
using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "intelligence basket items select own basket" on public.intelligence_learning_basket_items;
drop policy if exists "intelligence basket items insert own basket" on public.intelligence_learning_basket_items;
drop policy if exists "intelligence basket items update own basket" on public.intelligence_learning_basket_items;
drop policy if exists "intelligence basket items own basket" on public.intelligence_learning_basket_items;
create policy "intelligence basket items own basket"
on public.intelligence_learning_basket_items for all to authenticated
using (exists (
  select 1 from public.intelligence_learning_baskets b
  where b.id = basket_id and b.user_id = auth.uid()
))
with check (exists (
  select 1 from public.intelligence_learning_baskets b
  where b.id = basket_id and b.user_id = auth.uid()
));

drop policy if exists "intelligence commerce events insert own" on public.intelligence_commerce_events;
drop policy if exists "intelligence commerce events own" on public.intelligence_commerce_events;
create policy "intelligence commerce events own"
on public.intelligence_commerce_events for all to authenticated
using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Restore the original owner policies for the remaining tables.
drop policy if exists "intelligence ideas own" on public.intelligence_ideas;
create policy "intelligence ideas own" on public.intelligence_ideas for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "intelligence sources own" on public.intelligence_idea_sources;
create policy "intelligence sources own" on public.intelligence_idea_sources for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "intelligence lesson plans own" on public.intelligence_lesson_plans;
create policy "intelligence lesson plans own" on public.intelligence_lesson_plans for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "intelligence unit plans own" on public.intelligence_unit_plans;
create policy "intelligence unit plans own" on public.intelligence_unit_plans for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "intelligence sequences own" on public.intelligence_lesson_sequences;
create policy "intelligence sequences own" on public.intelligence_lesson_sequences for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "intelligence resources own" on public.intelligence_resource_requirements;
create policy "intelligence resources own" on public.intelligence_resource_requirements for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "intelligence plan versions own" on public.intelligence_plan_versions;
create policy "intelligence plan versions own" on public.intelligence_plan_versions for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "intelligence owned resources own" on public.intelligence_family_owned_resources;
create policy "intelligence owned resources own" on public.intelligence_family_owned_resources for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "intelligence learning baskets own" on public.intelligence_learning_baskets;
create policy "intelligence learning baskets own" on public.intelligence_learning_baskets for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
