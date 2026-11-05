-- A month that has been closed (ADR 0066). Closing is how a person says
-- "this month is reported, leave it alone": from then on the hours of
-- its days cannot be changed. Opening it again is one button away, and
-- that is deliberate — this is a guard against an accidental edit, not a
-- lock against the person who owns the row.
--
-- A living row means closed. There is no boolean and no status column:
-- the question is "is there a row", and reopening is the soft delete
-- every table here already does (ADR 0047).
--
-- Why a table of its own rather than a column on ministry_status_months:
-- a month in which the status did not change HAS NO ROW there at all —
-- it inherits from the most recent earlier row (ADR 0061). A column
-- would therefore have nowhere to live for exactly the months most
-- likely to be closed, and writing a status row just to carry a closure
-- would invent a change that never happened.
--
-- What closing does NOT do: take a copy of the numbers. The year's
-- summary goes on being computed from the same ministry_days rows, so
-- there is never a second figure for the same month to choose between
-- (the owner's decision, 2026-10-29). And it does not touch the ministry
-- STATUS of the month either: the status is the frame the hours are
-- measured against, and it is corrected from behind by design —
-- set_ministry_status_from exists for exactly that ("I have been a
-- pioneer since September", said in February). The price, named out
-- loud: a closed month's GOAL can still change afterwards; what it
-- served cannot.

create table public.ministry_month_closures (
  user_id uuid not null references auth.users on delete cascade,
  month date not null,
  -- When it was closed, kept separate from created_at: reopening and
  -- closing again is a new closure of the same row, and created_at would
  -- go on naming the first one.
  closed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  primary key (user_id, month),
  constraint ministry_month_closures_month_is_first_day
    check (month = date_trunc('month', month::timestamp)::date)
);

comment on table public.ministry_month_closures is
  'One row per month a person has closed; a living row means the hours of that month can no longer be written. Reopening marks the row deleted. Written only through close_ministry_month and reopen_ministry_month. See ADR 0066.';

comment on column public.ministry_month_closures.closed_at is
  'When this month was last closed. Separate from created_at, which names the first closure of a month that has been reopened and closed again.';

-- No separate index: the primary key (user_id, month) is the only query
-- shape there is — equality on both, one row — and it covers the foreign
-- key and the column the policy filters on.

alter table public.ministry_month_closures enable row level security;

-- Grants arrive with a new table in public and policies do not take them
-- back, so they are revoked explicitly — the same opening as every table
-- in this schema.
revoke all on table public.ministry_month_closures from anon, authenticated;

-- Read directly, write only through the two functions below. There is no
-- insert, update or delete policy and no grant for them: what a write
-- has to obey — that the month has actually finished — needs now(),
-- which a check constraint cannot have.
grant select on table public.ministry_month_closures to authenticated;
grant select, insert, update, delete on table public.ministry_month_closures to service_role;

-- (select auth.uid()) rather than auth.uid(): wrapped in a subquery it is
-- evaluated once per statement instead of once per row.
create policy "read own month closures" on public.ministry_month_closures
  for select to authenticated
  using ((select auth.uid()) = user_id and deleted_at is null);

-- The table-agnostic trigger function from the profiles migration.
create trigger ministry_month_closures_set_updated_at
  before update on public.ministry_month_closures
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- Asking
-- ---------------------------------------------------------------------
-- Internal, like ministry_status_shape: nothing outside the database
-- calls it. The screens read the row itself, under the policy above; this
-- exists so that the write path can ask the question without a policy
-- being involved at all.
create or replace function public.is_ministry_month_closed(
  p_user uuid,
  p_month date
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
      from public.ministry_month_closures as c
     where c.user_id = p_user
       and c.month = date_trunc('month', p_month::timestamp)::date
       and c.deleted_at is null
  );
$$;

comment on function public.is_ministry_month_closed(uuid, date) is
  'Whether this person has closed the month the given date falls in. Internal: the write path asks it, nothing outside the database does. See ADR 0066.';

revoke all on function public.is_ministry_month_closed(uuid, date)
  from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- Closing
-- ---------------------------------------------------------------------
-- Only a month that is over. The owner's rule (2026-10-29): the button
-- appears after midnight of the following month, so nothing can be
-- closed while it is still being lived.
--
-- The database measures that with a day of slack from UTC, the same way
-- set_ministry_day_minutes measures "a day that has not happened": at
-- the turn of a month the Earth holds two dates at once, and both are
-- somebody's present. The interface counts exactly, in the person's own
-- zone, and simply does not show the button before then.
--
-- What the slack admits, said plainly: on the LAST UTC day of a month,
-- this function accepts that month. Kiritimati (UTC+14) is already in
-- the next one by 10:00 UTC, and a strict fence would answer "not yet"
-- to somebody whose own calendar had turned — a button that is offered
-- and then refuses. The other side of the trade is that a caller who
-- goes around the interface can shut the month they are still living,
-- for the rest of that UTC day; nothing in the app offers it
-- (monthClosingState answers "hidden" until the person's own month has
-- turned), and one tap reopens it. The exposure is a day of a month
-- the person owns, which is why the slack points this way rather than
-- the other (ADR 0066, decision 6).
--
-- No floor. Somebody entering a year they served before this app existed
-- must be able to close those months too.
create or replace function public.close_ministry_month(p_month date)
returns public.ministry_month_closures
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
  v_month date := date_trunc('month', p_month::timestamp)::date;
  v_row public.ministry_month_closures;
begin
  if v_user is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;

  if (v_month + interval '1 month')::date > (v_utc_day + 1) then
    raise exception 'that month has not finished yet: %', v_month
      using errcode = 'check_violation';
  end if;

  -- do update, not do nothing: the primary key has no predicate, so a
  -- row left over from an earlier closure that was reopened would hold
  -- this month for good — the trap under the soft-delete rule (ADR
  -- 0047). Closing an already closed month is therefore the same row
  -- again, which is what makes a second tap harmless.
  insert into public.ministry_month_closures (user_id, month)
  values (v_user, v_month)
  on conflict (user_id, month) do update
     set closed_at = now(),
         deleted_at = null
  returning * into v_row;

  return v_row;
end;
$$;

comment on function public.close_ministry_month(date) is
  'Closes the month the given date falls in for the caller, after which its days cannot be written. Refuses a month that has not finished, with a day of slack from UTC. Closing twice is the same row. See ADR 0066.';

revoke all on function public.close_ministry_month(date) from public, anon;
grant execute on function public.close_ministry_month(date) to authenticated;

-- ---------------------------------------------------------------------
-- Opening it again
-- ---------------------------------------------------------------------
-- No conditions at all, by the owner's decision: the person who closed a
-- month may open it whenever they like. A month that was never closed is
-- not an error here — the statement simply matches nothing, and the
-- answer to "is it closed now" is the same either way.
create or replace function public.reopen_ministry_month(p_month date)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
begin
  if v_user is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;

  update public.ministry_month_closures
     set deleted_at = now()
   where user_id = v_user
     and month = date_trunc('month', p_month::timestamp)::date
     and deleted_at is null;
end;
$$;

comment on function public.reopen_ministry_month(date) is
  'Reopens the month the given date falls in for the caller, so its days can be written again. A month that was not closed is not an error. See ADR 0066.';

revoke all on function public.reopen_ministry_month(date) from public, anon;
grant execute on function public.reopen_ministry_month(date) to authenticated;
