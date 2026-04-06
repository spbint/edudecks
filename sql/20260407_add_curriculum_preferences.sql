alter table family_profiles
  add column if not exists curriculum_preferences jsonb default '{}'::jsonb not null;
