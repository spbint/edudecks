create extension if not exists pgcrypto;

alter table if exists public.curriculum_frameworks
  add column if not exists slug text,
  add column if not exists market text,
  add column if not exists parent_framework_id uuid references public.curriculum_frameworks(id) on delete set null,
  add column if not exists description text,
  add column if not exists updated_at timestamptz not null default now();

update public.curriculum_frameworks
set
  slug = coalesce(nullif(slug, ''), lower(regexp_replace(code, '[^a-zA-Z0-9]+', '-', 'g'))),
  market = coalesce(nullif(market, ''), nullif(country, ''), 'us'),
  updated_at = coalesce(updated_at, created_at, now())
where true;

create unique index if not exists idx_curriculum_frameworks_slug
  on public.curriculum_frameworks(slug)
  where slug is not null;

create table if not exists public.curriculum_jurisdictions (
  id uuid primary key default gen_random_uuid(),
  framework_id uuid not null references public.curriculum_frameworks(id) on delete cascade,
  country_code text not null,
  state_code text,
  slug text not null,
  name text not null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (framework_id, slug)
);

alter table if exists public.curriculum_levels
  add column if not exists jurisdiction_id uuid references public.curriculum_jurisdictions(id) on delete set null,
  add column if not exists is_active boolean not null default true,
  add column if not exists updated_at timestamptz not null default now();

update public.curriculum_levels
set
  is_active = coalesce(is_active, true),
  updated_at = coalesce(updated_at, created_at, now())
where true;

alter table if exists public.curriculum_subjects
  add column if not exists jurisdiction_id uuid references public.curriculum_jurisdictions(id) on delete set null,
  add column if not exists updated_at timestamptz not null default now();

update public.curriculum_subjects
set updated_at = coalesce(updated_at, created_at, now())
where true;

create index if not exists idx_curriculum_jurisdictions_framework
  on public.curriculum_jurisdictions(framework_id, sort_order, name);

create index if not exists idx_curriculum_levels_jurisdiction
  on public.curriculum_levels(jurisdiction_id, sort_order);

create index if not exists idx_curriculum_subjects_jurisdiction
  on public.curriculum_subjects(jurisdiction_id, sort_order);

