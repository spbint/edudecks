drop table if exists tmp_us_state_seed;
create temporary table tmp_us_state_seed (
  code text primary key,
  name text not null,
  compliance_level text not null
) on commit drop;

insert into tmp_us_state_seed (code, name, compliance_level) values
  ('US-AL', 'Alabama', 'low'),
  ('US-AK', 'Alaska', 'low'),
  ('US-AZ', 'Arizona', 'low'),
  ('US-AR', 'Arkansas', 'low'),
  ('US-CA', 'California', 'moderate'),
  ('US-CO', 'Colorado', 'moderate'),
  ('US-CT', 'Connecticut', 'moderate'),
  ('US-DE', 'Delaware', 'moderate'),
  ('US-FL', 'Florida', 'moderate'),
  ('US-GA', 'Georgia', 'moderate'),
  ('US-HI', 'Hawaii', 'moderate'),
  ('US-ID', 'Idaho', 'low'),
  ('US-IL', 'Illinois', 'low'),
  ('US-IN', 'Indiana', 'low'),
  ('US-IA', 'Iowa', 'moderate'),
  ('US-KS', 'Kansas', 'moderate'),
  ('US-KY', 'Kentucky', 'low'),
  ('US-LA', 'Louisiana', 'low'),
  ('US-ME', 'Maine', 'moderate'),
  ('US-MD', 'Maryland', 'moderate'),
  ('US-MA', 'Massachusetts', 'high'),
  ('US-MI', 'Michigan', 'moderate'),
  ('US-MN', 'Minnesota', 'moderate'),
  ('US-MS', 'Mississippi', 'low'),
  ('US-MO', 'Missouri', 'moderate'),
  ('US-MT', 'Montana', 'low'),
  ('US-NE', 'Nebraska', 'moderate'),
  ('US-NV', 'Nevada', 'low'),
  ('US-NH', 'New Hampshire', 'low'),
  ('US-NJ', 'New Jersey', 'moderate'),
  ('US-NM', 'New Mexico', 'moderate'),
  ('US-NY', 'New York', 'high'),
  ('US-NC', 'North Carolina', 'moderate'),
  ('US-ND', 'North Dakota', 'low'),
  ('US-OH', 'Ohio', 'moderate'),
  ('US-OK', 'Oklahoma', 'low'),
  ('US-OR', 'Oregon', 'moderate'),
  ('US-PA', 'Pennsylvania', 'high'),
  ('US-RI', 'Rhode Island', 'high'),
  ('US-SC', 'South Carolina', 'moderate'),
  ('US-SD', 'South Dakota', 'low'),
  ('US-TN', 'Tennessee', 'moderate'),
  ('US-TX', 'Texas', 'low'),
  ('US-UT', 'Utah', 'low'),
  ('US-VT', 'Vermont', 'low'),
  ('US-VA', 'Virginia', 'moderate'),
  ('US-WA', 'Washington', 'moderate'),
  ('US-WV', 'West Virginia', 'moderate'),
  ('US-WI', 'Wisconsin', 'moderate'),
  ('US-WY', 'Wyoming', 'low');

drop table if exists tmp_us_artifact_templates;
create temporary table tmp_us_artifact_templates (
  compliance_level text not null,
  artifact_type text not null,
  code text not null,
  label text not null,
  short_note text not null,
  required_frequency text not null,
  frequency text not null,
  display_order integer not null
) on commit drop;

