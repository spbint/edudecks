-- Learner View's binary support signal. It carries no learner-auth or message data.
create table if not exists public.learner_help_requests (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.family_profiles(id) on delete cascade,
  learner_id uuid not null references public.learners(id) on delete cascade,
  source_type text not null,
  source_id uuid not null,
  requested_at timestamptz not null default now(),
  cleared_at timestamptz null,
  created_by_user_id uuid not null,
  cleared_by_user_id uuid null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint learner_help_requests_source_type_check
    check (source_type in ('calendar_item', 'on_deck_item')),
  constraint learner_help_requests_clear_pair_check
    check ((cleared_at is null and cleared_by_user_id is null) or cleared_at is not null)
);

create unique index if not exists learner_help_requests_active_source_idx
  on public.learner_help_requests (family_id, learner_id, source_type, source_id)
  where cleared_at is null;

create index if not exists learner_help_requests_family_active_idx
  on public.learner_help_requests (family_id, learner_id, requested_at desc)
  where cleared_at is null;

alter table public.learner_help_requests enable row level security;
revoke all on public.learner_help_requests from public;
revoke all on public.learner_help_requests from anon;
grant select, insert, update on public.learner_help_requests to authenticated;

drop policy if exists "clean learner help select own family" on public.learner_help_requests;
create policy "clean learner help select own family"
on public.learner_help_requests
for select to authenticated
using (
  public.is_family_member(family_id)
  and exists (
    select 1 from public.learners learner
    where learner.id = learner_id
      and learner.family_id = public.learner_help_requests.family_id
  )
);

drop policy if exists "clean learner help insert own family" on public.learner_help_requests;
create policy "clean learner help insert own family"
on public.learner_help_requests
for insert to authenticated
with check (
  public.is_family_member(family_id)
  and created_by_user_id = (select auth.uid())
  and exists (
    select 1 from public.learners learner
    where learner.id = learner_id
      and learner.family_id = public.learner_help_requests.family_id
  )
  and (
    (source_type = 'calendar_item' and exists (
      select 1 from public.calendar_items item
      where item.id = source_id
        and item.family_id = public.learner_help_requests.family_id
        and (item.learner_id = public.learner_help_requests.learner_id or item.learner_id is null)
    ))
    or
    (source_type = 'on_deck_item' and exists (
      select 1 from public.learning_queue_items queue_item
      where queue_item.id = source_id
        and queue_item.family_id = public.learner_help_requests.family_id
        and queue_item.learner_id = public.learner_help_requests.learner_id
    ))
  )
);

drop policy if exists "clean learner help update own family" on public.learner_help_requests;
create policy "clean learner help update own family"
on public.learner_help_requests
for update to authenticated
using (public.is_family_member(family_id))
with check (
  public.is_family_member(family_id)
  and cleared_at is not null
  and cleared_by_user_id = (select auth.uid())
);

create or replace function public.mylearna_validate_learner_help_request()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if tg_op = 'UPDATE' and (
    new.family_id is distinct from old.family_id
    or new.learner_id is distinct from old.learner_id
    or new.source_type is distinct from old.source_type
    or new.source_id is distinct from old.source_id
    or new.created_by_user_id is distinct from old.created_by_user_id
    or new.requested_at is distinct from old.requested_at
  ) then
    raise exception 'Help request identity cannot be changed.' using errcode = '22023';
  end if;
  return new;
end;
$$;

revoke all on function public.mylearna_validate_learner_help_request() from public;
drop trigger if exists mylearna_validate_learner_help_request_before_write
  on public.learner_help_requests;
create trigger mylearna_validate_learner_help_request_before_write
before insert or update on public.learner_help_requests
for each row execute function public.mylearna_validate_learner_help_request();

drop trigger if exists clean_learner_help_requests_updated_at on public.learner_help_requests;
create trigger clean_learner_help_requests_updated_at
before update on public.learner_help_requests
for each row execute function public.clean_set_updated_at();
