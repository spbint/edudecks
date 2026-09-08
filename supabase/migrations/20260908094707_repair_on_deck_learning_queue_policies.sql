-- Repair On Deck learner-family policy checks after remote verification.

drop policy if exists "clean learning queue select own family" on public.learning_queue_items;
create policy "clean learning queue select own family"
on public.learning_queue_items
for select
to authenticated
using (
  public.is_family_member(family_id)
  and exists (
    select 1
    from public.learners learner
    where learner.id = learner_id
      and learner.family_id = public.learning_queue_items.family_id
  )
);

drop policy if exists "clean learning queue insert own family" on public.learning_queue_items;
create policy "clean learning queue insert own family"
on public.learning_queue_items
for insert
to authenticated
with check (
  public.is_family_member(family_id)
  and created_by_user_id = (select auth.uid())
  and exists (
    select 1
    from public.learners learner
    where learner.id = learner_id
      and learner.family_id = public.learning_queue_items.family_id
  )
);

drop policy if exists "clean learning queue update own family" on public.learning_queue_items;
create policy "clean learning queue update own family"
on public.learning_queue_items
for update
to authenticated
using (public.is_family_member(family_id))
with check (
  public.is_family_member(family_id)
  and exists (
    select 1
    from public.learners learner
    where learner.id = learner_id
      and learner.family_id = public.learning_queue_items.family_id
  )
);
