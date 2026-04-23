create extension if not exists pgcrypto;

alter table if exists public.jurisdictions
  add column if not exists compliance_level text,
  add column if not exists compliance_ui_mode text,
  add column if not exists regulatory_family text,
  add column if not exists report_required boolean,
  add column if not exists requires_notification boolean,
  add column if not exists requires_notification_annual boolean,
  add column if not exists requires_attendance_tracking boolean,
  add column if not exists requires_instruction_hours boolean,
  add column if not exists required_instruction_hours_per_year numeric,
  add column if not exists required_instruction_days_per_year numeric,
  add column if not exists requires_subject_list boolean,
  add column if not exists requires_yearly_plan boolean,
  add column if not exists requires_quarterly_reports boolean,
  add column if not exists requires_annual_assessment boolean,
  add column if not exists requires_standardized_testing boolean,
  add column if not exists requires_professional_evaluation boolean,
  add column if not exists requires_portfolio boolean,
  add column if not exists requires_work_samples boolean,
  add column if not exists requires_parent_qualification_check boolean,
  add column if not exists requires_immunization_record_or_exemption boolean,
  add column if not exists requires_submission_to_authority boolean,
  add column if not exists export_should_be_blocked_when_incomplete boolean,
  add column if not exists allows_portfolio_instead_of_testing boolean,
  add column if not exists allows_evaluation_instead_of_testing boolean;

alter table if exists public.jurisdiction_rule_sets
  add column if not exists compliance_level text,
  add column if not exists compliance_ui_mode text,
  add column if not exists regulatory_family text,
  add column if not exists report_required boolean,
  add column if not exists requires_notification boolean,
  add column if not exists requires_notification_annual boolean,
  add column if not exists requires_attendance_tracking boolean,
  add column if not exists requires_instruction_hours boolean,
  add column if not exists required_instruction_hours_per_year numeric,
  add column if not exists required_instruction_days_per_year numeric,
  add column if not exists requires_subject_list boolean,
  add column if not exists requires_yearly_plan boolean,
  add column if not exists requires_quarterly_reports boolean,
  add column if not exists requires_annual_assessment boolean,
  add column if not exists requires_standardized_testing boolean,
  add column if not exists requires_professional_evaluation boolean,
  add column if not exists requires_portfolio boolean,
  add column if not exists requires_work_samples boolean,
  add column if not exists requires_parent_qualification_check boolean,
  add column if not exists requires_immunization_record_or_exemption boolean,
  add column if not exists requires_submission_to_authority boolean,
  add column if not exists export_should_be_blocked_when_incomplete boolean,
  add column if not exists allows_portfolio_instead_of_testing boolean,
  add column if not exists allows_evaluation_instead_of_testing boolean;

create table if not exists public.homeschool_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  family_id text null,
  learner_id text not null,
  jurisdiction_id text null,
  registration_cycle_id text null,
  notification_type text not null default 'annual_notice',
  due_date date null,
  submitted_at timestamptz null,
  authority_name text null,
  delivery_method text null,
  status text not null default 'draft',
  notes text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists homeschool_notifications_user_idx
  on public.homeschool_notifications (user_id, created_at desc);

create index if not exists homeschool_notifications_learner_idx
  on public.homeschool_notifications (learner_id, registration_cycle_id, created_at desc);

create index if not exists homeschool_notifications_jurisdiction_idx
  on public.homeschool_notifications (jurisdiction_id, created_at desc);

alter table public.homeschool_notifications enable row level security;

drop policy if exists "homeschool notifications read own" on public.homeschool_notifications;
create policy "homeschool notifications read own"
on public.homeschool_notifications
for select
to authenticated
using (auth.uid()::text = user_id);

drop policy if exists "homeschool notifications insert own" on public.homeschool_notifications;
create policy "homeschool notifications insert own"
on public.homeschool_notifications
for insert
to authenticated
with check (auth.uid()::text = user_id);

drop policy if exists "homeschool notifications update own" on public.homeschool_notifications;
create policy "homeschool notifications update own"
on public.homeschool_notifications
for update
to authenticated
using (auth.uid()::text = user_id)
with check (auth.uid()::text = user_id);

create table if not exists public.attendance_hour_logs (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  family_id text null,
  learner_id text not null,
  registration_cycle_id text null,
  recorded_date date not null,
  instructional_hours numeric(6,2) not null default 0,
  school_day boolean not null default true,
  notes text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists attendance_hour_logs_user_idx
  on public.attendance_hour_logs (user_id, created_at desc);

create index if not exists attendance_hour_logs_learner_idx
  on public.attendance_hour_logs (learner_id, registration_cycle_id, recorded_date desc);

create index if not exists attendance_hour_logs_cycle_idx
  on public.attendance_hour_logs (registration_cycle_id, recorded_date desc);

alter table public.attendance_hour_logs enable row level security;

drop policy if exists "attendance hour logs read own" on public.attendance_hour_logs;
create policy "attendance hour logs read own"
on public.attendance_hour_logs
for select
to authenticated
using (auth.uid()::text = user_id);

drop policy if exists "attendance hour logs insert own" on public.attendance_hour_logs;
create policy "attendance hour logs insert own"
on public.attendance_hour_logs
for insert
to authenticated
with check (auth.uid()::text = user_id);

drop policy if exists "attendance hour logs update own" on public.attendance_hour_logs;
create policy "attendance hour logs update own"
on public.attendance_hour_logs
for update
to authenticated
using (auth.uid()::text = user_id)
with check (auth.uid()::text = user_id);
