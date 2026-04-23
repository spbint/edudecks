create extension if not exists pgcrypto;

create table if not exists public.report_export_events (
  id uuid primary key default gen_random_uuid(),
  report_document_id text not null,
  reporting_period_id text null,
  learner_id text not null,
  family_id text null,
  jurisdiction_code text null,
  export_format text not null default 'html' check (export_format in ('html')),
  export_phase text not null default 'validated_server_export' check (export_phase = 'validated_server_export'),
  exported_by_user_id text null,
  exported_by_display_name text null,
  validation_status text not null default 'ready_for_export',
  validation_score integer null,
  filename text null,
  content_hash text null,
  section_count integer null,
  exported_at timestamptz not null default now()
);

create index if not exists report_export_events_report_document_idx
  on public.report_export_events (report_document_id, exported_at desc);

create index if not exists report_export_events_learner_idx
  on public.report_export_events (learner_id, exported_at desc);

create index if not exists report_export_events_family_idx
  on public.report_export_events (family_id, exported_at desc);

create index if not exists report_export_events_exported_by_idx
  on public.report_export_events (exported_by_user_id, exported_at desc);

alter table public.report_export_events enable row level security;

drop policy if exists "report export events read own" on public.report_export_events;
create policy "report export events read own"
on public.report_export_events
for select
to authenticated
using (auth.uid()::text = exported_by_user_id);

drop policy if exists "report export events insert own" on public.report_export_events;
create policy "report export events insert own"
on public.report_export_events
for insert
to authenticated
with check (auth.uid()::text = exported_by_user_id);
