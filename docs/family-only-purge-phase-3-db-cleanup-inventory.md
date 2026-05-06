# Family-Only Purge Phase 3: Database Cleanup Inventory

This document is the Phase 3 database inventory pack for MyLearna's family-only purge.

## Scope

- Inventory only
- No destructive SQL executed
- No schema migration
- No RLS or storage policy change
- No app-code change required to use this document

## Current access note

From the local repo environment, only the public Supabase URL and anon key are available.

- The anon key can reach the REST API.
- RLS correctly prevents it from returning a trustworthy full inventory.
- There is no checked-in service role key, no Postgres connection string, and no local `psql` or `supabase` CLI.

Because of that, the SQL below is the exact inventory pack to run manually in the Supabase SQL editor or from a privileged read-only database connection.

## Canonical keep boundary

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

Anything outside that path must be treated as either:

- compatibility-only
- legacy
- school/demo residue
- quarantine/review

## Manual run order

1. Run the inventory SQL section exactly as written.
2. Save query results to CSV.
3. Classify rows into keep/delete/quarantine sets.
4. Review any unlinked student that still has dependencies.
5. Export backups before any destructive action.
6. Only then consider the draft purge SQL, with `ROLLBACK` kept as default.

## SQL inventory pack

### 1. Total students

```sql
select count(*) as total_students
from public.students;
```

### 2. Family-linked students

```sql
select count(distinct fpc.child_id) as family_linked_students
from public.family_profile_children fpc;
```

### 3. Unlinked students

```sql
select count(*) as unlinked_students
from public.students s
left join public.family_profile_children fpc
  on fpc.child_id::text = s.id::text
where fpc.child_id is null;
```

### 4. All family profiles

```sql
select
  fp.id,
  fp.user_id,
  fp.owner_user_id,
  fp.family_display_name,
  fp.preferred_market,
  fp.country,
  fp.curriculum_framework_id,
  fp.curriculum_jurisdiction_id,
  fp.reporting_mode,
  fp.default_child_id,
  fp.created_at,
  fp.updated_at
from public.family_profiles fp
order by fp.updated_at desc nulls last, fp.created_at desc nulls last, fp.id;
```

### 5. All family profile child links

```sql
select
  fpc.id as family_profile_child_id,
  fpc.family_profile_id,
  fpc.child_id,
  fpc.is_default,
  fpc.created_at,
  fp.user_id,
  fp.owner_user_id,
  fp.family_display_name,
  s.first_name,
  s.preferred_name,
  s.surname,
  s.year_level
from public.family_profile_children fpc
left join public.family_profiles fp
  on fp.id::text = fpc.family_profile_id::text
left join public.students s
  on s.id::text = fpc.child_id::text
order by fpc.family_profile_id, fpc.created_at, fpc.child_id;
```

### 6. Family-linked students detail

```sql
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
  s.year_level,
  s.year_band,
  s.curriculum_framework_id,
  s.curriculum_jurisdiction_id,
  s.reporting_mode,
  s.created_at,
  s.updated_at
from public.family_profile_children fpc
join public.family_profiles fp
  on fp.id::text = fpc.family_profile_id::text
join public.students s
  on s.id::text = fpc.child_id::text
order by fp.id, learner_label, s.id;
```

### 7. Unlinked students detail

```sql
select
  s.id as student_id,
  s.first_name,
  s.preferred_name,
  s.surname,
  s.year_level,
  s.year_band,
  s.curriculum_framework_id,
  s.curriculum_jurisdiction_id,
  s.reporting_mode,
  s.created_at,
  s.updated_at
from public.students s
left join public.family_profile_children fpc
  on fpc.child_id::text = s.id::text
where fpc.child_id is null
order by s.created_at desc nulls last, s.id;
```

### 8. All tables with learner-style reference columns

```sql
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
```

### 9. Generate dependency-count SQL for unlinked students

```sql
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
```

### 10. School/classroom/teacher/intervention-style tables

```sql
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
```

### 11. Generate row-count SQL for school/legacy tables

```sql
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
```

### 12. Foreign keys referencing students

```sql
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
```

### 13. RLS status for family, learner, and reporting tables

```sql
select
  schemaname,
  tablename,
  rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in (
    'students',
    'family_profile_children',
    'family_profiles',
    'parent_student_links',
    'learners',
    'family_programs',
    'learning_plan_items',
    'evidence_entries',
    'registration_cycles',
    'reporting_periods',
    'report_documents',
    'report_sections',
    'report_export_events',
    'authority_export_snapshots',
    'report_drafts',
    'student_profile_snapshots',
    'assessment_instruments',
    'assessment_results',
    'planner_blocks'
  )
order by tablename;
```

### 14. RLS policies for those tables

```sql
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
    'family_profiles',
    'parent_student_links',
    'learners',
    'family_programs',
    'learning_plan_items',
    'evidence_entries',
    'registration_cycles',
    'reporting_periods',
    'report_documents',
    'report_sections',
    'report_export_events',
    'authority_export_snapshots',
    'report_drafts',
    'student_profile_snapshots',
    'assessment_instruments',
    'assessment_results',
    'planner_blocks'
  )
order by tablename, policyname;
```

