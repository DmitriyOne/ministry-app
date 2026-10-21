begin;

create extension if not exists pgtap with schema extensions;

select plan(48);

-- What this file is really about: the rules that live nowhere else.
-- The carry-forward rule, the catalogue's numbers, the month bounds and
-- the locality of a correction are all invisible in TypeScript — the app
-- just calls a function and believes the answer. So each of them is
-- pinned here, together with the three traps underneath them: a row
-- marked deleted holding its month for good (ADR 0047), a security
-- definer function that forgets to scope by auth.uid(), and a
-- forward-looking choice that reaches backwards into months already
-- lived (found on review, fixed in the write migration).
--
-- Every date is derived from now(), never written out, so the file does
-- not start failing in November.

-- ---------------------------------------------------------------------
-- profiles.time_zone
-- ---------------------------------------------------------------------
select has_column('public', 'profiles', 'time_zone',
  'profiles carries the time zone the device reported');
select col_default_is('public', 'profiles', 'time_zone', 'Europe/London',
  'the default matches the app locale, so no caller handles an absent zone');
select col_not_null('public', 'profiles', 'time_zone',
  'time_zone is not null');
select ok(
  has_column_privilege('authenticated', 'public.profiles', 'time_zone', 'update'),
  'a person may write their own time zone'
);

-- Shape only — a zone NAME can only be checked against
-- pg_timezone_names, which a check constraint cannot query.
select throws_ok(
  $$update public.profiles set time_zone = 'Europe Moscow'$$,
  '23514',
  null,
  'a malformed zone is refused by the shape constraint'
);

-- ---------------------------------------------------------------------
-- The table and who may touch it
-- ---------------------------------------------------------------------
select has_table('public', 'ministry_status_months',
  'the months table exists');
select ok(
  (select relrowsecurity from pg_class
    where oid = 'public.ministry_status_months'::regclass),
  'row level security is on'
);
select ok(
  has_table_privilege('authenticated', 'public.ministry_status_months', 'select'),
  'a person reads their own months directly'
);

-- The three that must NOT be there: every write goes through a function
-- that validates, so direct writes are impossible rather than unused.
select ok(
  not has_table_privilege('authenticated', 'public.ministry_status_months', 'insert'),
  'no direct insert'
);
select ok(
  not has_table_privilege('authenticated', 'public.ministry_status_months', 'update'),
  'no direct update'
);
select ok(
  not has_table_privilege('authenticated', 'public.ministry_status_months', 'delete'),
  'no direct delete'
);
select has_trigger('public', 'ministry_status_months',
  'ministry_status_months_set_updated_at',
  'updated_at is maintained by the shared trigger function');

-- The backstops in the table itself, tested as the owner because no
-- client can reach them.
select throws_ok(
  $$insert into public.ministry_status_months
      (user_id, month, status, duration, monthly_goal_hours)
    values (
      (select id from auth.users limit 1),
      (date_trunc('month', now()) + interval '14 days')::date,
      'publisher', 'until_changed', null)$$,
  '23514',
  null,
  'a month that is not the first of a month is refused'
);
select throws_ok(
  $$insert into public.ministry_status_months
      (user_id, month, status, duration, monthly_goal_hours)
    values (
      (select id from auth.users limit 1),
      date_trunc('month', now())::date,
      'publisher', 'until_changed', 745)$$,
  '23514',
  null,
  'more hours than a month physically has is refused'
);

-- The internal helpers stay internal: the write functions call them as
-- their owner, so no PostgREST role needs them.
select ok(
  not has_function_privilege('authenticated',
    'public.ministry_status_shape(text, smallint)', 'execute'),
  'the catalogue function is not callable from outside'
);
select ok(
  not has_function_privilege('authenticated',
    'public.freeze_ministry_month_after(uuid, date)', 'execute'),
  'nor is the one that pins the next month'
);
select ok(
  not has_function_privilege('anon',
    'public.set_ministry_status(date, text, smallint)', 'execute'),
  'anon cannot set a status'
);
select ok(
  has_function_privilege('authenticated',
    'public.set_ministry_status(date, text, smallint)', 'execute'),
  'a signed-in person can set a status'
);

