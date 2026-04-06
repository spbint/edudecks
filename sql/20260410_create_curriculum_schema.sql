create extension if not exists "uuid-ossp";

create table if not exists curriculum_countries (
  id uuid not null primary key default uuid_generate_v4(),
  code text not null unique,
  name text not null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists curriculum_regions (
  id uuid not null primary key default uuid_generate_v4(),
  country_id uuid not null references curriculum_countries(id) on delete cascade,
  code text not null,
  name text not null,
  region_type text not null default 'state',
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique(country_id, code)
);

create table if not exists curriculum_frameworks (
  id uuid not null primary key default uuid_generate_v4(),
  country_id uuid not null references curriculum_countries(id),
  region_id uuid references curriculum_regions(id),
  code text not null,
  name text not null,
  framework_type text not null,
  subject_scope text not null,
  official_source_url text,
  version_label text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique(country_id, code)
);

create table if not exists curriculum_subjects (
  id uuid not null primary key default uuid_generate_v4(),
  framework_id uuid not null references curriculum_frameworks(id) on delete cascade,
  code text not null,
  name text not null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(framework_id, code)
);

create table if not exists curriculum_levels (
  id uuid not null primary key default uuid_generate_v4(),
  framework_id uuid not null references curriculum_frameworks(id) on delete cascade,
  official_level_label text not null,
  normalized_level_label text not null,
  normalized_sort_order integer not null default 0,
  level_type text not null,
  is_band boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(framework_id, official_level_label)
);

create table if not exists curriculum_strands (
  id uuid not null primary key default uuid_generate_v4(),
  framework_id uuid not null references curriculum_frameworks(id) on delete cascade,
  subject_id uuid references curriculum_subjects(id),
  parent_strand_id uuid references curriculum_strands(id),
  code text not null,
  name text not null,
  description text,
  sort_order integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists curriculum_standards (
  id uuid not null primary key default uuid_generate_v4(),
  framework_id uuid not null references curriculum_frameworks(id) on delete cascade,
  subject_id uuid references curriculum_subjects(id),
  strand_id uuid references curriculum_strands(id),
  parent_standard_id uuid references curriculum_standards(id),
  level_id uuid references curriculum_levels(id),
  official_code text not null,
  short_code text,
  title text,
  description text not null,
  official_grade_label text,
  normalized_grade_label text,
  normalized_grade_sort integer,
  discipline_context text,
  source_order integer,
  is_anchor boolean not null default false,
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(framework_id, official_code)
);

create table if not exists curriculum_standard_relationships (
  id uuid not null primary key default uuid_generate_v4(),
  framework_id uuid not null references curriculum_frameworks(id) on delete cascade,
  source_standard_id uuid not null references curriculum_standards(id),
  target_standard_id uuid not null references curriculum_standards(id),
  relationship_type text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists curriculum_crosswalks (
  id uuid not null primary key default uuid_generate_v4(),
  source_framework_id uuid not null references curriculum_frameworks(id),
  target_framework_id uuid not null references curriculum_frameworks(id),
  source_standard_id uuid not null references curriculum_standards(id),
  target_standard_id uuid not null references curriculum_standards(id),
  relationship_type text not null,
  confidence_score numeric,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists evidence_curriculum_links (
  id uuid not null primary key default uuid_generate_v4(),
  evidence_id uuid not null,
  curriculum_standard_id uuid not null references curriculum_standards(id),
  mapping_origin text not null,
  confidence numeric,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists assessment_curriculum_links (
  id uuid not null primary key default uuid_generate_v4(),
  assessment_id uuid not null,
  curriculum_standard_id uuid not null references curriculum_standards(id),
  mapping_origin text not null,
  confidence numeric,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists report_curriculum_links (
  id uuid not null primary key default uuid_generate_v4(),
  report_id uuid not null,
  curriculum_standard_id uuid not null references curriculum_standards(id),
  mapping_origin text not null,
  confidence numeric,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_curriculum_framework_country on curriculum_frameworks(country_id);
create index if not exists idx_curriculum_subject_framework on curriculum_subjects(framework_id);
create index if not exists idx_curriculum_level_framework on curriculum_levels(framework_id);
create index if not exists idx_curriculum_strand_framework on curriculum_strands(framework_id);
create index if not exists idx_curriculum_standard_framework on curriculum_standards(framework_id);
create index if not exists idx_curriculum_standard_code on curriculum_standards(official_code);

with inserted_country as (
  insert into curriculum_countries (code, name, sort_order)
  values ('us', 'United States', 1)
  on conflict (code) do update set name = excluded.name, is_active = true
  returning id
),
inserted_framework as (
  insert into curriculum_frameworks (country_id, code, name, framework_type, subject_scope, official_source_url, version_label)
  select
    c.id,
    'common-core',
    'Common Core State Standards',
    'national',
    'ela-literacy',
    'https://www.corestandards.org/ELA-Literacy/',
    '2021'
  from inserted_country c
  on conflict (country_id, code) do update
    set name = excluded.name,
        framework_type = excluded.framework_type,
        subject_scope = excluded.subject_scope,
        official_source_url = excluded.official_source_url,
        version_label = excluded.version_label
  returning id
),
inserted_subjects as (
  insert into curriculum_subjects (framework_id, code, name, sort_order)
  select f.id, subject.code, subject.name, subject.sort_order
  from inserted_framework f,
    (values
      ('ela-literature', 'English Language Arts', 100),
      ('ela-history', 'Literacy in History/Social Studies', 200),
      ('ela-science', 'Literacy in Science and Technical Subjects', 300)
    ) as subject(code, name, sort_order)
  on conflict (framework_id, code) do update set
    name = excluded.name,
    sort_order = excluded.sort_order
  returning id, code
),
inserted_levels as (
  insert into curriculum_levels (framework_id, official_level_label, normalized_level_label, normalized_sort_order, level_type, is_band, metadata)
  select
    f.id,
    level.official_label,
    level.normalized_label,
    level.normalized_sort,
    level.level_type,
    level.is_band,
    level.metadata::jsonb
  from inserted_framework f,
    (values
      ('K', 'Kindergarten', 0, 'grade', false, '{"notes":"Official kindergarten"}'),
      ('1', 'Grade 1', 1, 'grade', false, '{}'),
      ('2', 'Grade 2', 2, 'grade', false, '{}'),
      ('3', 'Grade 3', 3, 'grade', false, '{}'),
      ('4', 'Grade 4', 4, 'grade', false, '{}'),
      ('5', 'Grade 5', 5, 'grade', false, '{}'),
      ('6', 'Grade 6', 6, 'grade', false, '{}'),
      ('7', 'Grade 7', 7, 'grade', false, '{}'),
      ('8', 'Grade 8', 8, 'grade', false, '{}'),
      ('9-10', 'Grades 9-10', 9, 'band', true, '{"normalized_aliases":["Grade 9","Grade 10"]}'),
      ('11-12', 'Grades 11-12', 11, 'band', true, '{}')
    ) as level(official_label, normalized_label, normalized_sort, level_type, is_band, metadata)
  on conflict (framework_id, official_level_label) do update set
    normalized_level_label = excluded.normalized_level_label,
    normalized_sort_order = excluded.normalized_sort_order,
    level_type = excluded.level_type,
    is_band = excluded.is_band,
    metadata = excluded.metadata
  returning id
)
select 1;