insert into tmp_us_artifact_templates (
  compliance_level,
  artifact_type,
  code,
  label,
  short_note,
  required_frequency,
  frequency,
  display_order
) values
  ('high', 'notification', 'notice_of_intent', 'Notice of intent', 'Formal notice, filing, or registration step for the current cycle.', 'Annual', 'Annual', 1),
  ('high', 'attendance', 'attendance_record', 'Attendance record', 'Running record of school days or attendance entries.', 'Weekly', 'Weekly', 2),
  ('high', 'attendance', 'instruction_hours', 'Instructional hours', 'Hours or days expected by the jurisdiction.', 'Weekly', 'Weekly', 3),
  ('high', 'plan', 'subject_list', 'Subject list', 'Current subject coverage for the learner.', 'Per cycle', 'Per cycle', 4),
  ('high', 'plan', 'yearly_plan', 'Yearly plan', 'Yearly learning outline for the current cycle.', 'Annual', 'Annual', 5),
  ('high', 'report', 'quarterly_report', 'Quarterly report', 'Periodic report or update required by the state.', 'Quarterly', 'Quarterly', 6),
  ('high', 'assessment', 'annual_assessment', 'Annual assessment', 'Annual testing, evaluation, or review record.', 'Annual', 'Annual', 7),
  ('high', 'portfolio', 'portfolio_record', 'Portfolio record', 'Work samples and supporting portfolio material.', 'Ongoing', 'Ongoing', 8),
  ('moderate', 'notification', 'annual_notice', 'Annual notice', 'Notice or filing step for the current cycle.', 'Annual', 'Annual', 1),
  ('moderate', 'attendance', 'attendance_record', 'Attendance record', 'Attendance or instructional hours for the current cycle.', 'Weekly', 'Weekly', 2),
  ('moderate', 'plan', 'subject_list', 'Subject list', 'Subjects and learning areas being covered.', 'Per cycle', 'Per cycle', 3),
  ('moderate', 'plan', 'yearly_plan', 'Yearly plan', 'Learning plan or program outline for the cycle.', 'Annual', 'Annual', 4),
  ('moderate', 'assessment', 'annual_assessment', 'Annual assessment', 'Evaluation, testing, or annual review record.', 'Annual', 'Annual', 5),
  ('moderate', 'portfolio', 'portfolio_record', 'Portfolio record', 'Representative work samples and portfolio notes.', 'Ongoing', 'Ongoing', 6),
  ('low', 'portfolio', 'portfolio_record', 'Portfolio record', 'Core portfolio evidence that keeps the learning story visible.', 'Ongoing', 'Ongoing', 1),
  ('low', 'evidence', 'work_samples', 'Work samples', 'Representative samples that keep the documentation grounded.', 'Ongoing', 'Ongoing', 2),
  ('low', 'evidence', 'learning_log', 'Learning log', 'Running record of learning activity.', 'Ongoing', 'Ongoing', 3),
  ('low', 'plan', 'subject_list', 'Subject list', 'Simple subject coverage notes for family records.', 'Per cycle', 'Per cycle', 4);

