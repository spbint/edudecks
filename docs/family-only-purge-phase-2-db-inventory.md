# Family-Only Purge Phase 2 DB Inventory

This document is a planning artifact for issue `#110`.

- It is read-only by default.
- The SQL below is for inventory, dependency mapping, and cleanup planning.
- Do not run the destructive cleanup section until backups, dependency checks, and an explicit approval step are complete.

## Canonical family-only model

```text
authenticated user
-> family_profiles
-> family_profile_children
-> students.id
-> family_programs
-> learning_plan_items
-> evidence_entries
-> portfolio / reports / exports
```

Compatibility sources may still exist during the purge, but they are not canonical product truth:

- `parent_student_links`
- `learners`
- `planner_blocks`
- local learner cache
- legacy `/authority*` flows
- legacy `/exports*` flows
- `useActiveStudent`
- `familyLearners`
- `familyLearnerService`

## Active family-safe route map

- `/my-day`
- `/my-calendar`
- `/my-programs`
- `/capture`
- `/my-portfolio`
- `/my-reports`
- `/reports/output`
- `/reports/library`
- `/reports/presets`
- `/curriculum`
- `/family`
- `/profile`
- `/settings`

Safe aliases that remain as redirects:

- `/calendar` -> `/my-calendar`
- `/planner` -> `/my-calendar`
- `/my-plan` -> `/my-calendar`
- `/my-month` -> `/my-calendar`
- `/portfolio` -> `/my-portfolio`
- `/home` -> `/my-day`
- `/dashboard` -> `/my-day`

## Retired or redirected legacy route map

- `/children` -> `/family`
- `/children/new` -> `/profile`
- `/children/[id]` -> `/profile`
- `/authority` -> `/my-reports`
- `/authority-au` -> `/my-reports`
- `/authority-uk` -> `/my-reports`
- `/authority-us` -> `/my-reports`
- `/authority/readiness` -> `/my-reports`
- `/authority/pack-builder` -> `/my-reports`
- `/authority/export` -> `/my-reports`
- `/authority/history` -> `/my-reports`
- `/exports` -> `/my-reports`
- `/exports/templates` -> `/my-reports`
- `/goals` -> `/my-day`
- `/start` -> `/my-day`
- `/onboarding` -> `/profile`
- `/onboarding/child` -> `/profile`
- `/onboarding/first-entry` -> `/profile`
- `/my-progress` -> `/my-day`

## Read-only SQL inventory queries

```sql
-- 1. Count all students
select count(*) as all_students
from public.students;

-- 2. Count family-linked students
select count(distinct fpc.child_id) as family_linked_students
from public.family_profile_children fpc;

-- 3. Count unlinked students
select count(*) as unlinked_students
from public.students s
left join public.family_profile_children fpc
  on fpc.child_id::text = s.id::text
where fpc.child_id is null;

-- 4. List family-linked students
select
  fp.id as family_profile_id,
  fp.user_id,
  fp.owner_user_id,
  fpc.id as family_profile_child_id,
  fpc.created_at as linked_at,
  s.id as student_id,
  coalesce(s.preferred_name, s.first_name) as learner_label,
  s.first_name,
  s.preferred_name,
  s.surname,
  s.year_level
from public.family_profile_children fpc
join public.family_profiles fp
  on fp.id::text = fpc.family_profile_id::text
join public.students s
  on s.id::text = fpc.child_id::text
order by fp.id, learner_label, s.id;

-- 5. List unlinked students
select
  s.id as student_id,
  s.first_name,
  s.preferred_name,
  s.surname,
  s.year_level,
  s.created_at,
  s.updated_at
from public.students s
left join public.family_profile_children fpc
  on fpc.child_id::text = s.id::text
where fpc.child_id is null
order by s.created_at desc nulls last, s.id;

-- 6. Find every table/column with learner-style references
select
  table_schema,
  table_name,
  column_name,
  data_type
from information_schema.columns
where table_schema = 'public'
  and column_name in (
    'student_id',
    'child_id',
    'learner_id',
    'class_id',
    'teacher_id',
    'school_id',
    'intervention_id'
  )
order by table_name, column_name;

-- 6b. Generate dependency count SQL for unlinked students
select format(
  'select %L as target, count(*) as dependent_rows from %I.%I where %I::text in (
     select s.id::text
     from public.students s
     left join public.family_profile_children fpc
       on fpc.child_id::text = s.id::text
     where fpc.child_id is null
   );',
  table_schema || '.' || table_name || '.' || column_name,
  table_schema,
  table_name,
  column_name
)
from information_schema.columns
where table_schema = 'public'
  and column_name in ('student_id', 'child_id', 'learner_id')
order by table_name, column_name;

-- 7. Inventory school/classroom/teacher/intervention-style tables and key legacy tables
select
  table_schema,
  table_name
from information_schema.tables
where table_schema = 'public'
  and (
    table_name ilike '%school%'
    or table_name ilike '%teacher%'
    or table_name ilike '%class%'
    or table_name ilike '%classroom%'
    or table_name ilike '%intervention%'
    or table_name in (
      'students',
      'family_profile_children',
      'parent_student_links',
      'learners',
      'planner_blocks',
      'student_profile_snapshots',
      'assessment_instruments',
      'assessment_results',
      'authority_export_snapshots',
      'report_drafts'
    )
  )
order by table_name;

-- 7b. Generate row-count SQL for those tables
select format(
  'select %L as table_name, count(*) as row_count from %I.%I;',
  table_schema || '.' || table_name,
  table_schema,
  table_name
)
from information_schema.tables
where table_schema = 'public'
  and (
    table_name ilike '%school%'
    or table_name ilike '%teacher%'
    or table_name ilike '%class%'
    or table_name ilike '%classroom%'
    or table_name ilike '%intervention%'
    or table_name in (
      'students',
      'family_profile_children',
      'parent_student_links',
      'learners',
      'planner_blocks',
      'student_profile_snapshots',
      'assessment_instruments',
      'assessment_results',
      'authority_export_snapshots',
      'report_drafts'
    )
  )
order by table_name;

-- 8. Identify foreign keys referencing students
select
  con.conname as fk_name,
  n.nspname as schema_name,
  cls.relname as referencing_table,
  att.attname as referencing_column,
  confcls.relname as referenced_table
from pg_constraint con
join pg_class cls
  on cls.oid = con.conrelid
join pg_namespace n
  on n.oid = cls.relnamespace
join pg_class confcls
  on confcls.oid = con.confrelid
join unnest(con.conkey) with ordinality as cols(attnum, ord)
  on true
join pg_attribute att
  on att.attrelid = con.conrelid
 and att.attnum = cols.attnum
where con.contype = 'f'
  and con.confrelid = 'public.students'::regclass
order by referencing_table, referencing_column;

-- 9. Review RLS on family/student/report tables
select
  schemaname,
  tablename,
  rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in (
    'students',
    'family_profile_children',
    'parent_student_links',
    'learners',
    'family_profiles',
    'family_programs',
    'learning_plan_items',
    'evidence_entries',
    'registration_cycles',
    'reporting_periods',
    'report_documents',
    'report_sections',
    'report_drafts',
    'authority_export_snapshots'
  )
order by tablename;

select
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
  and tablename in (
    'students',
    'family_profile_children',
    'parent_student_links',
    'learners',
    'family_profiles',
    'family_programs',
    'learning_plan_items',
    'evidence_entries',
    'registration_cycles',
    'reporting_periods',
    'report_documents',
    'report_sections',
    'report_drafts',
    'authority_export_snapshots'
  )
order by tablename, policyname;
```

