-- MyLearna Intelligence Engine v1.
-- Isolated from existing homeschool, campus, reporting, portfolio, and QA tables.

create extension if not exists pgcrypto;

create table if not exists public.intelligence_ideas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text not null default '',
  status text not null default 'active',
  tags jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint intelligence_ideas_status_check
    check (status in ('active', 'archived'))
);

create unique index if not exists intelligence_ideas_id_user_unique
  on public.intelligence_ideas (id, user_id);

create table if not exists public.intelligence_idea_sources (
  id uuid primary key default gen_random_uuid(),
  idea_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  source_type text not null default 'url',
  url text not null,
  canonical_url text not null,
  provider text,
  title text,
  description text,
  site_name text,
  image_url text,
  author text,
  published_at timestamptz,
  metadata_status text not null default 'pending',
  metadata jsonb not null default '{}'::jsonb,
  extracted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint intelligence_sources_type_check
    check (source_type in ('url', 'manual')),
  constraint intelligence_sources_metadata_status_check
    check (metadata_status in ('pending', 'ready', 'failed')),
  foreign key (idea_id, user_id)
    references public.intelligence_ideas(id, user_id)
    on delete cascade,
  unique (idea_id, canonical_url)
);

create table if not exists public.intelligence_lesson_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  idea_id uuid,
  title text not null,
  summary text not null default '',
  learning_area text,
  year_level text,
  objectives jsonb not null default '[]'::jsonb,
  duration_minutes integer,
  source_ids jsonb not null default '[]'::jsonb,
  status text not null default 'draft',
  current_version integer not null default 1,
  final_approved_version integer,
  provenance jsonb not null default '{}'::jsonb,
  content jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint intelligence_lesson_status_check
    check (status in ('draft', 'saved', 'archived')),
  foreign key (idea_id, user_id)
    references public.intelligence_ideas(id, user_id)
    on delete set null
);

create table if not exists public.intelligence_unit_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  idea_id uuid,
  title text not null,
  summary text not null default '',
  learning_area text,
  year_level text,
  objectives jsonb not null default '[]'::jsonb,
  duration_count integer,
  duration_unit text,
  source_ids jsonb not null default '[]'::jsonb,
  status text not null default 'draft',
  current_version integer not null default 1,
  final_approved_version integer,
  provenance jsonb not null default '{}'::jsonb,
  content jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint intelligence_unit_status_check
    check (status in ('draft', 'saved', 'archived')),
  foreign key (idea_id, user_id)
    references public.intelligence_ideas(id, user_id)
    on delete set null
);

create table if not exists public.intelligence_lesson_sequences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_plan_id uuid,
  unit_plan_id uuid,
  sequence_order integer not null default 0,
  title text not null,
  objective text not null default '',
  activity text not null default '',
  duration_minutes integer,
  notes text not null default '',
  content jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint intelligence_sequence_one_parent_check
    check (
      (lesson_plan_id is not null)::integer +
      (unit_plan_id is not null)::integer = 1
    ),
  foreign key (lesson_plan_id, user_id)
    references public.intelligence_lesson_plans(id, user_id)
    on delete cascade,
  foreign key (unit_plan_id, user_id)
    references public.intelligence_unit_plans(id, user_id)
    on delete cascade
);

create table if not exists public.intelligence_resource_requirements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_plan_id uuid,
  unit_plan_id uuid,
  sequence_id uuid,
  name text not null,
  category text,
  quantity text,
  required boolean not null default true,
  url text,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint intelligence_resource_one_parent_check
    check (
      (lesson_plan_id is not null)::integer +
      (unit_plan_id is not null)::integer +
      (sequence_id is not null)::integer = 1
    ),
  foreign key (lesson_plan_id, user_id)
    references public.intelligence_lesson_plans(id, user_id)
    on delete cascade,
  foreign key (unit_plan_id, user_id)
    references public.intelligence_unit_plans(id, user_id)
    on delete cascade,
  foreign key (sequence_id, user_id)
    references public.intelligence_lesson_sequences(id, user_id)
    on delete cascade
);

create table if not exists public.intelligence_plan_versions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_plan_id uuid,
  unit_plan_id uuid,
  version integer not null,
  snapshot jsonb not null default '{}'::jsonb,
  source_provenance jsonb not null default '[]'::jsonb,
  generation_model text not null,
  generation_model_version text not null,
  prompt_version text not null,
  schema_version text not null,
  parent_edits jsonb not null default '[]'::jsonb,
  is_final_approved boolean not null default false,
  approved_at timestamptz,
  approved_by_user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint intelligence_plan_version_one_parent_check
    check (
      (lesson_plan_id is not null)::integer +
      (unit_plan_id is not null)::integer = 1
    ),
  foreign key (lesson_plan_id, user_id)
    references public.intelligence_lesson_plans(id, user_id)
    on delete cascade,
  foreign key (unit_plan_id, user_id)
    references public.intelligence_unit_plans(id, user_id)
    on delete cascade,
  unique (lesson_plan_id, version),
  unique (unit_plan_id, version)
);

create index if not exists intelligence_ideas_user_updated_idx
  on public.intelligence_ideas (user_id, updated_at desc);
create index if not exists intelligence_sources_idea_idx
  on public.intelligence_idea_sources (idea_id, created_at desc);
create index if not exists intelligence_lesson_plans_user_updated_idx
  on public.intelligence_lesson_plans (user_id, updated_at desc);
create index if not exists intelligence_unit_plans_user_updated_idx
  on public.intelligence_unit_plans (user_id, updated_at desc);
create index if not exists intelligence_sequences_plan_order_idx
  on public.intelligence_lesson_sequences (user_id, sequence_order);
create index if not exists intelligence_plan_versions_user_created_idx
  on public.intelligence_plan_versions (user_id, created_at desc);

alter table public.intelligence_ideas enable row level security;
alter table public.intelligence_idea_sources enable row level security;
alter table public.intelligence_lesson_plans enable row level security;
alter table public.intelligence_unit_plans enable row level security;
alter table public.intelligence_lesson_sequences enable row level security;
alter table public.intelligence_resource_requirements enable row level security;
alter table public.intelligence_plan_versions enable row level security;

create policy "intelligence ideas own"
on public.intelligence_ideas for all to authenticated
using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "intelligence sources own"
on public.intelligence_idea_sources for all to authenticated
using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "intelligence lesson plans own"
on public.intelligence_lesson_plans for all to authenticated
using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "intelligence unit plans own"
on public.intelligence_unit_plans for all to authenticated
using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "intelligence sequences own"
on public.intelligence_lesson_sequences for all to authenticated
using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "intelligence resources own"
on public.intelligence_resource_requirements for all to authenticated
using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "intelligence plan versions own"
on public.intelligence_plan_versions for all to authenticated
using (user_id = auth.uid()) with check (user_id = auth.uid());