with prepared as (
  select
    code,
    name,
    'US'::text as country_code,
    split_part(code, '-', 2) as state_code,
    compliance_level,
    case compliance_level
      when 'high' then 'strict'
      when 'moderate' then 'guided'
      else 'portfolio'
    end as compliance_ui_mode,
    'us_homeschool'::text as regulatory_family,
    case when compliance_level = 'low' then false else true end as report_required,
    case when compliance_level = 'low' then false else true end as requires_notification,
    case when compliance_level = 'low' then false else true end as requires_notification_annual,
    case when compliance_level = 'low' then false else true end as requires_attendance_tracking,
    case when compliance_level = 'low' then false else true end as requires_instruction_hours,
    case
      when code = 'US-PA' then 900
      when code in ('US-CA', 'US-FL', 'US-NY', 'US-NJ', 'US-VA', 'US-WI') then 180
      else null
    end as required_instruction_hours_per_year,
    case when compliance_level = 'low' then null else 180 end as required_instruction_days_per_year,
    case when compliance_level = 'low' then false else true end as requires_subject_list,
    case when compliance_level = 'low' then false else true end as requires_yearly_plan,
    case when compliance_level = 'high' then true else false end as requires_quarterly_reports,
    case when compliance_level = 'low' then false else true end as requires_annual_assessment,
    case when code in ('US-CA', 'US-FL', 'US-OR', 'US-WA', 'US-NY', 'US-PA') then true else false end as requires_standardized_testing,
    case when code in ('US-FL', 'US-WA', 'US-NY', 'US-PA') then true else false end as requires_professional_evaluation,
    true as requires_portfolio,
    true as requires_work_samples,
    case when code in ('US-NY', 'US-PA') then true else false end as requires_parent_qualification_check,
    case when code in ('US-NY', 'US-PA', 'US-FL', 'US-GA', 'US-VA') then true else false end as requires_immunization_record_or_exemption,
    case when compliance_level = 'low' then false else true end as requires_submission_to_authority,
    case when compliance_level = 'low' then false else true end as export_should_be_blocked_when_incomplete,
    true as allows_portfolio_instead_of_testing,
    true as allows_evaluation_instead_of_testing
  from tmp_us_state_seed
)
insert into public.jurisdictions (
  code,
  name,
  label,
  country_code,
  state_code,
  compliance_level,
  compliance_ui_mode,
  regulatory_family,
  report_required,
  requires_notification,
  requires_notification_annual,
  requires_attendance_tracking,
  requires_instruction_hours,
  required_instruction_hours_per_year,
  required_instruction_days_per_year,
  requires_subject_list,
  requires_yearly_plan,
  requires_quarterly_reports,
  requires_annual_assessment,
  requires_standardized_testing,
  requires_professional_evaluation,
  requires_portfolio,
  requires_work_samples,
  requires_parent_qualification_check,
  requires_immunization_record_or_exemption,
  requires_submission_to_authority,
  export_should_be_blocked_when_incomplete,
  allows_portfolio_instead_of_testing,
  allows_evaluation_instead_of_testing
)
select
  code,
  name,
  name,
  country_code,
  state_code,
  compliance_level,
  compliance_ui_mode,
  regulatory_family,
  report_required,
  requires_notification,
  requires_notification_annual,
  requires_attendance_tracking,
  requires_instruction_hours,
  required_instruction_hours_per_year,
  required_instruction_days_per_year,
  requires_subject_list,
  requires_yearly_plan,
  requires_quarterly_reports,
  requires_annual_assessment,
  requires_standardized_testing,
  requires_professional_evaluation,
  requires_portfolio,
  requires_work_samples,
  requires_parent_qualification_check,
  requires_immunization_record_or_exemption,
  requires_submission_to_authority,
  export_should_be_blocked_when_incomplete,
  allows_portfolio_instead_of_testing,
  allows_evaluation_instead_of_testing
from prepared
where not exists (
  select 1
  from public.jurisdictions existing
  where existing.code = prepared.code
);

