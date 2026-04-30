-- Remove Community from the live product without dropping historical data.
-- This script preserves existing rows for future inspection and disables client writes.

begin;

do $$
declare
  target_table text;
  policy_record record;
begin
  foreach target_table in array array[
    'community_threads',
    'community_replies',
    'community_thread_support'
  ]
  loop
    if to_regclass(format('public.%I', target_table)) is not null then
      execute format('alter table public.%I enable row level security', target_table);
      execute format('revoke insert, update, delete on table public.%I from anon, authenticated', target_table);

      for policy_record in
        select policyname
        from pg_policies
        where schemaname = 'public'
          and tablename = target_table
      loop
        execute format('drop policy if exists %I on public.%I', policy_record.policyname, target_table);
      end loop;
    end if;
  end loop;
end $$;

do $$
begin
  if to_regclass('public.community_threads') is not null then
    create policy "community threads historical read only"
    on public.community_threads
    for select
    to authenticated
    using (true);

    create policy "community threads inserts disabled"
    on public.community_threads
    for insert
    to authenticated
    with check (false);

    create policy "community threads updates disabled"
    on public.community_threads
    for update
    to authenticated
    using (false)
    with check (false);

    create policy "community threads deletes disabled"
    on public.community_threads
    for delete
    to authenticated
    using (false);
  end if;

  if to_regclass('public.community_replies') is not null then
    create policy "community replies historical read only"
    on public.community_replies
    for select
    to authenticated
    using (true);

    create policy "community replies inserts disabled"
    on public.community_replies
    for insert
    to authenticated
    with check (false);

    create policy "community replies updates disabled"
    on public.community_replies
    for update
    to authenticated
    using (false)
    with check (false);

    create policy "community replies deletes disabled"
    on public.community_replies
    for delete
    to authenticated
    using (false);
  end if;

  if to_regclass('public.community_thread_support') is not null then
    create policy "community thread support historical read only"
    on public.community_thread_support
    for select
    to authenticated
    using (true);

    create policy "community thread support inserts disabled"
    on public.community_thread_support
    for insert
    to authenticated
    with check (false);

    create policy "community thread support updates disabled"
    on public.community_thread_support
    for update
    to authenticated
    using (false)
    with check (false);

    create policy "community thread support deletes disabled"
    on public.community_thread_support
    for delete
    to authenticated
    using (false);
  end if;
end $$;

commit;

-- Optional destructive cleanup, intentionally disabled:
-- drop table if exists public.community_thread_support;
-- drop table if exists public.community_replies;
-- drop table if exists public.community_threads;
