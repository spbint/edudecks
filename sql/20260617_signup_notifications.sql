create table if not exists public.signup_notifications (
  user_id uuid not null,
  notification_type text not null default 'new_user_signup',
  sent_at timestamptz null,
  created_at timestamptz not null default now(),
  attempted_at timestamptz null,
  status text not null default 'pending',
  source text null,
  referrer text null,
  last_error text null,
  primary key (user_id, notification_type),
  constraint signup_notifications_notification_type_not_blank
    check (char_length(btrim(notification_type)) > 0),
  constraint signup_notifications_status_check
    check (status in ('pending', 'sent', 'failed'))
);

create index if not exists signup_notifications_created_at_idx
  on public.signup_notifications (created_at desc);

create index if not exists signup_notifications_status_idx
  on public.signup_notifications (status, created_at desc);

alter table public.signup_notifications enable row level security;