-- ---------------------------------------------------------------------
-- Two people. "Their own rows" is only a real restriction with two.
-- handle_new_user creates the profiles.
-- ---------------------------------------------------------------------
insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'one@jw.fenko.dev'),
  ('22222222-2222-2222-2222-222222222222', 'two@jw.fenko.dev');

set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';

-- Becoming a regular pioneer from next month: the forward intent, which
-- is what the sheet in the profile does.
select is(
  (select monthly_goal_hours from public.set_ministry_status(
    (date_trunc('month', now()) + interval '1 month')::date,
    'regular_pioneer')),
  50::smallint,
  'the server fills in the pioneer''s hours; the client never sends them'
);
select is(
  (select duration from public.ministry_status_months
    where month = (date_trunc('month', now()) + interval '1 month')::date),
  'until_changed',
  'a pioneer holds every following month until it is changed'
);
select is(
  (select month from public.ministry_status_for_month(
    (date_trunc('month', now()) + interval '1 month')::date)),
  (date_trunc('month', now()) + interval '1 month')::date,
  'the month with a row of its own reads from that row'
);
select is(
  (select monthly_goal_hours from public.ministry_status_for_month(
    (date_trunc('month', now()) + interval '2 months')::date)),
  50::smallint,
  'the month after it carries forward'
);

-- Twelve months on crosses 1 September. Nothing happens there: carrying
-- forward is not tied to the service year, which is why no cron and no
-- generated rows exist.
select is(
  (select monthly_goal_hours from public.ministry_status_for_month(
    (date_trunc('month', now()) + interval '12 months')::date)),
  50::smallint,
  'the status survives the turn of the service year by itself'
);
select is(
  (select count(*) from public.ministry_status_for_month(
    date_trunc('month', now())::date)),
  0::bigint,
  'a month BEFORE the first row has no status: the read rule''s default'
);

-- The catalogue refuses what it does not offer.
select throws_ok(
  $$select public.set_ministry_status(
      date_trunc('month', now())::date, 'auxiliary_pioneer', 20::smallint)$$,
  '23514',
  null,
  'an auxiliary pioneer takes 15 or 30 hours, nothing in between'
);
select throws_ok(
  $$select public.set_ministry_status(
      date_trunc('month', now())::date, 'special_pioneer')$$,
  '23514',
  null,
  'a status outside the catalogue is refused'
);
select throws_ok(
  $$select public.set_ministry_status(
      (date_trunc('month', now()) + interval '6 months')::date, 'publisher')$$,
  '23514',
  null,
  'a device whose clock runs months fast cannot plant a row in the future'
);
select throws_ok(
  $$select public.set_ministry_status(
      (date_trunc('month', now()) - interval '24 months')::date, 'publisher')$$,
  '23514',
  null,
  'a month long before the account existed is refused'
);

-- The defect found on review. "From this month on" sweeps away what is
-- planned LATER, so starting it in a month already lived would sweep
-- away months somebody has actually served. It is refused outright, and
-- corrections go through amend_ministry_status_month instead.
select throws_ok(
  $$select public.set_ministry_status(
      (date_trunc('month', now()) - interval '1 month')::date, 'publisher')$$,
  '23514',
  null,
  'a forward-looking choice cannot start in a month already lived'
);

-- Forward intent, part two: choosing for THIS month drops the plan that
-- was sitting on next month, because otherwise the new choice would stop
-- dead at it. Nothing lived is touched — next month has not happened.
select is(
  (select monthly_goal_hours from public.set_ministry_status(
    date_trunc('month', now())::date, 'auxiliary_pioneer', 15::smallint)),
  15::smallint,
  'the one-month auxiliary is written for this month'
);
select is(
  (select count(*) from public.ministry_status_months where deleted_at is null),
  1::bigint,
  'the month planned later is dropped by a choice that starts earlier'
);
select is(
  (select count(*) from public.ministry_status_for_month(
    (date_trunc('month', now()) + interval '1 month')::date)),
  0::bigint,
  'a one-month status ends itself: the next month does not inherit it'
);

