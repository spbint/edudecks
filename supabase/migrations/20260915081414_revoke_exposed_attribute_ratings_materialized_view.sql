begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';

revoke all privileges
on table public.mv_latest_attribute_ratings
from public, anon, authenticated;

commit;
