-- MyLearna Homeschool learner abuse ceiling hardening.
-- The Free-era family learner limit is removed in favor of a defensive, non-product-limit ceiling.

drop trigger if exists mylearna_free_learner_limit_before_insert on public.learners;
drop function if exists public.mylearna_enforce_free_learner_limit();

create or replace function public.mylearna_enforce_learner_abuse_ceiling()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  existing_learner_count integer := 0;
begin
  perform 1
  from public.family_profiles
  where id = new.family_id
  for update;

  select count(*)
  into existing_learner_count
  from public.learners
  where family_id = new.family_id;

  if existing_learner_count >= 20 then
    raise exception
      'We couldn''t add another learner to this family. Please contact MyLearna support if you need help.'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

drop trigger if exists mylearna_learner_abuse_ceiling_before_insert on public.learners;
create trigger mylearna_learner_abuse_ceiling_before_insert
before insert on public.learners
for each row execute function public.mylearna_enforce_learner_abuse_ceiling();
