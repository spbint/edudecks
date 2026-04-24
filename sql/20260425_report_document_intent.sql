alter table public.report_documents
  add column if not exists report_intent text not null default 'authority';

alter table public.report_documents
  drop constraint if exists report_documents_report_intent_check;

alter table public.report_documents
  add constraint report_documents_report_intent_check
    check (report_intent in ('authority', 'portfolio'));