with framework_seed(slug, code, name, market, country, jurisdiction, version, framework_type, framework_scope, description) as (
  values
    ('common-core', 'common-core', 'Common Core', 'us', 'us', 'national', 'starter-2026', 'national', 'national', 'United States base framework for Common Core rollout.'),
    ('australian-curriculum', 'australian-curriculum', 'Australian Curriculum', 'au', 'au', 'national', 'starter-2026', 'national', 'national', 'Australian Curriculum base framework for family settings.'),
    ('ib-pyp', 'ib-pyp', 'IB PYP', 'ib', 'ib', 'global', 'starter-2026', 'international', 'international', 'International Baccalaureate Primary Years Programme.'),
    ('ib-myp', 'ib-myp', 'IB MYP', 'ib', 'ib', 'global', 'starter-2026', 'international', 'international', 'International Baccalaureate Middle Years Programme.'),
    ('england-national-curriculum', 'england-national-curriculum', 'England National Curriculum', 'uk', 'uk', 'england', 'starter-2026', 'national', 'national', 'England National Curriculum framework.')
),
upsert_frameworks as (
  insert into public.curriculum_frameworks (
    slug,
    code,
    name,
    market,
    country,
    jurisdiction,
    version,
    framework_type,
    framework_scope,
    description,
    is_active,
    updated_at
  )
  select
    slug,
    code,
    name,
    market,
    country,
    jurisdiction,
    version,
    framework_type,
    framework_scope,
    description,
    true,
    now()
  from framework_seed
  on conflict (code) do update
  set
    slug = excluded.slug,
    name = excluded.name,
    market = excluded.market,
    country = excluded.country,
    jurisdiction = excluded.jurisdiction,
    version = excluded.version,
    framework_type = excluded.framework_type,
    framework_scope = excluded.framework_scope,
    description = excluded.description,
    is_active = true,
    updated_at = now()
  returning id, slug
),
frameworks as (
  select id, slug from upsert_frameworks
  union
  select f.id, f.slug
  from public.curriculum_frameworks f
  join framework_seed s on s.code = f.code
),
jurisdiction_seed(framework_slug, country_code, state_code, slug, name, sort_order) as (
  values
    ('common-core', 'us', null, 'us-national', 'United States', 10),
    ('common-core', 'us', 'ca', 'california', 'California', 20),
    ('common-core', 'us', 'ny', 'new-york', 'New York', 30),
    ('australian-curriculum', 'au', null, 'australia', 'Australia', 10),
    ('ib-pyp', 'ib', null, 'global', 'International', 10),
    ('ib-myp', 'ib', null, 'global', 'International', 10),
    ('england-national-curriculum', 'uk', null, 'england', 'England', 10)
),
upsert_jurisdictions as (
  insert into public.curriculum_jurisdictions (
    framework_id,
    country_code,
    state_code,
    slug,
    name,
    sort_order,
    is_active,
    updated_at
  )
  select
    f.id,
    s.country_code,
    s.state_code,
    s.slug,
    s.name,
    s.sort_order,
    true,
    now()
  from jurisdiction_seed s
  join frameworks f on f.slug = s.framework_slug
  on conflict (framework_id, slug) do update
  set
    country_code = excluded.country_code,
    state_code = excluded.state_code,
    name = excluded.name,
    sort_order = excluded.sort_order,
    is_active = true,
    updated_at = now()
  returning id, framework_id, slug
),
jurisdictions as (
  select id, framework_id, slug from upsert_jurisdictions
  union
  select j.id, j.framework_id, j.slug
  from public.curriculum_jurisdictions j
  join frameworks f on f.id = j.framework_id
),
level_seed(framework_slug, jurisdiction_slug, level_code, level_label, level_type, sort_order) as (
  values
    ('common-core', 'us-national', 'K', 'Kindergarten', 'grade', 0),
    ('common-core', 'us-national', '1', 'Grade 1', 'grade', 1),
    ('common-core', 'us-national', '2', 'Grade 2', 'grade', 2),
    ('common-core', 'us-national', '3', 'Grade 3', 'grade', 3),
    ('common-core', 'us-national', '4', 'Grade 4', 'grade', 4),
    ('common-core', 'us-national', '5', 'Grade 5', 'grade', 5),
    ('common-core', 'us-national', '6', 'Grade 6', 'grade', 6),
    ('australian-curriculum', 'australia', 'F', 'Foundation', 'year', 0),
    ('australian-curriculum', 'australia', '1', 'Year 1', 'year', 1),
    ('australian-curriculum', 'australia', '2', 'Year 2', 'year', 2),
    ('australian-curriculum', 'australia', '3', 'Year 3', 'year', 3),
    ('australian-curriculum', 'australia', '4', 'Year 4', 'year', 4),
    ('australian-curriculum', 'australia', '5', 'Year 5', 'year', 5),
    ('australian-curriculum', 'australia', '6', 'Year 6', 'year', 6),
    ('ib-pyp', 'global', 'PYP1', 'PYP 1', 'programme-year', 1),
    ('ib-pyp', 'global', 'PYP2', 'PYP 2', 'programme-year', 2),
    ('ib-pyp', 'global', 'PYP3', 'PYP 3', 'programme-year', 3),
    ('ib-pyp', 'global', 'PYP4', 'PYP 4', 'programme-year', 4),
    ('ib-pyp', 'global', 'PYP5', 'PYP 5', 'programme-year', 5),
    ('ib-pyp', 'global', 'PYP6', 'PYP 6', 'programme-year', 6),
    ('ib-myp', 'global', 'MYP1', 'MYP 1', 'programme-year', 1),
    ('ib-myp', 'global', 'MYP2', 'MYP 2', 'programme-year', 2),
    ('ib-myp', 'global', 'MYP3', 'MYP 3', 'programme-year', 3),
    ('ib-myp', 'global', 'MYP4', 'MYP 4', 'programme-year', 4),
    ('ib-myp', 'global', 'MYP5', 'MYP 5', 'programme-year', 5),
    ('england-national-curriculum', 'england', 'Y1', 'Year 1', 'year', 1),
    ('england-national-curriculum', 'england', 'Y2', 'Year 2', 'year', 2),
    ('england-national-curriculum', 'england', 'Y3', 'Year 3', 'year', 3),
    ('england-national-curriculum', 'england', 'Y4', 'Year 4', 'year', 4),
    ('england-national-curriculum', 'england', 'Y5', 'Year 5', 'year', 5),
    ('england-national-curriculum', 'england', 'Y6', 'Year 6', 'year', 6)
)
insert into public.curriculum_levels (
  framework_id,
  jurisdiction_id,
  level_code,
  level_label,
  level_type,
  sort_order,
  is_active,
  updated_at
)
select
  f.id,
  j.id,
  s.level_code,
  s.level_label,
  s.level_type,
  s.sort_order,
  true,
  now()
