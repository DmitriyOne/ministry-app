-- The three helpers the write functions are built from (ADR 0061). None
-- of them is callable from outside: set_ministry_status and
-- amend_ministry_status_month are security definer and call these as
-- their owner, so no PostgREST role needs execute.
--
-- They live in their own migration because each answers a question of
-- its own — what the catalogue says, which months may be written, and
-- how a correction is kept from spilling into other months — and each
-- can be reviewed without the other two.

-- ---------------------------------------------------------------------
-- 1. The catalogue, as the only place the numbers live
-- ---------------------------------------------------------------------
-- A client sends a status and, for the two choices that genuinely have a
-- number, hours. Everything else is derived here. This is the line that
-- keeps a publisher from sending themselves monthly_goal_hours = 50 and
-- becoming a pioneer in the data: the server never takes a number for a
-- status that has its own.
create or replace function public.ministry_status_shape(
  p_status text,
  p_monthly_goal smallint,
  out duration text,
  out monthly_goal_hours smallint
)
language plpgsql
immutable
set search_path = ''
as $$
begin
  case p_status
    when 'publisher' then
      duration := 'until_changed';
      -- The one number a person types. Null is a real answer.
      if p_monthly_goal is not null
        and p_monthly_goal not between 1 and 744 then
        raise exception 'monthly goal out of range: %', p_monthly_goal
          using errcode = 'check_violation';
      end if;
      monthly_goal_hours := p_monthly_goal;
    when 'auxiliary_pioneer' then
      -- The only one-month status, and the only one offering a choice of
      -- hours. 15 or 30 — nothing between, nothing else.
      duration := 'single_month';
      if p_monthly_goal is null or p_monthly_goal not in (15, 30) then
        raise exception 'auxiliary pioneer takes 15 or 30 hours, got %',
          p_monthly_goal using errcode = 'check_violation';
      end if;
      monthly_goal_hours := p_monthly_goal;
    when 'regular_auxiliary_pioneer' then
      duration := 'until_changed';
      monthly_goal_hours := 30;
    when 'regular_pioneer' then
      duration := 'until_changed';
      monthly_goal_hours := 50;
    else
      raise exception 'unknown ministry status: %', p_status
        using errcode = 'check_violation';
  end case;
end;
$$;

revoke all on function public.ministry_status_shape(text, smallint)
  from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- 2. Which months may be written at all
-- ---------------------------------------------------------------------
-- The phone's calendar decides the month (ADR 0061), which makes the
-- month an INPUT — so it gets fenced. Not to catch a forger (there is
-- nothing to gain by writing your own history) but to stop a device
-- whose clock says 2031 from planting a running row far in the future
-- that nobody would see for years.
--
-- The floor is deliberately expressed without any September knowledge:
-- the service-year rule lives in TypeScript, in one place, and a second
-- copy here would be a second calendar to keep in step. Eleven months
-- before the account's own first month covers the service year it was
-- created in, whichever month that was; the slack lets a person enter a
-- month or two from before they signed up, which is their own history
-- anyway.
create or replace function public.assert_ministry_month_writable(
  p_user uuid,
  p_month date
)
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_floor date;
begin
  if p_month <> date_trunc('month', p_month::timestamp)::date then
    raise exception 'month must be the first day of a month: %', p_month
      using errcode = 'check_violation';
  end if;

  select (date_trunc('month', created_at) - interval '11 months')::date
    into v_floor
    from public.profiles
   where id = p_user;

  if v_floor is not null and p_month < v_floor then
    raise exception 'month is before this account existed: %', p_month
      using errcode = 'check_violation';
  end if;

  -- Two months of slack: enough for "from next month" in any time zone
  -- (a phone at UTC+14 on the last evening of a month is already two
  -- months ahead of UTC's current one), far too little to be worth
  -- abusing.
  if p_month > (date_trunc('month', now()) + interval '2 months')::date then
    raise exception 'month is too far in the future: %', p_month
      using errcode = 'check_violation';
  end if;
end;
$$;

revoke all on function public.assert_ministry_month_writable(uuid, date)
  from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- 3. Keeping a correction to one month local
-- ---------------------------------------------------------------------
-- The owner's rule: changing ONE month must not change what any other
-- month shows. Carrying forward works against that — later months with
-- no row of their own read from this one — so before a correction the
-- next month is pinned to what it shows right now.
--
-- One extra row, never twelve: from that row on, the chain carries
-- forward again by itself, so every month after the next one is covered
-- too.
--
-- Both directions are covered. Changing a running row would have dragged
-- the following months with it; turning a one-month row into a running
-- one would have captured months that used to read from further back.
-- Resolving "what does the next month show" BEFORE the write handles
-- each the same way.
create or replace function public.freeze_ministry_month_after(
  p_user uuid,
  p_month date
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_next date := (p_month + interval '1 month')::date;
  v_effective public.ministry_status_months;
begin
  -- A row of their own after this month already governs everything
  -- later, so this month cannot reach past it: nothing to pin.
  if exists (
    select 1
      from public.ministry_status_months
     where user_id = p_user and deleted_at is null and month > p_month
  ) then
    return;
  end if;

  select *
    into v_effective
    from public.ministry_status_months
   where user_id = p_user
     and deleted_at is null
     and month <= v_next
     and (month = v_next or duration = 'until_changed')
   order by month desc
   limit 1;

  -- Nothing resolves when this person has no history at all, and then
  -- the next month shows the read rule's default. Writing it out makes
  -- that default explicit for one month, which is the price of the
  -- locality rule — and it changes nothing a person can see.
  insert into public.ministry_status_months
    (user_id, month, status, duration, monthly_goal_hours)
  values (
    p_user,
    v_next,
    coalesce(v_effective.status, 'publisher'),
    coalesce(v_effective.duration, 'until_changed'),
    v_effective.monthly_goal_hours
  )
  on conflict (user_id, month) do update
     set status = excluded.status,
         duration = excluded.duration,
         monthly_goal_hours = excluded.monthly_goal_hours,
         deleted_at = null;
end;
$$;

revoke all on function public.freeze_ministry_month_after(uuid, date)
  from public, anon, authenticated;