with prepared as (
  select
    code,
    name,
    'US'::text as country_code,
    split_part(code, '-', 2) as state_code,
    compliance_level,
    case compliance_level
      when 'high' then 'strict'
      when 'moderate' then 'guided'
      else 'portfolio'
    end as compliance_ui_mode,
    'us_homeschool'::text as regulatory_family,
    case when compliance_level = 'low' then false else true end as report_required,
    case when compliance_level = 'low' then false else true end as requires_notification,
    case when compliance_level = 'low' then false else true end as requires_notification_annual,
    case when compliance_level = 'low' then false else true end as requires_attendance_tracking,
    case when compliance_level = 'low' then false else true end as requires_instruction_hours,
    case
      when code = 'US-PA' then 900
      when code in ('US-CA', 'US-FL', 'US-NY', 'US-NJ', 'US-VA', 'US-WI') then 180
      else null
    end as required_instruction_hours_per_year,
    case when compliance_level = 'low' then null else 180 end as required_instruction_days_per_year,
    case when compliance_level = 'low' then false else true end as requires_subject_list,
    case when compliance_level = 'low' then false else true end as requires_yearly_plan,
    case when compliance_level = 'high' then true else false end as requires_quarterly_reports,
    case when compliance_level = 'low' then false else true end as requires_annual_assessment,
    case when code in ('US-CA', 'US-FL', 'US-OR', 'US-WA', 'US-NY', 'US-PA') then true else false end as requires_standardized_testing,
    case when code in ('US-FL', 'US-WA', 'US-NY', 'US-PA') then true else false end as requires_professional_evaluation,
    true as requires_portfolio,
    true as requires_work_samples,
    case when code in ('US-NY', 'US-PA') then true else false end as requires_parent_qualification_check,
    case when code in ('US-NY', 'US-PA', 'US-FL', 'US-GA', 'US-VA') then true else false end as requires_immunization_record_or_exemption,
    case when compliance_level = 'low' then false else true end as requires_submission_to_authority,
    case when compliance_level = 'low' then false else true end as export_should_be_blocked_when_incomplete,
    true as allows_portfolio_instead_of_testing,
    true as allows_evaluation_instead_of_testing
  from tmp_us_state_seed
)
update public.jurisdictions jurisdiction
set
  name = prepared.name,
  label = prepared.name,
  country_code = prepared.country_code,
  state_code = prepared.state_code,
  compliance_level = prepared.compliance_level,
  compliance_ui_mode = prepared.compliance_ui_mode,
  regulatory_family = prepared.regulatory_family,
  report_required = prepared.report_required,
  requires_notification = prepared.requires_notification,
  requires_notification_annual = prepared.requires_notification_annual,
  requires_attendance_tracking = prepared.requires_attendance_tracking,
  requires_instruction_hours = prepared.requires_instruction_hours,
  required_instruction_hours_per_year = prepared.required_instruction_hours_per_year,
  required_instruction_days_per_year = prepared.required_instruction_days_per_year,
  requires_subject_list = prepared.requires_subject_list,
  requires_yearly_plan = prepared.requires_yearly_plan,
  requires_quarterly_reports = prepared.requires_quarterly_reports,
  requires_annual_assessment = prepared.requires_annual_assessment,
  requires_standardized_testing = prepared.requires_standardized_testing,
  requires_professional_evaluation = prepared.requires_professional_evaluation,
  requires_portfolio = prepared.requires_portfolio,
  requires_work_samples = prepared.requires_work_samples,
  requires_parent_qualification_check = prepared.requires_parent_qualification_check,
  requires_immunization_record_or_exemption = prepared.requires_immunization_record_or_exemption,
  requires_submission_to_authority = prepared.requires_submission_to_authority,
  export_should_be_blocked_when_incomplete = prepared.export_should_be_blocked_when_incomplete,
  allows_portfolio_instead_of_testing = prepared.allows_portfolio_instead_of_testing,
  allows_evaluation_instead_of_testing = prepared.allows_evaluation_instead_of_testing
from prepared
where jurisdiction.code = prepared.code;

