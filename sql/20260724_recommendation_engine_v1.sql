-- MyLearna Recommendation Engine v1.
-- Proposal only: do not apply without staging backup, schema diff, and RLS verification.
-- This migration is isolated from homeschool, campus, reporting, portfolio, and QA tables.

create table if not exists public.intelligence_family_owned_resources (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  normalized_resource_key text not null,
  category text,
  quantity text,
  condition text,
  active boolean not null default true,
  source text not null default 'parent',
  provenance jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists intelligence_owned_resources_user_key_idx
  on public.intelligence_family_owned_resources (user_id, normalized_resource_key)
  where active = true;

create table if not exists public.intelligence_recommendation_interaction_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id uuid not null,
  revision_id uuid not null references public.intelligence_plan_versions(id) on delete cascade,
  revision_number integer not null,
  recommendation_id text not null,
  event_type text not null,
  metadata jsonb not null default '{}'::jsonb,
  engine_version text not null,
  rules_version text not null,
  created_at timestamptz not null default now(),
  constraint intelligence_recommendation_event_type_check
    check (event_type in ('impression', 'owned_confirmation', 'not_owned_confirmation', 'save', 'dismiss', 'restore', 'prepared', 'completed'))
);

create index if not exists intelligence_recommendation_events_revision_idx
  on public.intelligence_recommendation_interaction_events (user_id, plan_id, revision_id, created_at);

alter table public.intelligence_family_owned_resources enable row level security;
alter table public.intelligence_recommendation_interaction_events enable row level security;

create policy "intelligence owned resources own"
on public.intelligence_family_owned_resources for all to authenticated
using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "intelligence recommendation events own"
on public.intelligence_recommendation_interaction_events for all to authenticated
using (user_id = auth.uid()) with check (user_id = auth.uid());
