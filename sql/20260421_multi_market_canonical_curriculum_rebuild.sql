create extension if not exists pgcrypto;

create table if not exists public.curriculum_markets (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table if exists public.curriculum_frameworks
  add column if not exists market_id uuid references public.curriculum_markets(id) on delete set null,
  add column if not exists slug text,
  add column if not exists market text,
  add column if not exists parent_framework_id uuid references public.curriculum_frameworks(id) on delete set null,
  add column if not exists description text,
  add column if not exists updated_at timestamptz not null default now();

create table if not exists public.curriculum_jurisdictions (
  id uuid primary key default gen_random_uuid(),
  framework_id uuid not null references public.curriculum_frameworks(id) on delete cascade,
  country_code text not null,
  state_code text,
  slug text not null,
  name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (framework_id, slug)
);

alter table if exists public.curriculum_levels
  add column if not exists jurisdiction_id uuid references public.curriculum_jurisdictions(id) on delete set null,
  add column if not exists level_code text,
  add column if not exists level_label text,
  add column if not exists sort_order integer not null default 0,
  add column if not exists is_active boolean not null default true,
  add column if not exists updated_at timestamptz not null default now();

create table if not exists public.curriculum_learning_areas (
  id uuid primary key default gen_random_uuid(),
  framework_id uuid not null references public.curriculum_frameworks(id) on delete cascade,
  jurisdiction_id uuid references public.curriculum_jurisdictions(id) on delete set null,
  code text not null,
  label text not null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (framework_id, code)
);

alter table if exists public.curriculum_subjects
  add column if not exists jurisdiction_id uuid references public.curriculum_jurisdictions(id) on delete set null,
  add column if not exists label text,
  add column if not exists updated_at timestamptz not null default now();

alter table if exists public.curriculum_strands
  add column if not exists learning_area_id uuid references public.curriculum_learning_areas(id) on delete cascade,
  add column if not exists label text,
  add column if not exists is_active boolean not null default true,
  add column if not exists updated_at timestamptz not null default now();

create table if not exists public.curriculum_outcomes (
  id uuid primary key default gen_random_uuid(),
  framework_id uuid not null references public.curriculum_frameworks(id) on delete cascade,
  strand_id uuid not null references public.curriculum_strands(id) on delete cascade,
  level_id uuid references public.curriculum_levels(id) on delete set null,
  code text not null,
  description text not null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (strand_id, code, coalesce(level_id, '00000000-0000-0000-0000-000000000000'::uuid))
);

create index if not exists idx_curriculum_frameworks_market on public.curriculum_frameworks(market);
create index if not exists idx_curriculum_frameworks_market_id on public.curriculum_frameworks(market_id);
create index if not exists idx_curriculum_jurisdictions_framework on public.curriculum_jurisdictions(framework_id, name);
create index if not exists idx_curriculum_levels_framework on public.curriculum_levels(framework_id, sort_order);
create index if not exists idx_curriculum_learning_areas_framework on public.curriculum_learning_areas(framework_id, sort_order);
create index if not exists idx_curriculum_subjects_framework on public.curriculum_subjects(framework_id, sort_order);
create index if not exists idx_curriculum_strands_learning_area on public.curriculum_strands(learning_area_id, sort_order);
create index if not exists idx_curriculum_outcomes_strand_level on public.curriculum_outcomes(strand_id, level_id, sort_order);

with market_seed(slug, name) as (
  values
    ('us', 'United States'),
    ('au', 'Australia'),
    ('ib', 'International Baccalaureate'),
    ('uk', 'United Kingdom / UK National Curriculum'),
    ('other', 'Other / Custom')
)
insert into public.curriculum_markets (slug, name, is_active, created_at, updated_at)
select slug, name, true, now(), now()
from market_seed
on conflict (slug) do update
set name = excluded.name, is_active = true, updated_at = now();

with framework_seed(market_slug, slug, code, name, framework_type, framework_scope, description) as (
  values
    ('us', 'common-core', 'common-core', 'Common Core', 'national', 'national', 'United States base curriculum framework.'),
    ('au', 'australian-curriculum', 'australian-curriculum', 'Australian Curriculum', 'national', 'national', 'Australian national curriculum framework.'),
    ('ib', 'ib-pyp', 'ib-pyp', 'IB PYP', 'international', 'international', 'International Baccalaureate Primary Years Programme.'),
    ('ib', 'ib-myp', 'ib-myp', 'IB MYP', 'international', 'international', 'International Baccalaureate Middle Years Programme.'),
    ('uk', 'uk-national-curriculum', 'uk-national-curriculum', 'UK National Curriculum', 'national', 'national', 'United Kingdom national curriculum starter framework.'),
    ('other', 'custom-curriculum', 'custom-curriculum', 'Custom Curriculum', 'custom', 'custom', 'Fallback curriculum for bespoke or unsupported pathways.')
)
insert into public.curriculum_frameworks (
  market_id, market, slug, code, name, framework_type, framework_scope, description, is_active, created_at, updated_at
)
select
  m.id,
  m.slug,
  s.slug,
  s.code,
  s.name,
  s.framework_type,
  s.framework_scope,
  s.description,
  true,
  now(),
  now()
from framework_seed s
join public.curriculum_markets m on m.slug = s.market_slug
on conflict (code) do update
set
  market_id = excluded.market_id,
  market = excluded.market,
  slug = excluded.slug,
  name = excluded.name,
  framework_type = excluded.framework_type,
  framework_scope = excluded.framework_scope,
  description = excluded.description,
  is_active = true,
  updated_at = now();

with jurisdiction_seed(framework_code, country_code, state_code, slug, name) as (
  values
    ('common-core', 'US', null, 'united-states', 'United States'),
    ('common-core', 'US', 'AL', 'alabama', 'Alabama'),
    ('common-core', 'US', 'AK', 'alaska', 'Alaska'),
    ('common-core', 'US', 'AZ', 'arizona', 'Arizona'),
    ('common-core', 'US', 'AR', 'arkansas', 'Arkansas'),
    ('common-core', 'US', 'CA', 'california', 'California'),
    ('common-core', 'US', 'CO', 'colorado', 'Colorado'),
    ('common-core', 'US', 'CT', 'connecticut', 'Connecticut'),
    ('common-core', 'US', 'DE', 'delaware', 'Delaware'),
    ('common-core', 'US', 'FL', 'florida', 'Florida'),
    ('common-core', 'US', 'GA', 'georgia', 'Georgia'),
    ('common-core', 'US', 'HI', 'hawaii', 'Hawaii'),
    ('common-core', 'US', 'ID', 'idaho', 'Idaho'),
    ('common-core', 'US', 'IL', 'illinois', 'Illinois'),
    ('common-core', 'US', 'IN', 'indiana', 'Indiana'),
    ('common-core', 'US', 'IA', 'iowa', 'Iowa'),
    ('common-core', 'US', 'KS', 'kansas', 'Kansas'),
    ('common-core', 'US', 'KY', 'kentucky', 'Kentucky'),
    ('common-core', 'US', 'LA', 'louisiana', 'Louisiana'),
    ('common-core', 'US', 'ME', 'maine', 'Maine'),
    ('common-core', 'US', 'MD', 'maryland', 'Maryland'),
    ('common-core', 'US', 'MA', 'massachusetts', 'Massachusetts'),
    ('common-core', 'US', 'MI', 'michigan', 'Michigan'),
    ('common-core', 'US', 'MN', 'minnesota', 'Minnesota'),
    ('common-core', 'US', 'MS', 'mississippi', 'Mississippi'),
    ('common-core', 'US', 'MO', 'missouri', 'Missouri'),
    ('common-core', 'US', 'MT', 'montana', 'Montana'),
    ('common-core', 'US', 'NE', 'nebraska', 'Nebraska'),
    ('common-core', 'US', 'NV', 'nevada', 'Nevada'),
    ('common-core', 'US', 'NH', 'new-hampshire', 'New Hampshire'),
    ('common-core', 'US', 'NJ', 'new-jersey', 'New Jersey'),
    ('common-core', 'US', 'NM', 'new-mexico', 'New Mexico'),
    ('common-core', 'US', 'NY', 'new-york', 'New York'),
    ('common-core', 'US', 'NC', 'north-carolina', 'North Carolina'),
    ('common-core', 'US', 'ND', 'north-dakota', 'North Dakota'),
    ('common-core', 'US', 'OH', 'ohio', 'Ohio'),
    ('common-core', 'US', 'OK', 'oklahoma', 'Oklahoma'),
    ('common-core', 'US', 'OR', 'oregon', 'Oregon'),
    ('common-core', 'US', 'PA', 'pennsylvania', 'Pennsylvania'),
    ('common-core', 'US', 'RI', 'rhode-island', 'Rhode Island'),
    ('common-core', 'US', 'SC', 'south-carolina', 'South Carolina'),
    ('common-core', 'US', 'SD', 'south-dakota', 'South Dakota'),
    ('common-core', 'US', 'TN', 'tennessee', 'Tennessee'),
    ('common-core', 'US', 'TX', 'texas', 'Texas'),
    ('common-core', 'US', 'UT', 'utah', 'Utah'),
    ('common-core', 'US', 'VT', 'vermont', 'Vermont'),
    ('common-core', 'US', 'VA', 'virginia', 'Virginia'),
    ('common-core', 'US', 'WA', 'washington', 'Washington'),
    ('common-core', 'US', 'WV', 'west-virginia', 'West Virginia'),
    ('common-core', 'US', 'WI', 'wisconsin', 'Wisconsin'),
    ('common-core', 'US', 'WY', 'wyoming', 'Wyoming'),
    ('australian-curriculum', 'AU', null, 'australia', 'Australia'),
    ('ib-pyp', 'INT', null, 'international', 'International'),
    ('ib-myp', 'INT', null, 'international', 'International'),
    ('uk-national-curriculum', 'UK', null, 'united-kingdom', 'United Kingdom'),
    ('custom-curriculum', 'OTHER', null, 'global-custom', 'Global / Custom')
)
insert into public.curriculum_jurisdictions (
  framework_id, country_code, state_code, slug, name, is_active, created_at, updated_at
)
select f.id, s.country_code, s.state_code, s.slug, s.name, true, now(), now()
from jurisdiction_seed s
join public.curriculum_frameworks f on f.code = s.framework_code
on conflict (framework_id, slug) do update
set
  country_code = excluded.country_code,
  state_code = excluded.state_code,
  name = excluded.name,
  is_active = true,
  updated_at = now();

with level_seed(framework_code, code, label, sort_order) as (
  values
    ('common-core', 'K', 'Kindergarten', 0),
    ('common-core', '1', 'Grade 1', 1),
    ('common-core', '2', 'Grade 2', 2),
    ('common-core', '3', 'Grade 3', 3),
    ('common-core', '4', 'Grade 4', 4),
    ('common-core', '5', 'Grade 5', 5),
    ('common-core', '6', 'Grade 6', 6),
    ('australian-curriculum', 'F', 'Foundation', 0),
    ('australian-curriculum', '1', 'Year 1', 1),
    ('australian-curriculum', '2', 'Year 2', 2),
    ('australian-curriculum', '3', 'Year 3', 3),
    ('australian-curriculum', '4', 'Year 4', 4),
    ('australian-curriculum', '5', 'Year 5', 5),
    ('australian-curriculum', '6', 'Year 6', 6),
    ('ib-pyp', 'PYP1', 'PYP 1', 1),
    ('ib-pyp', 'PYP2', 'PYP 2', 2),
    ('ib-pyp', 'PYP3', 'PYP 3', 3),
    ('ib-pyp', 'PYP4', 'PYP 4', 4),
    ('ib-pyp', 'PYP5', 'PYP 5', 5),
    ('ib-pyp', 'PYP6', 'PYP 6', 6),
    ('ib-myp', 'MYP1', 'MYP 1', 1),
    ('ib-myp', 'MYP2', 'MYP 2', 2),
    ('ib-myp', 'MYP3', 'MYP 3', 3),
    ('ib-myp', 'MYP4', 'MYP 4', 4),
    ('ib-myp', 'MYP5', 'MYP 5', 5),
    ('uk-national-curriculum', 'Y1', 'Year 1', 1),
    ('uk-national-curriculum', 'Y2', 'Year 2', 2),
    ('uk-national-curriculum', 'Y3', 'Year 3', 3),
    ('uk-national-curriculum', 'Y4', 'Year 4', 4),
    ('uk-national-curriculum', 'Y5', 'Year 5', 5),
    ('uk-national-curriculum', 'Y6', 'Year 6', 6),
    ('custom-curriculum', 'BEGINNER', 'Beginner', 1),
    ('custom-curriculum', 'INTERMEDIATE', 'Intermediate', 2),
    ('custom-curriculum', 'ADVANCED', 'Advanced', 3)
)
insert into public.curriculum_levels (
  framework_id, level_code, level_label, level_type, sort_order, is_active, created_at, updated_at
)
select f.id, s.code, s.label, 'level', s.sort_order, true, now(), now()
from level_seed s
join public.curriculum_frameworks f on f.code = s.framework_code
on conflict (framework_id, level_code) do update
set
  level_label = excluded.level_label,
  sort_order = excluded.sort_order,
  is_active = true,
  updated_at = now();

with area_seed(framework_code, code, label, sort_order) as (
  values
    ('common-core', 'ela', 'English Language Arts', 10),
    ('common-core', 'mathematics', 'Mathematics', 20),
    ('common-core', 'science', 'Science', 30),
    ('common-core', 'humanities', 'Humanities', 40),
    ('common-core', 'health', 'Health', 50),
    ('australian-curriculum', 'english', 'English', 10),
    ('australian-curriculum', 'mathematics', 'Mathematics', 20),
    ('australian-curriculum', 'science', 'Science', 30),
    ('australian-curriculum', 'hass', 'Humanities and Social Sciences', 40),
    ('australian-curriculum', 'hpe', 'Health and Physical Education', 50),
    ('ib-pyp', 'language', 'Language', 10),
    ('ib-pyp', 'mathematics', 'Mathematics', 20),
    ('ib-pyp', 'science', 'Science', 30),
    ('ib-pyp', 'individuals-societies', 'Individuals and Societies', 40),
    ('ib-pyp', 'wellbeing', 'Personal Development / Wellbeing', 50),
    ('ib-myp', 'language', 'Language', 10),
    ('ib-myp', 'mathematics', 'Mathematics', 20),
    ('ib-myp', 'science', 'Science', 30),
    ('ib-myp', 'individuals-societies', 'Individuals and Societies', 40),
    ('ib-myp', 'wellbeing', 'Personal Development / Wellbeing', 50),
    ('uk-national-curriculum', 'english', 'English', 10),
    ('uk-national-curriculum', 'mathematics', 'Mathematics', 20),
    ('uk-national-curriculum', 'science', 'Science', 30),
    ('uk-national-curriculum', 'humanities', 'Humanities', 40),
    ('uk-national-curriculum', 'health', 'Personal Development / Health', 50),
    ('custom-curriculum', 'literacy', 'Literacy', 10),
    ('custom-curriculum', 'numeracy', 'Numeracy', 20),
    ('custom-curriculum', 'science', 'Science', 30),
    ('custom-curriculum', 'humanities', 'Humanities', 40),
    ('custom-curriculum', 'wellbeing', 'Wellbeing', 50)
)
insert into public.curriculum_learning_areas (
  framework_id, code, label, sort_order, is_active, created_at, updated_at
)
select f.id, s.code, s.label, s.sort_order, true, now(), now()
from area_seed s
join public.curriculum_frameworks f on f.code = s.framework_code
on conflict (framework_id, code) do update
set
  label = excluded.label,
  sort_order = excluded.sort_order,
  is_active = true,
  updated_at = now();

insert into public.curriculum_subjects (
  framework_id, code, name, label, sort_order, is_active, created_at, updated_at
)
select framework_id, code, label, label, sort_order, is_active, created_at, updated_at
from public.curriculum_learning_areas
on conflict (framework_id, code) do update
set
  name = excluded.name,
  label = excluded.label,
  sort_order = excluded.sort_order,
  is_active = true,
  updated_at = now();

with strand_seed(area_code, code, label, sort_order) as (
  values
    ('ela', 'reading', 'Reading', 10),
    ('ela', 'writing', 'Writing', 20),
    ('english', 'reading', 'Reading', 10),
    ('english', 'writing', 'Writing', 20),
    ('language', 'reading', 'Reading', 10),
    ('language', 'writing', 'Writing', 20),
    ('literacy', 'reading', 'Reading', 10),
    ('literacy', 'writing', 'Writing', 20),
    ('mathematics', 'number', 'Number', 10),
    ('mathematics', 'measurement', 'Measurement', 20),
    ('numeracy', 'number', 'Number', 10),
    ('numeracy', 'measurement', 'Measurement', 20),
    ('science', 'inquiry', 'Inquiry', 10),
    ('science', 'knowledge', 'Knowledge', 20),
    ('humanities', 'history', 'History', 10),
    ('humanities', 'geography', 'Geography', 20),
    ('hass', 'history', 'History', 10),
    ('hass', 'geography', 'Geography', 20),
    ('individuals-societies', 'history', 'History', 10),
    ('individuals-societies', 'geography', 'Geography', 20),
    ('health', 'personal-development', 'Personal Development', 10),
    ('health', 'physical-wellbeing', 'Physical Wellbeing', 20),
    ('hpe', 'personal-development', 'Personal Development', 10),
    ('hpe', 'physical-wellbeing', 'Physical Wellbeing', 20),
    ('wellbeing', 'personal-development', 'Personal Development', 10),
    ('wellbeing', 'physical-wellbeing', 'Physical Wellbeing', 20)
)
insert into public.curriculum_strands (
  learning_area_id, code, name, label, sort_order, is_active, created_at, updated_at
)
select a.id, s.code, s.label, s.label, s.sort_order, true, now(), now()
from strand_seed s
join public.curriculum_learning_areas a on a.code = s.area_code
on conflict (learning_area_id, code) do update
set
  name = excluded.name,
  label = excluded.label,
  sort_order = excluded.sort_order,
  is_active = true,
  updated_at = now();

with outcome_seed(strand_code, code, description, sort_order) as (
  values
    ('reading', 'READ-1', 'Engages with increasingly complex texts and extracts meaning from them.', 10),
    ('writing', 'WRITE-1', 'Creates written responses that communicate ideas clearly.', 20),
    ('number', 'NUM-1', 'Uses number concepts and operations confidently in context.', 10),
    ('measurement', 'MEAS-1', 'Measures, compares, and reasons about quantities and units.', 20),
    ('inquiry', 'SCI-1', 'Investigates questions using observation and evidence.', 10),
    ('knowledge', 'SCI-2', 'Explains scientific ideas using accurate subject knowledge.', 20),
    ('history', 'HIST-1', 'Uses historical sources and narratives to explain the past.', 10),
    ('geography', 'GEO-1', 'Explains places, environments, and human interaction with them.', 20),
    ('personal-development', 'PD-1', 'Reflects on choices, relationships, and personal growth.', 10),
    ('physical-wellbeing', 'PW-1', 'Demonstrates knowledge and habits that support physical wellbeing.', 20)
)
insert into public.curriculum_outcomes (
  framework_id, strand_id, code, description, sort_order, is_active, created_at, updated_at
)
select
  a.framework_id,
  st.id,
  o.code,
  o.description,
  o.sort_order,
  true,
  now(),
  now()
from outcome_seed o
join public.curriculum_strands st on st.code = o.strand_code
join public.curriculum_learning_areas a on a.id = st.learning_area_id
where not exists (
  select 1 from public.curriculum_outcomes co
  where co.strand_id = st.id and co.code = o.code
);
