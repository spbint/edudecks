-- MyLearna Homeschool Free V1 platform abuse and cost circuit breakers.
--
-- This is not a billing or product entitlement system. It adds operational
-- controls around new family activation, evidence media uploads, and high-rate
-- mutations while preserving the existing 20-learner abuse ceiling and
-- 262144000-byte family/year evidence media quota.

create table if not exists public.mylearna_runtime_controls (
  control_key text primary key,
  is_enabled boolean not null default true,
  reason_code text null,
  updated_by_user_id uuid null,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint mylearna_runtime_controls_known_key_check
    check (control_key in ('new_family_activation', 'evidence_media_uploads')),
  constraint mylearna_runtime_controls_reason_code_check
    check (reason_code is null or reason_code ~ '^[a-z0-9_:-]{1,80}$')
);

insert into public.mylearna_runtime_controls (control_key, is_enabled, reason_code)
values
  ('new_family_activation', true, null),
  ('evidence_media_uploads', true, null)
on conflict (control_key) do nothing;

create table if not exists public.mylearna_mutation_rate_limit_buckets (
  scope_key text not null,
  action_key text not null,
  window_start timestamptz not null,
  window_seconds integer not null,
  hit_count integer not null default 0,
  expires_at timestamptz not null,
  updated_at timestamptz not null default now(),
  primary key (scope_key, action_key, window_start),
  constraint mylearna_mutation_rate_limit_action_check
    check (action_key in ('evidence_attachment_reservation', 'evidence_record_creation', 'learner_creation')),
  constraint mylearna_mutation_rate_limit_count_check
    check (window_seconds > 0 and hit_count >= 0)
);

create index if not exists mylearna_mutation_rate_limit_buckets_expires_idx
  on public.mylearna_mutation_rate_limit_buckets (expires_at);

create table if not exists public.mylearna_guardrail_event_buckets (
  event_key text not null,
  event_scope_key text not null,
  family_id uuid null,
  user_id uuid null,
  reason_code text not null,
  bucket_start timestamptz not null,
  event_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (event_key, reason_code, bucket_start, event_scope_key),
  constraint mylearna_guardrail_event_key_check
    check (event_key in ('signup_temporarily_blocked', 'evidence_upload_blocked', 'rate_limit_triggered', 'learner_abuse_ceiling_triggered')),
  constraint mylearna_guardrail_event_reason_code_check
    check (reason_code ~ '^[a-z0-9_:-]{1,80}$'),
  constraint mylearna_guardrail_event_count_check
    check (event_count >= 0)
);

create index if not exists mylearna_guardrail_event_buckets_updated_idx
  on public.mylearna_guardrail_event_buckets (updated_at);

alter table public.mylearna_runtime_controls enable row level security;
alter table public.mylearna_mutation_rate_limit_buckets enable row level security;
alter table public.mylearna_guardrail_event_buckets enable row level security;

revoke all on public.mylearna_runtime_controls from anon;
revoke all on public.mylearna_runtime_controls from authenticated;
revoke all on public.mylearna_mutation_rate_limit_buckets from anon;
revoke all on public.mylearna_mutation_rate_limit_buckets from authenticated;
revoke all on public.mylearna_guardrail_event_buckets from anon;
revoke all on public.mylearna_guardrail_event_buckets from authenticated;