with state_rules as (
  select
    rule_set.id as jurisdiction_id,
    rule_set.code as jurisdiction_code,
    seed.name,
    seed.compliance_level,
    case seed.compliance_level
      when 'high' then 'strict'
      when 'moderate' then 'guided'
      else 'portfolio'
    end as compliance_ui_mode,
    'us_homeschool'::text as regulatory_family,
    case when seed.compliance_level = 'low' then false else true end as report_required,
    case when seed.compliance_level = 'low' then false else true end as requires_notification,
    case when seed.compliance_level = 'low' then false else true end as requires_notification_annual,
    case when seed.compliance_level = 'low' then false else true end as requires_attendance_tracking,
    case when seed.compliance_level = 'low' then false else true end as requires_instruction_hours,
    case
      when seed.code = 'US-PA' then 900
      when seed.code in ('US-CA', 'US-FL', 'US-NY', 'US-NJ', 'US-VA', 'US-WI') then 180
      else null
    end as required_instruction_hours_per_year,
    case when seed.compliance_level = 'low' then null else 180 end as required_instruction_days_per_year,
    case when seed.compliance_level = 'low' then false else true end as requires_subject_list,
    case when seed.compliance_level = 'low' then false else true end as requires_yearly_plan,
    case when seed.compliance_level = 'high' then true else false end as requires_quarterly_reports,
    case when seed.compliance_level = 'low' then false else true end as requires_annual_assessment,
    case when seed.code in ('US-CA', 'US-FL', 'US-OR', 'US-WA', 'US-NY', 'US-PA') then true else false end as requires_standardized_testing,
    case when seed.code in ('US-FL', 'US-WA', 'US-NY', 'US-PA') then true else false end as requires_professional_evaluation,
    true as requires_portfolio,
    true as requires_work_samples,
    case when seed.code in ('US-NY', 'US-PA') then true else false end as requires_parent_qualification_check,
    case when seed.code in ('US-NY', 'US-PA', 'US-FL', 'US-GA', 'US-VA') then true else false end as requires_immunization_record_or_exemption,
    case when seed.compliance_level = 'low' then false else true end as requires_submission_to_authority,
    case when seed.compliance_level = 'low' then false else true end as export_should_be_blocked_when_incomplete,
    true as allows_portfolio_instead_of_testing,
    true as allows_evaluation_instead_of_testing
  from public.jurisdiction_rule_sets rule_set
  join tmp_us_state_seed seed on seed.code = rule_set.code
)
insert into public.jurisdiction_rule_sets (
  jurisdiction_id,
  jurisdiction_code,
  status,
  name,
  title,
  effective_from,
  compliance_level,
  compliance_ui_mode,
  regulatory_family,
  report_required,
  requires_notification,
  requires_notification_annual,
  requires_attendance_tracking,
  requires_instruction_hours,
  required_instruction_hours_per_year,
  required_instruction_days_per_year,
  requires_subject_list,
  requires_yearly_plan,
  requires_quarterly_reports,
  requires_annual_assessment,
  requires_standardized_testing,
  requires_professional_evaluation,
  requires_portfolio,
  requires_work_samples,
  requires_parent_qualification_check,
  requires_immunization_record_or_exemption,
  requires_submission_to_authority,
  export_should_be_blocked_when_incomplete,
  allows_portfolio_instead_of_testing,
  allows_evaluation_instead_of_testing
)
select
  jurisdiction_id,
  jurisdiction_code,
  'active'::text,
  'US homeschool rules - ' || name,
  'US homeschool rules - ' || name,
  current_date,
  compliance_level,
  compliance_ui_mode,
  regulatory_family,
  report_required,
  requires_notification,
  requires_notification_annual,
  requires_attendance_tracking,
  requires_instruction_hours,
  required_instruction_hours_per_year,
  required_instruction_days_per_year,
  requires_subject_list,
  requires_yearly_plan,
  requires_quarterly_reports,
  requires_annual_assessment,
  requires_standardized_testing,
  requires_professional_evaluation,
  requires_portfolio,
  requires_work_samples,
  requires_parent_qualification_check,
  requires_immunization_record_or_exemption,
  requires_submission_to_authority,
  export_should_be_blocked_when_incomplete,
  allows_portfolio_instead_of_testing,
  allows_evaluation_instead_of_testing
from state_rules
where not exists (
  select 1
  from public.jurisdiction_rule_sets existing
  where existing.jurisdiction_code = state_rules.jurisdiction_code
);

