-- Read-only verification for 20260730_idea_to_learning.sql.
-- Do not modify data or schema.
with checks as (
  select 'calendar plan columns' as check_name,
    count(*) = 9 as passed
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'calendar_items'
    and column_name in ('source_plan_type','source_plan_id','source_plan_version','source_plan_sequence_index','source_plan_snapshot','source_idea_id','source_url','source_plan_schedule_key','delivery_status')
  union all
  select 'evidence plan columns', count(*) = 6
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'evidence_entries'
    and column_name in ('source_plan_type','source_plan_id','source_plan_version','source_plan_sequence_index','source_idea_id','source_url')
  union all
  select 'calendar checks', count(*) >= 4
  from pg_constraint
  where conrelid = 'public.calendar_items'::regclass
    and conname in ('calendar_items_source_plan_type_check','calendar_items_source_plan_version_check','calendar_items_source_plan_sequence_check','calendar_items_delivery_status_check')
  union all
  select 'evidence checks', count(*) >= 3
  from pg_constraint
  where conrelid = 'public.evidence_entries'::regclass
    and conname in ('evidence_entries_source_plan_type_check','evidence_entries_source_plan_version_check','evidence_entries_source_plan_sequence_check')
  union all
  select 'duplicate schedule protection', exists (
    select 1 from pg_indexes
    where schemaname = 'public' and tablename = 'calendar_items' and indexname = 'calendar_items_source_plan_schedule_key_unique'
  )
  union all
  select 'calendar RLS remains enabled', relrowsecurity
  from pg_class where oid = 'public.calendar_items'::regclass
  union all
  select 'evidence RLS remains enabled', relrowsecurity
  from pg_class where oid = 'public.evidence_entries'::regclass
)
select check_name,
  case when passed then 'PASS' else 'FAIL' end as result
from checks
order by check_name;
