begin;

drop view if exists public.v_teacher_task_inbox_v2;

create view public.v_teacher_task_inbox_v2 as
select
  t.task_id,
  t.student_id,
  coalesce(s.preferred_name, s.first_name, 'Student') as student_name,
  s.class_id,
  c.name as class_name,
  t.title,
  t.details,
  t.priority_score,
  t.created_at,
  t.evidence_id,
  case
    when t.task_type = 'add_evidence' then '/students/' || t.student_id::text
    when t.task_type = 'review_evidence' and t.evidence_id is not null then '/admin/evidence/' || t.evidence_id::text
    when t.route_hint is not null then t.route_hint
    else '/students/' || t.student_id::text
  end as route_hint
from public.v_teacher_tasks t
join public.students s on s.id = t.student_id
left join public.classes c on c.id = s.class_id
join public.teacher_class_assignments tca
  on tca.class_id = s.class_id
 and tca.teacher_id = auth.uid();

commit;

-- Verification
select count(*) as inbox_rows from public.v_teacher_task_inbox_v2;

select task_id, student_name, class_name, title, priority_score, route_hint
from public.v_teacher_task_inbox_v2
order by priority_score desc
limit 20;

select count(*) as my_class_assignments
from public.teacher_class_assignments
where teacher_id = auth.uid();