## Draft destructive cleanup SQL — not executed

```sql
-- BACKUP FIRST. DO NOT RUN THIS UNTIL:
-- 1) full table backups are exported
-- 2) dependency counts are reviewed
-- 3) keep/quarantine/delete ids are approved
-- 4) RLS/schema for students and bridge tables is confirmed

begin;

-- Keep set: canonical family-linked students
create temporary table tmp_family_students_to_keep as
select distinct s.id::text as student_id
from public.students s
join public.family_profile_children fpc
  on fpc.child_id::text = s.id::text;

-- Delete candidates: students not linked to any family profile
create temporary table tmp_unlinked_students as
select s.id::text as student_id
from public.students s
left join public.family_profile_children fpc
  on fpc.child_id::text = s.id::text
where fpc.child_id is null;

-- Quarantine set: move uncertain ids here before delete
create temporary table tmp_students_to_quarantine (
  student_id text primary key,
  reason text
);

-- Pre-delete counts
select
  (select count(*) from tmp_family_students_to_keep) as keep_count,
  (select count(*) from tmp_unlinked_students) as delete_candidate_count,
  (select count(*) from tmp_students_to_quarantine) as quarantine_count;

-- Dependency review: run the read-only dependency SQL above first.
-- Any unlinked student with retained evidence/report/export/history dependencies
-- must be moved into tmp_students_to_quarantine before any delete.

do $$
begin
  if to_regclass('public.parent_student_links') is not null then
    execute '
      delete from public.parent_student_links
      where student_id::text in (select student_id from tmp_unlinked_students)
    ';
  end if;

  if to_regclass('public.planner_blocks') is not null then
    execute '
      delete from public.planner_blocks
      where student_id::text in (select student_id from tmp_unlinked_students)
    ';
  end if;

  if to_regclass('public.assessment_results') is not null then
    execute '
      delete from public.assessment_results
      where student_id::text in (select student_id from tmp_unlinked_students)
    ';
  end if;

  if to_regclass('public.student_profile_snapshots') is not null then
    execute '
      delete from public.student_profile_snapshots
      where student_id::text in (select student_id from tmp_unlinked_students)
    ';
  end if;
end $$;

-- STOP HERE unless dependency review proves the following are demo-only:
-- public.evidence_entries
-- public.learning_plan_items
-- public.student_evidence_curation
-- public.report_drafts
-- public.authority_export_snapshots
-- public.report_export_events
-- public.registration_cycles
-- public.reporting_periods
-- public.report_documents
-- public.report_sections
-- public.learning_plans
-- public.homeschool_notifications
-- public.homeschool_attendance_days
-- public.homeschool_attendance_summaries

delete from public.students
where id::text in (select student_id from tmp_unlinked_students);

-- Post-delete counts
select
  (select count(*) from public.students) as students_after_delete,
  (select count(*) from tmp_unlinked_students) as attempted_delete_count,
  (select count(*) from tmp_students_to_quarantine) as quarantined_count;

rollback;
-- Replace ROLLBACK with COMMIT only after:
-- 1) backups are confirmed
-- 2) delete/quarantine sets are manually reviewed
-- 3) explicit approval is given for the destructive run
```