-- Correcting a month already lived. There is a row after it (this
-- month's), so that row already governs what follows and there is
-- nothing to pin — the proof is that this month keeps its own 15.
select is(
  (select monthly_goal_hours from public.amend_ministry_status_month(
    (date_trunc('month', now()) - interval '1 month')::date,
    'regular_auxiliary_pioneer')),
  30::smallint,
  'a regular auxiliary pioneer is 30 hours every month'
);
select is(
  (select monthly_goal_hours from public.ministry_status_for_month(
    date_trunc('month', now())::date)),
  15::smallint,
  'correcting last month left this month exactly as it was'
);
select is(
  (select monthly_goal_hours from public.ministry_status_for_month(
    (date_trunc('month', now()) - interval '1 month')::date)),
  30::smallint,
  'and last month took the correction'
);

-- Now the case the pinning exists for: correcting a month with NOTHING
-- after it. Next month currently shows 30, inherited from the month
-- before; without the pin it would start showing 50 the moment this
-- month becomes a pioneer's.
select is(
  (select monthly_goal_hours from public.amend_ministry_status_month(
    date_trunc('month', now())::date, 'regular_pioneer')),
  50::smallint,
  'this month takes the correction'
);
select is(
  (select monthly_goal_hours from public.ministry_status_for_month(
    (date_trunc('month', now()) + interval '1 month')::date)),
  30::smallint,
  'the next month still shows what it showed before the correction'
);
select is(
  (select month from public.ministry_status_for_month(
    (date_trunc('month', now()) + interval '1 month')::date)),
  (date_trunc('month', now()) + interval '1 month')::date,
  'and it shows it from a row of its own: the correction pinned it'
);
select is(
  (select monthly_goal_hours from public.ministry_status_for_month(
    (date_trunc('month', now()) - interval '1 month')::date)),
  30::smallint,
  'the month before the correction is untouched'
);

-- A forward choice sweeps that pinned row away again, because the pin
-- was only there to protect the correction.
select is(
  (select monthly_goal_hours from public.set_ministry_status(
    date_trunc('month', now())::date, 'publisher', 20::smallint)),
  20::smallint,
  'a publisher may set a goal of their own'
);
select is(
  (select month from public.ministry_status_for_month(
    (date_trunc('month', now()) + interval '1 month')::date)),
  date_trunc('month', now())::date,
  'the pinned row is gone and the next month inherits again'
);

-- The soft-delete trap: the row for next month is marked deleted, not
-- removed, and the primary key has no predicate — so without the
-- resurrecting upsert this call fails with a duplicate key.
select is(
  (select monthly_goal_hours from public.amend_ministry_status_month(
    (date_trunc('month', now()) + interval '1 month')::date,
    'regular_auxiliary_pioneer')),
  30::smallint,
  'a month swept away earlier can be written again'
);
select is(
  (select count(*) from public.ministry_status_months
    where month = (date_trunc('month', now()) + interval '1 month')::date),
  1::bigint,
  'and that leaves one row for the month, not two'
);

-- ---------------------------------------------------------------------
-- The other person
-- ---------------------------------------------------------------------
set local request.jwt.claims = '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';

select is(
  (select count(*) from public.ministry_status_months),
  0::bigint,
  'somebody else''s months are not visible at all'
);
select is(
  (select count(*) from public.ministry_status_for_month(
    date_trunc('month', now())::date)),
  0::bigint,
  'and the read function answers for the caller, not for whoever has rows'
);

-- The definer-function trap: if set_ministry_status scoped by anything
-- other than auth.uid(), this call would land on the first person's row.
select is(
  (select user_id from public.set_ministry_status(
    date_trunc('month', now())::date, 'regular_pioneer')),
  '22222222-2222-2222-2222-222222222222'::uuid,
  'a write lands on the caller''s own row'
);

reset role;

select is(
  (select monthly_goal_hours from public.ministry_status_months
    where user_id = '11111111-1111-1111-1111-111111111111'
      and month = date_trunc('month', now())::date
      and deleted_at is null),
  20::smallint,
  'the first person''s month is still theirs after the second one wrote'
);
select is(
  (select count(*) from public.ministry_status_months
    where user_id = '22222222-2222-2222-2222-222222222222'
      and deleted_at is null),
  1::bigint,
  'and the second person has exactly the one month they wrote'
);

select * from finish();

rollback;
