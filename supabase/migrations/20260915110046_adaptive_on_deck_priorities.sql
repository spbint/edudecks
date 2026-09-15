-- Adaptive On Deck keeps priority on the family/learner focus relationship.
-- It does not add dates, completion, scheduling, or source mutations.

alter table public.learning_queue_items
  add column if not exists priority text not null default 'flexible';

update public.learning_queue_items
set priority = 'flexible'
where priority is null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.learning_queue_items'::regclass
      and conname = 'learning_queue_items_priority_check'
  ) then
    alter table public.learning_queue_items
      add constraint learning_queue_items_priority_check
      check (priority in ('must_do', 'flexible', 'extra'));
  end if;
end
$$;

create index if not exists learning_queue_items_family_learner_priority_position_idx
  on public.learning_queue_items (family_id, learner_id, priority, position, created_at);