from level_seed s
join frameworks f on f.slug = s.framework_slug
left join jurisdictions j on j.framework_id = f.id and j.slug = s.jurisdiction_slug
on conflict (framework_id, level_code) do update
set
  jurisdiction_id = excluded.jurisdiction_id,
  level_label = excluded.level_label,
  level_type = excluded.level_type,
  sort_order = excluded.sort_order,
  is_active = true,
  updated_at = now();

with frameworks as (
  select id, slug from public.curriculum_frameworks
  where slug in (
    'common-core',
    'australian-curriculum',
    'ib-pyp',
    'ib-myp',
    'england-national-curriculum'
  )
),
jurisdictions as (
  select id, framework_id, slug from public.curriculum_jurisdictions
),
subject_seed(framework_slug, jurisdiction_slug, code, name, sort_order) as (
  values
    ('common-core', 'us-national', 'ela', 'English Language Arts', 10),
    ('common-core', 'us-national', 'math', 'Mathematics', 20),
    ('common-core', 'us-national', 'science', 'Science', 30),
    ('common-core', 'us-national', 'humanities', 'Humanities', 40),
    ('common-core', 'us-national', 'health', 'Health', 50),
    ('australian-curriculum', 'australia', 'english', 'English', 10),
    ('australian-curriculum', 'australia', 'mathematics', 'Mathematics', 20),
    ('australian-curriculum', 'australia', 'science', 'Science', 30),
    ('australian-curriculum', 'australia', 'humanities', 'Humanities', 40),
    ('australian-curriculum', 'australia', 'health', 'Health and Physical Education', 50),
    ('ib-pyp', 'global', 'language', 'Language and Literature', 10),
    ('ib-pyp', 'global', 'mathematics', 'Mathematics', 20),
    ('ib-pyp', 'global', 'science', 'Science', 30),
    ('ib-pyp', 'global', 'humanities', 'Individuals and Societies', 40),
    ('ib-pyp', 'global', 'health', 'Personal, Social and Physical Education', 50),
    ('ib-myp', 'global', 'language', 'Language and Literature', 10),
    ('ib-myp', 'global', 'mathematics', 'Mathematics', 20),
    ('ib-myp', 'global', 'science', 'Sciences', 30),
    ('ib-myp', 'global', 'humanities', 'Individuals and Societies', 40),
    ('ib-myp', 'global', 'health', 'Physical and Health Education', 50),
    ('england-national-curriculum', 'england', 'english', 'English', 10),
    ('england-national-curriculum', 'england', 'mathematics', 'Mathematics', 20),
    ('england-national-curriculum', 'england', 'science', 'Science', 30),
    ('england-national-curriculum', 'england', 'humanities', 'Humanities', 40),
    ('england-national-curriculum', 'england', 'health', 'Health', 50)
)
insert into public.curriculum_subjects (
  framework_id,
  jurisdiction_id,
  code,
  name,
  sort_order,
  is_active,
  updated_at
)
select
  f.id,
  j.id,
  s.code,
  s.name,
  s.sort_order,
  true,
  now()
from subject_seed s
join frameworks f on f.slug = s.framework_slug
left join jurisdictions j on j.framework_id = f.id and j.slug = s.jurisdiction_slug
on conflict (framework_id, code) do update
set
  jurisdiction_id = excluded.jurisdiction_id,
  name = excluded.name,
  sort_order = excluded.sort_order,
  is_active = true,
  updated_at = now();
