-- Clean MVP security hardening.
-- Make report_exports append-only for authenticated app users.
-- Do not execute automatically. Review before applying to production.

drop policy if exists "clean report exports update own family"
on public.report_exports;

drop policy if exists "clean report exports delete own family"
on public.report_exports;

-- Verification SQL to run manually after applying this patch.
-- These statements are intentionally commented out.
--
-- 1. Family member can select own export rows.
-- select *
-- from public.report_exports
-- where family_id = '<family-id>';
--
-- 2. Family member can insert own export row.
-- insert into public.report_exports (
--   report_id,
--   family_id,
--   learner_id,
--   export_format,
--   exported_by_user_id
-- ) values (
--   '<report-id>',
--   '<family-id>',
--   '<learner-id>',
--   'pdf',
--   auth.uid()
-- )
-- returning *;
--
-- 3. Update should be denied.
-- update public.report_exports
-- set export_format = 'html'
-- where id = '<export-id>';
--
-- 4. Delete should be denied.
-- delete from public.report_exports
-- where id = '<export-id>';
--
-- 5. Other family cannot select rows.
-- select *
-- from public.report_exports
-- where family_id = '<other-family-id>';