with state_rules as (
  select
    rule_set.id as jurisdiction_id,
    rule_set.code as jurisdiction_code,
    seed.name,
    seed.compliance_level,
    case seed.compliance_level
      when 'high' then 'strict'
      when 'moderate' then 'guided'
      else 'portfolio'
    end as compliance_ui_mode,
    'us_homeschool'::text as regulatory_family,
    case when seed.compliance_level = 'low' then false else true end as report_required,
    case when seed.compliance_level = 'low' then false else true end as requires_notification,
    case when seed.compliance_level = 'low' then false else true end as requires_notification_annual,
    case when seed.compliance_level = 'low' then false else true end as requires_attendance_tracking,
    case when seed.compliance_level = 'low' then false else true end as requires_instruction_hours,
    case
      when seed.code = 'US-PA' then 900
      when seed.code in ('US-CA', 'US-FL', 'US-NY', 'US-NJ', 'US-VA', 'US-WI') then 180
      else null
    end as required_instruction_hours_per_year,
    case when seed.compliance_level = 'low' then null else 180 end as required_instruction_days_per_year,
    case when seed.compliance_level = 'low' then false else true end as requires_subject_list,
    case when seed.compliance_level = 'low' then false else true end as requires_yearly_plan,
    case when seed.compliance_level = 'high' then true else false end as requires_quarterly_reports,
    case when seed.compliance_level = 'low' then false else true end as requires_annual_assessment,
    case when seed.code in ('US-CA', 'US-FL', 'US-OR', 'US-WA', 'US-NY', 'US-PA') then true else false end as requires_standardized_testing,
    case when seed.code in ('US-FL', 'US-WA', 'US-NY', 'US-PA') then true else false end as requires_professional_evaluation,
    true as requires_portfolio,
    true as requires_work_samples,
    case when seed.code in ('US-NY', 'US-PA') then true else false end as requires_parent_qualification_check,
    case when seed.code in ('US-NY', 'US-PA', 'US-FL', 'US-GA', 'US-VA') then true else false end as requires_immunization_record_or_exemption,
    case when seed.compliance_level = 'low' then false else true end as requires_submission_to_authority,
    case when seed.compliance_level = 'low' then false else true end as export_should_be_blocked_when_incomplete,
    true as allows_portfolio_instead_of_testing,
    true as allows_evaluation_instead_of_testing
  from public.jurisdiction_rule_sets rule_set
  join tmp_us_state_seed seed on seed.code = rule_set.code
)
update public.jurisdiction_rule_sets rule_set
set
  name = 'US homeschool rules - ' || state_rules.name,
  title = 'US homeschool rules - ' || state_rules.name,
  status = 'active',
  effective_from = coalesce(rule_set.effective_from, current_date),
  compliance_level = state_rules.compliance_level,
  compliance_ui_mode = state_rules.compliance_ui_mode,
  regulatory_family = state_rules.regulatory_family,
  report_required = state_rules.report_required,
  requires_notification = state_rules.requires_notification,
  requires_notification_annual = state_rules.requires_notification_annual,
  requires_attendance_tracking = state_rules.requires_attendance_tracking,
  requires_instruction_hours = state_rules.requires_instruction_hours,
  required_instruction_hours_per_year = state_rules.required_instruction_hours_per_year,
  required_instruction_days_per_year = state_rules.required_instruction_days_per_year,
  requires_subject_list = state_rules.requires_subject_list,
  requires_yearly_plan = state_rules.requires_yearly_plan,
  requires_quarterly_reports = state_rules.requires_quarterly_reports,
  requires_annual_assessment = state_rules.requires_annual_assessment,
  requires_standardized_testing = state_rules.requires_standardized_testing,
  requires_professional_evaluation = state_rules.requires_professional_evaluation,
  requires_portfolio = state_rules.requires_portfolio,
  requires_work_samples = state_rules.requires_work_samples,
  requires_parent_qualification_check = state_rules.requires_parent_qualification_check,
  requires_immunization_record_or_exemption = state_rules.requires_immunization_record_or_exemption,
  requires_submission_to_authority = state_rules.requires_submission_to_authority,
  export_should_be_blocked_when_incomplete = state_rules.export_should_be_blocked_when_incomplete,
  allows_portfolio_instead_of_testing = state_rules.allows_portfolio_instead_of_testing,
  allows_evaluation_instead_of_testing = state_rules.allows_evaluation_instead_of_testing
from state_rules
where rule_set.jurisdiction_code = state_rules.jurisdiction_code;

with state_rules as (
  select
    rule_set.id as rule_set_id,
    rule_set.jurisdiction_code,
    seed.name,
    seed.compliance_level
  from public.jurisdiction_rule_sets rule_set
  join tmp_us_state_seed seed on seed.code = rule_set.jurisdiction_code
)
insert into public.jurisdiction_required_artifacts (
  rule_set_id,
  jurisdiction_rule_set_id,
  artifact_type,
  code,
  slug,
  label,
  name,
  short_note,
  note,
  required_frequency,
  frequency,
  display_order
)
select
  state_rules.rule_set_id,
  state_rules.rule_set_id,
  template.artifact_type,
  state_rules.jurisdiction_code || '_' || template.code,
  state_rules.jurisdiction_code || '_' || template.code,
  template.label,
  template.label,
  template.short_note,
  template.short_note,
  template.required_frequency,
  template.frequency,
  template.display_order
from state_rules
join tmp_us_artifact_templates template
  on template.compliance_level = state_rules.compliance_level
where not exists (
  select 1
  from public.jurisdiction_required_artifacts existing
  where existing.rule_set_id = state_rules.rule_set_id
    and existing.code = state_rules.jurisdiction_code || '_' || template.code
);
