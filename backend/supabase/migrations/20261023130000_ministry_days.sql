-- Hours served, one row per day (ADR 0062). This is the table the hours
-- card on /day has been waiting for: until now it dialled a number into
-- React state and a reload put it back to zero (ADR 0060).
--
-- Minutes, not hours: the card moves in five-minute steps, so hours
-- would be a fraction and a fraction is a rounding question on every
-- read. A smallint of minutes answers it once — 1440 fits, and the whole
-- app already formats minutes (formatHours).
--
-- One row per day, keyed (user_id, day), because a day has one total.
-- The alternative — a row per session, summed on read — buys a history
-- nobody asked for and makes "what did I do on Tuesday" a group-by; the
-- card edits a single number, so the table stores a single number.
--
-- No row for a day means NOTHING IS KNOWN about it; a row with zero
-- means somebody looked and there was nothing. Both read as a dash on
-- screen, and the difference matters only to the write path: setting a
-- day to zero keeps the row rather than deleting it, so the next write
-- is the same upsert as any other.

create table public.ministry_days (
  user_id uuid not null references auth.users on delete cascade,
  day date not null,
  minutes smallint not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  primary key (user_id, day),
  -- 1440 = 24 × 60. The same ceiling the card enforces in the browser
  -- (MAX_DAY_MINUTES); this is the backstop under it, because the card
  -- is a convenience and the table is the authority.
  constraint ministry_days_minutes_range check (minutes between 0 and 1440)
);

comment on table public.ministry_days is
  'Minutes of ministry on one day, one row per person per day. No row means nothing is known about that day; zero means nothing was served. Written only through set_ministry_day_minutes. See ADR 0062.';

comment on column public.ministry_days.minutes is
  'Whole minutes, 0 to 1440. Minutes rather than hours so that a five-minute step is an integer everywhere.';

-- No separate index. The primary key index (user_id, day) serves every
-- query the app makes — equality on user_id with a range on day (the
-- seven-day strip, a month, a service year) — and it covers both the
-- foreign key and the column the RLS policy filters on. A partial index
-- `where deleted_at is null` would be smaller, but these ranges are tens
-- of rows per person, so it would pay for itself in nothing and cost a
-- second index on every write.

alter table public.ministry_days enable row level security;

-- Grants arrive with a new table in public and policies do not take them
-- back, so they are revoked explicitly — the same opening as every table
-- in this schema.
revoke all on table public.ministry_days from anon, authenticated;

-- Read directly, write only through the function below. There is no
-- insert, update or delete policy and no grant for them: a direct write
-- is not unimplemented, it does not exist as a possibility. What a write
-- has to obey — minutes inside the day, and no day that has not happened
-- yet for this person — needs now(), which a check constraint cannot
-- have.
grant select on table public.ministry_days to authenticated;
grant select, insert, update, delete on table public.ministry_days to service_role;

-- (select auth.uid()) rather than auth.uid(): wrapped in a subquery it is
-- evaluated once per statement instead of once per row.
create policy "read own ministry days" on public.ministry_days
  for select to authenticated
  using ((select auth.uid()) = user_id and deleted_at is null);

-- The table-agnostic trigger function from the profiles migration.
create trigger ministry_days_set_updated_at
  before update on public.ministry_days
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- Writing a day
-- ---------------------------------------------------------------------
-- Every tap on the card calls this: the card saves itself, with no Save
-- button, so the function has to be cheap and idempotent. It is both —
-- one upsert, and sending the same number twice is the same row.
--
-- Unlike the ministry STATUS (ADR 0061, decision 9), a past day is
-- freely writable, and that is the point rather than an oversight: the
-- day screen pages backwards precisely so that Tuesday can be filled in
-- on Thursday. What is refused is a day that has not happened.
--
-- "Has not happened" is measured one day either side of UTC, for the
-- reason the status window has the same slack: at the turn of a day the
-- Earth holds two dates at once — Kiritimati enters tomorrow some
-- fourteen hours before Midway leaves today — and both are somebody's
-- present. Two days out is nobody's.
--
-- There is deliberately no floor. A day far in the past is worth nothing
-- to an attacker (it is their own row, inside their own total) and every
-- floor that suggested itself — the account's creation, a fixed year —
-- would refuse a legitimate backfill by somebody recording a year they
-- served before this app existed.
create or replace function public.set_ministry_day_minutes(
  p_day date,
  p_minutes smallint
)
returns public.ministry_days
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  -- UTC named outright rather than left to the session: the fence below
  -- is measured from this value, and a role with another TimeZone
  -- setting would quietly move it.
  v_utc_day date := (now() at time zone 'utc')::date;
  v_row public.ministry_days;
begin
  if v_user is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;

  -- Said here as well as in the constraint so that the answer to a
  -- malformed call names the value; the constraint is what guarantees it.
  if p_minutes is null or p_minutes < 0 or p_minutes > 1440 then
    raise exception 'minutes must be between 0 and 1440: %', p_minutes
      using errcode = 'check_violation';
  end if;

  if p_day > (v_utc_day + 1) then
    raise exception 'that day has not happened yet: %', p_day
      using errcode = 'check_violation';
  end if;

  -- do update, not do nothing: the resurrection of deleted_at is what
  -- makes a day usable again after a sweep. The primary key has no
  -- predicate, so a row marked deleted holds its day for good otherwise
  -- — the trap underneath the soft-delete rule (ADR 0047).
  insert into public.ministry_days (user_id, day, minutes)
  values (v_user, p_day, p_minutes)
  on conflict (user_id, day) do update
     set minutes = excluded.minutes,
         deleted_at = null
  returning * into v_row;

  return v_row;
end;
$$;

comment on function public.set_ministry_day_minutes(date, smallint) is
  'Records the minutes served on one day for the caller, replacing whatever that day held. Accepts any day up to one past UTC''s, so a day that has not happened is refused while every time zone can write its own today. See ADR 0062.';

revoke all on function public.set_ministry_day_minutes(date, smallint)
  from public, anon;
grant execute on function public.set_ministry_day_minutes(date, smallint)
  to authenticated;
