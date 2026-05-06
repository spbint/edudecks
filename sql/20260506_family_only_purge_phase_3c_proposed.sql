-- Proposed script only for family-only purge Phase 3C.
-- Do not execute blindly.
-- Defaults to ROLLBACK.
-- Requires full backup/export before any manual COMMIT.
-- Do not replace ROLLBACK with COMMIT until dependency counts and keep/quarantine
-- decisions have been reviewed and explicitly approved.
-- Views (including v_*) are never deleted from directly by this script.

begin;

create temp table tmp_family_students_to_keep (
  student_id text primary key
) on commit drop;

create temp table tmp_unlinked_students_all (
  student_id text primary key
) on commit drop;

create temp table tmp_students_to_quarantine (
  student_id text primary key,
  reason text not null default ''
) on commit drop;

create temp table tmp_students_delete_candidates (
  student_id text primary key
) on commit drop;

create temp table tmp_delete_audit (
  table_name text primary key,
  rows_deleted bigint not null default 0
) on commit drop;

create temp table tmp_inventory_before (
  total_students_before bigint not null,
  family_linked_keep_count bigint not null,
  unlinked_total_count bigint not null
) on commit drop;

create or replace function pg_temp.base_table_exists(p_schema text, p_table text)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from information_schema.tables
    where table_schema = p_schema
      and table_name = p_table
      and table_type = 'BASE TABLE'
  );
$$;

create or replace function pg_temp.column_exists(p_schema text, p_table text, p_column text)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from information_schema.columns
    where table_schema = p_schema
      and table_name = p_table
      and column_name = p_column
  );
$$;

create or replace function pg_temp.quarantine_from_column(
  p_table_name text,
  p_column_name text,
  p_reason text
)
returns void
language plpgsql
as $$
begin
  if pg_temp.base_table_exists('public', p_table_name)
     and pg_temp.column_exists('public', p_table_name, p_column_name) then
    execute format(
      $sql$
        insert into tmp_students_to_quarantine (student_id, reason)
        select distinct u.student_id, %L
        from tmp_unlinked_students_all u
        join public.%I t
          on t.%I::text = u.student_id
        on conflict (student_id) do update
        set reason = case
          when tmp_students_to_quarantine.reason is null or tmp_students_to_quarantine.reason = '' then excluded.reason
          when position(excluded.reason in tmp_students_to_quarantine.reason) > 0 then tmp_students_to_quarantine.reason
          else tmp_students_to_quarantine.reason || '; ' || excluded.reason
        end
      $sql$,
      p_reason,
      p_table_name,
      p_column_name
    );
  end if;
end;
$$;

create or replace function pg_temp.quarantine_from_report_sections()
returns void
language plpgsql
as $$
declare
  candidate_column text;
begin
  if not pg_temp.base_table_exists('public', 'report_sections') then
    return;
  end if;

  if not pg_temp.base_table_exists('public', 'report_documents') then
    return;
  end if;

  if not pg_temp.column_exists('public', 'report_sections', 'report_document_id') then
    return;
  end if;

  if not pg_temp.column_exists('public', 'report_documents', 'id') then
    return;
  end if;

  foreach candidate_column in array array['learner_id', 'student_id', 'child_id']
  loop
    if pg_temp.column_exists('public', 'report_documents', candidate_column) then
      execute format(
        $sql$
          insert into tmp_students_to_quarantine (student_id, reason)
          select distinct u.student_id, %L
          from tmp_unlinked_students_all u
          join public.report_documents rd
            on rd.%I::text = u.student_id
          join public.report_sections rs
            on rs.report_document_id::text = rd.id::text
          on conflict (student_id) do update
          set reason = case
            when tmp_students_to_quarantine.reason is null or tmp_students_to_quarantine.reason = '' then excluded.reason
            when position(excluded.reason in tmp_students_to_quarantine.reason) > 0 then tmp_students_to_quarantine.reason
            else tmp_students_to_quarantine.reason || '; ' || excluded.reason
          end
        $sql$,
        'public.report_sections via public.report_documents.' || candidate_column,
        candidate_column
      );
    end if;
  end loop;
end;
$$;

create or replace function pg_temp.delete_from_column(
  p_table_name text,
  p_column_name text
)
returns void
language plpgsql
as $$
declare
  rows_deleted bigint := 0;
