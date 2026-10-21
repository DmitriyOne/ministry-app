-- Which calendar a person lives in (ADR 0061).
--
-- Months are decided by the phone, not by the server: the client sends
-- the month and the write functions only fence a broken clock. But the
-- PROFILE is rendered on the server, and a server has no way to know
-- which month the phone is in — so the zone is stored once, written by
-- the client from Intl.DateTimeFormat().resolvedOptions().timeZone.
--
-- 'Europe/London' as the default, to match the app's en-GB locale, and
-- not null so no caller has to handle the absent case.
--
-- The check is on SHAPE, not on existence: a zone NAME can only be
-- validated against pg_timezone_names, which a check constraint cannot
-- query. Nothing in SQL ever does `at time zone profiles.time_zone` —
-- a stored-but-unknown zone would then throw at read time and take the
-- screen with it. The only reader is TypeScript, which validates on the
-- way in and falls back to this default on the way out.
alter table public.profiles
  add column time_zone text not null default 'Europe/London'
    constraint profiles_time_zone_shape
      check (time_zone ~ '^[A-Za-z][A-Za-z0-9_+./-]{1,63}$');

comment on column public.profiles.time_zone is
  'IANA time zone this person''s device reported, e.g. "Europe/Moscow". Used to work out which month they are in. Defaults to Europe/London. See ADR 0061.';

-- A COLUMN grant, like display_name and whats_new_seen before it (ADR
-- 0043): the "update own profile" policy restricts the ROW and says
-- nothing about which columns may be written.
grant update (time_zone) on table public.profiles to authenticated;