## Classification rules

### KEEP

- all `family_profiles` owned by real authenticated family users
- all `family_profile_children`
- all `students` linked through `family_profile_children`
- `family_programs` linked to a kept family profile or kept learner
- `learning_plan_items` linked to a kept family profile or kept learner
- `evidence_entries` linked to kept family learners or family users
- `report_export_events`, `report_documents`, `report_sections`, `reporting_periods`, `registration_cycles` linked to kept family learners/families
- storage objects in the private `evidence` bucket tied to kept family evidence

### DELETE CANDIDATES

Delete candidates only if they are both:

1. outside the family keep boundary
2. zero-dependency after inventory

Likely candidates:

- unlinked `students` rows with zero retained dependencies
- `planner_blocks` rows if they are legacy-only and not needed for family recovery
- school/classroom/teacher/intervention rows if present and not referenced by family data
- cohort/ranking/assessment rows if present and confirmed unused

### QUARANTINE / REVIEW

Quarantine instead of deleting when ownership or dependencies are unclear:

- any unlinked `students` row with dependent rows in evidence, plans, reports, exports, attendance, notifications, or curation
- `parent_student_links`
- `learners`
- `report_drafts`
- `authority_export_snapshots`
- `student_profile_snapshots`
- `assessment_instruments`
- `assessment_results`
- any table with ambiguous ownership or row counts that need manual inspection

## Draft purge SQL — not executed

```sql
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

-- Quarantine set for ambiguous rows
create temporary table tmp_students_to_quarantine (
  student_id text primary key,
  reason text
);

-- Pre-delete counts
select
  (select count(*) from tmp_family_students_to_keep) as keep_count,
  (select count(*) from tmp_unlinked_students) as delete_candidate_count,
  (select count(*) from tmp_students_to_quarantine) as quarantine_count;

-- Manual step:
-- run the generated dependency-count SQL from the inventory section
-- for every student_id/child_id/learner_id reference table.
-- Move any student with dependent rows into tmp_students_to_quarantine.

-- Example manual quarantine insertion pattern:
-- insert into tmp_students_to_quarantine (student_id, reason)
-- values ('<student-id>', 'dependent evidence/report rows');
--
-- delete from tmp_unlinked_students
-- where student_id in (select student_id from tmp_students_to_quarantine);

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

select
  (select count(*) from public.students) as students_after_delete,
  (select count(*) from tmp_unlinked_students) as attempted_delete_count,
  (select count(*) from tmp_students_to_quarantine) as quarantined_count;

rollback;
```

## Backup and export instructions

Before any destructive purge:

1. Export CSVs for:
   - `family_profiles`
   - `family_profile_children`
   - `students`
   - `family_programs`
   - `learning_plan_items`
   - `evidence_entries`
   - `report_export_events`
   - `registration_cycles`
   - `reporting_periods`
   - `report_documents`
   - `report_sections`
   - `parent_student_links`
   - `learners`
   - `planner_blocks`
   - `report_drafts`
   - `authority_export_snapshots`
   - `student_profile_snapshots`
   - `assessment_instruments`
   - `assessment_results`

2. In Supabase:
   - open Table Editor or SQL editor result grid
   - run the inventory queries
   - export each result set as CSV
   - for whole-table backups, use the dashboard export or `pg_dump` from a privileged environment

3. Preserve these IDs explicitly:
   - every `family_profiles.id`
   - every `family_profile_children.id`
   - every kept `students.id`
   - every kept report/evidence/program/calendar row linked to those kept learners/families

4. Confirm restore point:
   - verify CSV exports open correctly
   - verify row counts match the pre-delete counts
   - if using managed backups, confirm the backup timestamp is newer than the latest inventory run

5. Only replace `ROLLBACK` with `COMMIT` after:
   - dependency review is complete
   - keep/delete/quarantine IDs are manually approved
   - a fresh restore point is confirmed

## Repo-backed policy notes

From checked-in SQL:

- `family_profiles` RLS is defined
- `family_settings` RLS is defined
- `family_calendar_templates` RLS is defined
- `family_programs` RLS is defined
- `learning_plan_items` RLS is defined
- `evidence_entries` RLS is defined
- `report_export_events` RLS is defined
- homeschool compliance tables such as `homeschool_notifications` and `attendance_hour_logs` have RLS

Still unknown from checked-in SQL and must be verified live:

- `students`
- `family_profile_children`
- `parent_student_links`
- `learners`
- `registration_cycles`
- `reporting_periods`
- `report_documents`
- `report_sections`
- `report_drafts`
- `authority_export_snapshots`
- `student_profile_snapshots`
- `assessment_instruments`
- `assessment_results`
- `planner_blocks`

These unknowns are the main reason destructive cleanup should not start yet without a live privileged inventory run.
