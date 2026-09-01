-- Priority 5B.1A: Terms are teaching periods; only actual breaks suppress
-- Master Week materialisation. Repair the historical inverted term rows, then
-- release only unprotected future Program reservations outside teaching periods.

update public.learning_periods
set is_break = false
where period_type = 'term'
  and is_break = true;

update public.learning_periods
set is_break = true
where period_type = 'break'
  and is_break = false;

alter table public.learning_periods
  add constraint learning_periods_type_break_semantics_check
  check (
    (period_type <> 'break' or is_break = true)
    and (period_type not in ('term', 'semester', 'unit') or is_break = false)
  );

delete from public.calendar_items item
using public.program_occurrences occurrence
where occurrence.calendar_item_id = item.id
  and item.source_type = 'generated'
  and item.completed_at is null
  and item.planned_date >= current_date
  and not exists (
    select 1
    from public.evidence_entries evidence
    where evidence.calendar_item_id = item.id
  )
  and not exists (
    select 1
    from public.learning_periods period
    where period.family_id = item.family_id
      and period.starts_on <= item.planned_date
      and period.ends_on >= item.planned_date
      and period.period_type <> 'break'
      and period.is_break = false
  );