create or replace function public.mylearna_runtime_control_enabled(p_control_key text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select case
    when p_control_key not in ('new_family_activation', 'evidence_media_uploads') then false
    else coalesce(
      (
        select control.is_enabled
        from public.mylearna_runtime_controls control
        where control.control_key = p_control_key
      ),
      true
    )
  end;
$$;

revoke all on function public.mylearna_runtime_control_enabled(text) from public;
grant execute on function public.mylearna_runtime_control_enabled(text) to authenticated;
grant execute on function public.mylearna_runtime_control_enabled(text) to service_role;

create or replace function public.mylearna_get_runtime_control_state(p_control_key text)
returns table (
  control_key text,
  is_enabled boolean,
  reason_code text
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Family workspace unavailable.' using errcode = '42501';
  end if;

  if p_control_key not in ('new_family_activation', 'evidence_media_uploads') then
    raise exception 'Runtime control unavailable.' using errcode = '22023';
  end if;

  return query
  select
    p_control_key,
    public.mylearna_runtime_control_enabled(p_control_key),
    (
      select control.reason_code
      from public.mylearna_runtime_controls control
      where control.control_key = p_control_key
    );
end;
$$;

revoke all on function public.mylearna_get_runtime_control_state(text) from public;
grant execute on function public.mylearna_get_runtime_control_state(text) to authenticated;

create or replace function public.mylearna_record_guardrail_event(
  p_event_key text,
  p_family_id uuid default null,
  p_reason_code text default 'blocked'
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  bucket timestamptz := date_trunc('hour', now());
  clean_reason text := coalesce(nullif(p_reason_code, ''), 'blocked');
  event_scope text := coalesce(p_family_id::text, 'no-family')
    || ':'
    || coalesce(auth.uid()::text, 'no-user');
begin
  if p_event_key not in (
    'signup_temporarily_blocked',
    'evidence_upload_blocked',
    'rate_limit_triggered',
    'learner_abuse_ceiling_triggered'
  ) then
    return;
  end if;

  delete from public.mylearna_guardrail_event_buckets
  where updated_at < now() - interval '30 days';

  insert into public.mylearna_guardrail_event_buckets (
    event_key,
    event_scope_key,
    family_id,
    user_id,
    reason_code,
    bucket_start,
    event_count
  )
  values (
    p_event_key,
    event_scope,
    p_family_id,
    auth.uid(),
    clean_reason,
    bucket,
    1
  )
  on conflict (event_key, reason_code, bucket_start, event_scope_key)
  do update set
    event_count = public.mylearna_guardrail_event_buckets.event_count + 1,
    updated_at = now();
end;
$$;

revoke all on function public.mylearna_record_guardrail_event(text, uuid, text) from public;
grant execute on function public.mylearna_record_guardrail_event(text, uuid, text) to service_role;

create or replace function public.mylearna_enforce_mutation_rate_limit(
  p_action_key text,
  p_family_id uuid,
  p_increment integer default 1
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  limit_count integer;
  window_seconds integer := 3600;
  current_window_start timestamptz;
  current_scope_key text;
  bucket_row public.mylearna_mutation_rate_limit_buckets;
  clean_increment integer := greatest(1, coalesce(p_increment, 1));
begin
  if auth.uid() is null or p_family_id is null or not public.is_family_member(p_family_id) then
    raise exception 'Family workspace unavailable.' using errcode = '42501';
  end if;

  limit_count := case p_action_key
    when 'evidence_attachment_reservation' then 120
    when 'evidence_record_creation' then 300
    when 'learner_creation' then 20
    else null
  end;

  if limit_count is null then
    raise exception 'Mutation control unavailable.' using errcode = '22023';
  end if;

  current_window_start := to_timestamp(
    floor(extract(epoch from now()) / window_seconds) * window_seconds
  );
  current_scope_key := p_family_id::text || ':' || auth.uid()::text;

  delete from public.mylearna_mutation_rate_limit_buckets
  where expires_at < now()
    and ctid in (
      select ctid
      from public.mylearna_mutation_rate_limit_buckets
      where expires_at < now()
      limit 500
    );

  insert into public.mylearna_mutation_rate_limit_buckets (
    scope_key,
    action_key,
    window_start,
    window_seconds,
    hit_count,
    expires_at
  )
  values (
    current_scope_key,
    p_action_key,
    current_window_start,
    window_seconds,
    0,
    current_window_start + make_interval(secs => window_seconds * 2)
  )
  on conflict (scope_key, action_key, window_start) do nothing;

  select *
  into bucket_row
  from public.mylearna_mutation_rate_limit_buckets bucket
  where bucket.scope_key = current_scope_key
    and bucket.action_key = p_action_key
    and bucket.window_start = current_window_start
  for update;

  if bucket_row.hit_count + clean_increment > limit_count then
    perform public.mylearna_record_guardrail_event(
      'rate_limit_triggered',
      p_family_id,
      p_action_key
    );

    raise exception 'That''s a lot of activity at once. Please wait a moment and try again.'
      using errcode = 'P0001';
  end if;

  update public.mylearna_mutation_rate_limit_buckets
  set hit_count = hit_count + clean_increment,
      updated_at = now()
  where scope_key = current_scope_key
    and action_key = p_action_key
    and window_start = current_window_start;
end;
$$;

revoke all on function public.mylearna_enforce_mutation_rate_limit(text, uuid, integer) from public;
grant execute on function public.mylearna_enforce_mutation_rate_limit(text, uuid, integer) to service_role;

create or replace function public.mylearna_enforce_new_family_activation_enabled()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.mylearna_runtime_control_enabled('new_family_activation') then
    perform public.mylearna_record_guardrail_event(
      'signup_temporarily_blocked',
      new.id,
      'new_family_activation_disabled'
    );

    raise exception 'MyLearna is temporarily pausing new family setup. Please try again shortly.'
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;

drop trigger if exists mylearna_new_family_activation_guard_before_insert on public.family_profiles;
create trigger mylearna_new_family_activation_guard_before_insert
before insert on public.family_profiles
for each row execute function public.mylearna_enforce_new_family_activation_enabled();

create or replace function public.mylearna_enforce_evidence_record_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.mylearna_enforce_mutation_rate_limit(
    'evidence_record_creation',
    new.family_id,
    1
  );

  return new;
end;
$$;

drop trigger if exists mylearna_evidence_record_rate_limit_before_insert on public.evidence_entries;
create trigger mylearna_evidence_record_rate_limit_before_insert
before insert on public.evidence_entries
for each row execute function public.mylearna_enforce_evidence_record_rate_limit();

create or replace function public.mylearna_enforce_learner_creation_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.mylearna_enforce_mutation_rate_limit(
    'learner_creation',
    new.family_id,
    1
  );

  return new;
end;
$$;

drop trigger if exists mylearna_learner_creation_rate_limit_before_insert on public.learners;
create trigger mylearna_learner_creation_rate_limit_before_insert
before insert on public.learners
for each row execute function public.mylearna_enforce_learner_creation_rate_limit();

create or replace function public.mylearna_enforce_learner_abuse_ceiling()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  existing_learner_count integer := 0;
begin
  perform 1
  from public.family_profiles
  where id = new.family_id
  for update;

  select count(*)
  into existing_learner_count
  from public.learners
  where family_id = new.family_id;

  if existing_learner_count >= 20 then
    perform public.mylearna_record_guardrail_event(
      'learner_abuse_ceiling_triggered',
      new.family_id,
      'learner_abuse_ceiling'
    );

    raise exception
      'We couldn''t add another learner to this family. Please contact MyLearna support if you need help.'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

create or replace function public.mylearna_reserve_evidence_attachment_upload(
  p_family_id uuid,
  p_learner_id uuid,
  p_evidence_entry_id uuid,
  p_object_path text,
  p_byte_size bigint
)
returns table (
  object_path text,
  family_id uuid,
  academic_year_id uuid,
  allowance_bytes bigint,
  used_bytes bigint,
  reserved_bytes bigint,
  remaining_bytes bigint
)
language plpgsql
security definer
set search_path = public, storage
as $$
declare
  evidence_row public.evidence_entries;
  target_year_id uuid;
  usage_row public.family_evidence_storage_usage;
begin
  if auth.uid() is null or not public.is_family_member(p_family_id) then
    raise exception 'Family workspace unavailable.' using errcode = '42501';
  end if;

  if not public.mylearna_runtime_control_enabled('evidence_media_uploads') then
    perform public.mylearna_record_guardrail_event(
      'evidence_upload_blocked',
      p_family_id,
      'evidence_media_uploads_disabled'
    );

    raise exception 'Media uploads are temporarily unavailable. You can still save a text learning record and use the rest of MyLearna.'
      using errcode = 'P0001';
  end if;

  perform public.mylearna_enforce_mutation_rate_limit(
    'evidence_attachment_reservation',
    p_family_id,
    1
  );

  if coalesce(p_byte_size, 0) <= 0 then
    raise exception 'Attachment size could not be confirmed.' using errcode = '22023';
  end if;

  if p_byte_size > 10485760 then
    raise exception 'Choose a file smaller than 10 MB.' using errcode = '23514';
  end if;

  if p_object_path is null
    or (storage.foldername(p_object_path))[1] <> 'family'
    or (storage.foldername(p_object_path))[2] <> p_family_id::text
    or (storage.foldername(p_object_path))[3] <> 'learner'
    or (storage.foldername(p_object_path))[4] <> p_learner_id::text
    or (storage.foldername(p_object_path))[5] <> 'evidence'
    or (storage.foldername(p_object_path))[6] <> p_evidence_entry_id::text
  then
    raise exception 'Attachment storage path does not match this evidence record.'
      using errcode = '22023';
  end if;

  select *
  into evidence_row
  from public.evidence_entries ee
  where ee.id = p_evidence_entry_id
    and ee.family_id = p_family_id
    and ee.learner_id = p_learner_id
    and public.is_family_member(ee.family_id)
  for update;

  if evidence_row.id is null then
    raise exception 'Evidence record could not be confirmed before uploading.'
      using errcode = '42501';
  end if;

  target_year_id := public.mylearna_resolve_evidence_academic_year_id(
    p_family_id,
    evidence_row.observed_on
  );

  if target_year_id is null then
    raise exception 'Add a learning year for this evidence date before uploading files.'
      using errcode = '23514';
  end if;

  insert into public.family_evidence_storage_usage (family_id, academic_year_id)
  values (p_family_id, target_year_id)
  on conflict (family_id, academic_year_id) do nothing;

  select *
  into usage_row
  from public.family_evidence_storage_usage usage
  where usage.family_id = p_family_id
    and usage.academic_year_id = target_year_id
  for update;

  perform public.mylearna_release_expired_evidence_storage_reservations(p_family_id, target_year_id);

  select *
  into usage_row
  from public.family_evidence_storage_usage usage
  where usage.family_id = p_family_id
    and usage.academic_year_id = target_year_id
  for update;

  if p_byte_size > greatest(0, usage_row.allowance_bytes - usage_row.used_bytes - usage_row.reserved_bytes) then
    raise exception 'Your Portfolio storage is full for this learning year. Everything you''ve already captured is safe. You can continue using MyLearna and adding text learning records.'
      using errcode = '23514';
  end if;

  insert into public.evidence_attachment_upload_reservations (
    family_id,
    learner_id,
    evidence_entry_id,
    academic_year_id,
    object_path,
    byte_size,
    created_by_user_id
  )
  values (
    p_family_id,
    p_learner_id,
    p_evidence_entry_id,
    target_year_id,
    p_object_path,
    p_byte_size,
    auth.uid()
  );

  update public.family_evidence_storage_usage
  set reserved_bytes = reserved_bytes + p_byte_size,
      updated_at = now()
  where family_id = p_family_id
    and academic_year_id = target_year_id
  returning * into usage_row;

  return query
  select
    p_object_path,
    usage_row.family_id,
    usage_row.academic_year_id,
    usage_row.allowance_bytes,
    usage_row.used_bytes,
    usage_row.reserved_bytes,
    greatest(0, usage_row.allowance_bytes - usage_row.used_bytes - usage_row.reserved_bytes);
end;
$$;

revoke all on function public.mylearna_reserve_evidence_attachment_upload(uuid, uuid, uuid, text, bigint) from public;
grant execute on function public.mylearna_reserve_evidence_attachment_upload(uuid, uuid, uuid, text, bigint) to authenticated;

create or replace function public.mylearna_evidence_attachment_upload_reserved(
  object_name text
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.mylearna_runtime_control_enabled('evidence_media_uploads')
    and exists (
      select 1
      from public.evidence_attachment_upload_reservations reservation
      where reservation.object_path = object_name
        and reservation.status = 'reserved'
        and reservation.created_by_user_id = auth.uid()
        and reservation.expires_at >= now()
    );
$$;

revoke all on function public.mylearna_evidence_attachment_upload_reserved(text) from public;
grant execute on function public.mylearna_evidence_attachment_upload_reserved(text) to authenticated;

create or replace function public.mylearna_apply_storage_insert_to_free_quota()
returns trigger
language plpgsql
security definer
set search_path = public, storage
as $$
declare
  reservation_row public.evidence_attachment_upload_reservations;
  usage_row public.family_evidence_storage_usage;
  evidence_row public.evidence_entries;
  target_year_id uuid;
  actual_size bigint;
begin
  if new.bucket_id <> 'evidence' then
    return new;
  end if;

  if not public.mylearna_runtime_control_enabled('evidence_media_uploads') then
    perform public.mylearna_record_guardrail_event(
      'evidence_upload_blocked',
      null,
      'evidence_media_uploads_disabled_storage_insert'
    );

    raise exception 'Media uploads are temporarily unavailable. You can still save a text learning record and use the rest of MyLearna.'
      using errcode = 'P0001';
  end if;

  actual_size := public.mylearna_storage_metadata_size_bytes(new.metadata);

  if actual_size <= 0 then
    raise exception 'Attachment size could not be confirmed.' using errcode = '22023';
  end if;

  if actual_size > 10485760 then
    raise exception 'Choose a file smaller than 10 MB.' using errcode = '23514';
  end if;

  select *
  into reservation_row
  from public.evidence_attachment_upload_reservations reservation
  where reservation.object_path = new.name
    and reservation.status = 'reserved'
  for update;

  if reservation_row.id is not null then
    select *
    into usage_row
    from public.family_evidence_storage_usage usage
    where usage.family_id = reservation_row.family_id
      and usage.academic_year_id = reservation_row.academic_year_id
    for update;

    if actual_size > greatest(0, usage_row.allowance_bytes - usage_row.used_bytes - (usage_row.reserved_bytes - reservation_row.byte_size)) then
      raise exception 'Your Portfolio storage is full for this learning year. Everything you''ve already captured is safe. You can continue using MyLearna and adding text learning records.'
        using errcode = '23514';
    end if;

    update public.family_evidence_storage_usage
    set reserved_bytes = greatest(0, reserved_bytes - reservation_row.byte_size),
        used_bytes = used_bytes + actual_size,
        updated_at = now()
    where family_id = reservation_row.family_id
      and academic_year_id = reservation_row.academic_year_id;

    update public.evidence_attachment_upload_reservations
    set status = 'uploaded',
        actual_byte_size = actual_size,
        uploaded_at = now(),
        updated_at = now()
    where id = reservation_row.id;

    return new;
  end if;

  select *
  into evidence_row
  from public.evidence_entries ee
  where ee.id::text = (storage.foldername(new.name))[6]
    and ee.family_id::text = (storage.foldername(new.name))[2]
    and ee.learner_id::text = (storage.foldername(new.name))[4];

  if evidence_row.id is null then
    raise exception 'Evidence record could not be confirmed before uploading.'
      using errcode = '42501';
  end if;

  target_year_id := public.mylearna_resolve_evidence_academic_year_id(
    evidence_row.family_id,
    evidence_row.observed_on
  );

  if target_year_id is null then
    raise exception 'Add a learning year for this evidence date before uploading files.'
      using errcode = '23514';
  end if;

  insert into public.family_evidence_storage_usage (family_id, academic_year_id)
  values (evidence_row.family_id, target_year_id)
  on conflict (family_id, academic_year_id) do nothing;

  select *
  into usage_row
  from public.family_evidence_storage_usage usage
  where usage.family_id = evidence_row.family_id
    and usage.academic_year_id = target_year_id
  for update;

  if actual_size > greatest(0, usage_row.allowance_bytes - usage_row.used_bytes - usage_row.reserved_bytes) then
    raise exception 'Your Portfolio storage is full for this learning year. Everything you''ve already captured is safe. You can continue using MyLearna and adding text learning records.'
      using errcode = '23514';
  end if;

  update public.family_evidence_storage_usage
  set used_bytes = used_bytes + actual_size,
      updated_at = now()
  where family_id = evidence_row.family_id
    and academic_year_id = target_year_id;

  return new;
end;
$$;
