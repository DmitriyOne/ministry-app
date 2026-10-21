-- Ministry status per month (ADR 0061): what a person has committed to
-- for a given month, and the monthly goal that follows from it. The
-- functions that read and write this table come in the next migrations;
-- this one is the shape and who may touch it.
--
-- "One row per month, written only when something changes": the status
-- for a month is the row for that month, or — when it has none — the
-- most recent EARLIER row that is still running. Three facts made this
-- the choice over date ranges (the alternatives are in the ADR):
--
--   * a one-month auxiliary pioneer ends itself. Its row is
--     'single_month', so the next month's lookup skips it and falls back
--     to the last running row. A range model needs a second row to close
--     the period, and a forgotten one leaves a month with no status.
--   * the primary key (user_id, month) IS the "no two statuses in one
--     month" rule, so no exclusion constraint and no btree_gist.
--   * the service-year boundary (September) is invisible here. Carrying
--     forward is not tied to a year, so 1 September needs no job, no
--     cron and no generated rows.
--
-- The goal hours are a SNAPSHOT: changing the catalogue later must not
-- rewrite what was true in a month already lived. The goal for a service
-- YEAR is deliberately not stored anywhere — it is the sum of the
-- monthly goals from September to August, computed by the app. A pioneer
-- appointed mid-year has a year goal of 50 × the months they were a
-- pioneer, and a stored 600 would have been wrong all year.

create table public.ministry_status_months (
  user_id uuid not null references auth.users on delete cascade,
  month date not null,
  status text not null,
  -- Derived from the status by the write functions, never sent by a
  -- client: it is a property of the catalogue, not of the choice.
  duration text not null,
  -- Null is a real value: a publisher with no goal at all.
  monthly_goal_hours smallint,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  primary key (user_id, month),
  constraint ministry_status_months_month_is_first_day
    check (month = date_trunc('month', month::timestamp)::date),
  constraint ministry_status_months_status check (status in (
    'publisher', 'auxiliary_pioneer', 'regular_auxiliary_pioneer',
    'regular_pioneer')),
  constraint ministry_status_months_duration
    check (duration in ('single_month', 'until_changed')),
  -- 744 = 31 × 24, the physical ceiling for a month. The catalogue's own
  -- numbers are enforced in ministry_status_shape; this is the backstop.
  constraint ministry_status_months_goal_range
    check (monthly_goal_hours is null or monthly_goal_hours between 1 and 744)
);

comment on table public.ministry_status_months is
  'One row per month in which a person''s ministry status changed. A month with no row inherits from the most recent earlier row whose duration is until_changed. Written only through set_ministry_status and amend_ministry_status_month. See ADR 0061.';

comment on column public.ministry_status_months.duration is
  'until_changed = holds every following month; single_month = this month only (the one-month auxiliary pioneer). Derived from the status, not supplied by the client.';

comment on column public.ministry_status_months.monthly_goal_hours is
  'Hours the person aims for in this month, snapshotted when the choice was made. Null means no goal (a publisher who set none).';

-- No separate index. The primary key index (user_id, month) serves the
-- only query shape there is — equality on user_id, range on month, read
-- backwards for `order by month desc limit 1` — and it covers both the
-- foreign key and the column the RLS policy filters on.

alter table public.ministry_status_months enable row level security;

-- Grants come to a new table in public automatically and policies do not
-- take them back (the same reasoning as every table before this one).
revoke all on table public.ministry_status_months from anon, authenticated;

-- Read directly, write only through the functions in the migrations that
-- follow. There is no insert, update or delete policy and no grant for
-- them, so direct writes are not "not implemented" — they do not exist
-- as a possibility. The rules a write has to obey (the month is a first
-- day and inside bounds, the status is in the catalogue, the hours come
-- from the catalogue, a correction to one month changes exactly that
-- month) cannot be expressed as a check constraint: half of them need
-- now(), the other half need the neighbouring rows.
grant select on table public.ministry_status_months to authenticated;
grant select, insert, update, delete on table public.ministry_status_months to service_role;

-- (select auth.uid()), not auth.uid(): wrapped in a subquery it is
-- evaluated once per statement instead of once per row.
create policy "read own ministry status" on public.ministry_status_months
  for select to authenticated
  using ((select auth.uid()) = user_id and deleted_at is null);

-- The table-agnostic trigger function from the profiles migration.
create trigger ministry_status_months_set_updated_at
  before update on public.ministry_status_months
  for each row execute function public.set_updated_at();