begin
  if pg_temp.base_table_exists('public', p_table_name)
     and pg_temp.column_exists('public', p_table_name, p_column_name) then
    execute format(
      'delete from public.%I where %I::text in (select student_id from tmp_students_delete_candidates)',
      p_table_name,
      p_column_name
    );

    get diagnostics rows_deleted = row_count;

    insert into tmp_delete_audit (table_name, rows_deleted)
    values ('public.' || p_table_name, rows_deleted)
    on conflict (table_name) do update
      set rows_deleted = tmp_delete_audit.rows_deleted + excluded.rows_deleted;
  end if;
end;
$$;

-- Keep set: all students linked through family_profile_children.
insert into tmp_family_students_to_keep (student_id)
select distinct fpc.child_id::text
from public.family_profile_children fpc
where fpc.child_id is not null
on conflict do nothing;

-- Unlinked set: students not linked through family_profile_children.
insert into tmp_unlinked_students_all (student_id)
select s.id::text
from public.students s
left join tmp_family_students_to_keep keepers
  on keepers.student_id = s.id::text
where keepers.student_id is null
on conflict do nothing;

insert into tmp_inventory_before (
  total_students_before,
  family_linked_keep_count,
  unlinked_total_count
)
select
  (select count(*) from public.students) as total_students_before,
  (select count(*) from tmp_family_students_to_keep) as family_linked_keep_count,
  (select count(*) from tmp_unlinked_students_all) as unlinked_total_count;

-- Quarantine rules for retained family/product tables.
select pg_temp.quarantine_from_column('evidence_entries', 'student_id', 'public.evidence_entries.student_id');
select pg_temp.quarantine_from_column('learning_plan_items', 'student_id', 'public.learning_plan_items.student_id');
select pg_temp.quarantine_from_column('family_programs', 'learner_id', 'public.family_programs.learner_id');
select pg_temp.quarantine_from_column('registration_cycles', 'learner_id', 'public.registration_cycles.learner_id');
select pg_temp.quarantine_from_column('reporting_periods', 'learner_id', 'public.reporting_periods.learner_id');

-- Report documents are only usable as a quarantine signal when they carry a direct
-- learner/student/child column. Family-only columns are not sufficient to identify
-- a specific unlinked student safely.
select pg_temp.quarantine_from_column('report_documents', 'learner_id', 'public.report_documents.learner_id');
select pg_temp.quarantine_from_column('report_documents', 'student_id', 'public.report_documents.student_id');
select pg_temp.quarantine_from_column('report_documents', 'child_id', 'public.report_documents.child_id');
select pg_temp.quarantine_from_report_sections();

select pg_temp.quarantine_from_column('report_drafts', 'student_id', 'public.report_drafts.student_id');
select pg_temp.quarantine_from_column('report_drafts', 'child_id', 'public.report_drafts.child_id');
select pg_temp.quarantine_from_column('report_presets', 'student_id', 'public.report_presets.student_id');
select pg_temp.quarantine_from_column('evidence_items', 'learner_id', 'public.evidence_items.learner_id');
select pg_temp.quarantine_from_column('evidence', 'student_id', 'public.evidence.student_id');
select pg_temp.quarantine_from_column('learning_experiences', 'learner_id', 'public.learning_experiences.learner_id');
select pg_temp.quarantine_from_column('learning_plans', 'learner_id', 'public.learning_plans.learner_id');
select pg_temp.quarantine_from_column('learner_settings', 'learner_id', 'public.learner_settings.learner_id');
select pg_temp.quarantine_from_column('learner_framework_targets', 'learner_id', 'public.learner_framework_targets.learner_id');
select pg_temp.quarantine_from_column('homeschool_attendance_days', 'learner_id', 'public.homeschool_attendance_days.learner_id');
select pg_temp.quarantine_from_column('homeschool_attendance_summaries', 'learner_id', 'public.homeschool_attendance_summaries.learner_id');
select pg_temp.quarantine_from_column('homeschool_instruction_subject_logs', 'learner_id', 'public.homeschool_instruction_subject_logs.learner_id');
select pg_temp.quarantine_from_column('homeschool_notifications', 'learner_id', 'public.homeschool_notifications.learner_id');
select pg_temp.quarantine_from_column('portfolio_share_links', 'student_id', 'public.portfolio_share_links.student_id');
select pg_temp.quarantine_from_column('student_evidence_curation', 'student_id', 'public.student_evidence_curation.student_id');
select pg_temp.quarantine_from_column('student_goals', 'student_id', 'public.student_goals.student_id');
select pg_temp.quarantine_from_column('student_notes', 'student_id', 'public.student_notes.student_id');
select pg_temp.quarantine_from_column('student_portfolio_notes', 'student_id', 'public.student_portfolio_notes.student_id');

-- Delete candidates: unlinked students not moved into quarantine.
insert into tmp_students_delete_candidates (student_id)
select u.student_id
from tmp_unlinked_students_all u
left join tmp_students_to_quarantine q
  on q.student_id = u.student_id
where q.student_id is null
on conflict do nothing;

-- Pre-delete counts.
select
  ib.total_students_before,
  ib.family_linked_keep_count,
  ib.unlinked_total_count,
  (select count(*) from tmp_students_to_quarantine) as quarantine_count,
  (select count(*) from tmp_students_delete_candidates) as delete_candidate_count
from tmp_inventory_before ib;

-- Delete order for clearly school/demo/legacy dependent rows only.
-- Every statement is guarded so missing tables/columns do not fail the script.
select pg_temp.delete_from_column('parent_student_links', 'student_id');
select pg_temp.delete_from_column('planner_blocks', 'student_id');
select pg_temp.delete_from_column('assessment_results', 'student_id');
select pg_temp.delete_from_column('assessment_records', 'learner_id');
select pg_temp.delete_from_column('attribute_ratings', 'student_id');
select pg_temp.delete_from_column('attribute_state_history', 'student_id');
select pg_temp.delete_from_column('attribute_state_points', 'student_id');
select pg_temp.delete_from_column('attribute_states', 'student_id');
select pg_temp.delete_from_column('intervention_attribute_snapshots', 'student_id');
select pg_temp.delete_from_column('intervention_students', 'student_id');
select pg_temp.delete_from_column('interventions', 'student_id');
select pg_temp.delete_from_column('student_attribute_states', 'student_id');
select pg_temp.delete_from_column('student_attribute_trend_points', 'student_id');
select pg_temp.delete_from_column('student_domain_status', 'student_id');
select pg_temp.delete_from_column('student_intervention_plans', 'student_id');
select pg_temp.delete_from_column('student_learning_tendencies', 'student_id');
select pg_temp.delete_from_column('student_profile_snapshots', 'student_id');
select pg_temp.delete_from_column('support_actions', 'learner_id');
select pg_temp.delete_from_column('teacher_actions', 'student_id');
select pg_temp.delete_from_column('teacher_notes', 'student_id');
select pg_temp.delete_from_column('concerns', 'learner_id');
select pg_temp.delete_from_column('curriculum_exemptions', 'learner_id');
select pg_temp.delete_from_column('progress_judgements', 'learner_id');
select pg_temp.delete_from_column('reviews', 'learner_id');

-- Delete students only for remaining zero-dependency delete candidates.
do $$
declare
  rows_deleted bigint := 0;
begin
  if pg_temp.base_table_exists('public', 'students')
     and pg_temp.column_exists('public', 'students', 'id') then
    execute 'delete from public.students where id::text in (select student_id from tmp_students_delete_candidates)';
    get diagnostics rows_deleted = row_count;

    insert into tmp_delete_audit (table_name, rows_deleted)
    values ('public.students', rows_deleted)
    on conflict (table_name) do update
      set rows_deleted = tmp_delete_audit.rows_deleted + excluded.rows_deleted;
  end if;
end;
$$;

-- Post-delete counts.
select
  ib.total_students_before,
  (select count(*) from public.students) as total_students_after,
  ib.family_linked_keep_count,
  ib.unlinked_total_count,
  (select count(*) from tmp_students_to_quarantine) as quarantine_count,
  (select count(*) from tmp_students_delete_candidates) as delete_candidate_count
from tmp_inventory_before ib;

select
  table_name,
  rows_deleted
from tmp_delete_audit
order by table_name;

-- Optional review output before manual approval.
select
  student_id,
  reason
from tmp_students_to_quarantine
order by student_id;

-- COMMIT; -- Replace ROLLBACK with COMMIT only after explicit manual approval.
rollback;
