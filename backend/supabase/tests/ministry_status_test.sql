begin;

create extension if not exists pgtap with schema extensions;

select plan(54);

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
-- Nothing writes this column in 2.2 (the owner's decision): it lives
-- with its default until there is a screen for changing it, and the
-- grant belongs to that screen's migration. An unused write privilege is
-- still a write privilege.
select ok(
  not has_column_privilege('authenticated', 'public.profiles', 'time_zone', 'update'),
  'nothing in the app may write the time zone yet'
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

-- A month ahead of UTC's: what a phone in Kiritimati sends on the last
-- evening of a month, when its own month has already turned. The sheet
-- never plans ahead (a choice is for the month under way), so this is
-- the far edge of the window — and it is what the carry-forward tests
-- below need in order to have a row to carry from.
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
-- Nothing is set ahead any more: a choice is for the month under way,
-- and the owner's rule is that there is no second, pending state to
-- explain. One month either side of UTC's is still somebody's now —
-- Kiritimati enters a month some fourteen hours before Midway leaves
-- the one before — and two months out is nobody's.
select throws_ok(
  $$select public.set_ministry_status(
      (date_trunc('month', now()) + interval '2 months')::date, 'publisher')$$,
  '23514',
  null,
  'a month two ahead belongs to no time zone and is refused'
);
select throws_ok(
  $$select public.set_ministry_status(
      (date_trunc('month', now()) - interval '2 months')::date, 'publisher')$$,
  '23514',
  null,
  'and neither does a month two back'
);
select throws_ok(
  $$select public.set_ministry_status(
      (date_trunc('month', now()) - interval '24 months')::date, 'publisher')$$,
  '23514',
  null,
  'a month long before the account existed is refused'
);

-- Choosing for the month under way drops whatever sat ahead of it. No
-- screen can put a row there any more, so in practice this clears what
-- an older build left or what this person's other phone wrote from a
-- zone whose month had already turned — and it is what stops such a row
-- from shadowing the choice made here.
select is(
  (select monthly_goal_hours from public.set_ministry_status(
    date_trunc('month', now())::date, 'auxiliary_pioneer', 15::smallint)),
  15::smallint,
  'the one-month auxiliary is written for this month'
);
select is(
  (select count(*) from public.ministry_status_months where deleted_at is null),
  1::bigint,
  'a row sitting ahead is swept by a choice for the month under way'
);
select is(
  (select count(*) from public.ministry_status_for_month(
    (date_trunc('month', now()) + interval '1 month')::date)),
  0::bigint,
  'a one-month status ends itself: the next month does not inherit it'
);

-- A date in the middle of a month asks about that month. The one-month
-- row above is the case that used to break: "this row is the month's
-- own" is an equality test, and it misses the 15th, so the answer came
-- from whatever ran before it — right month, wrong answer. Nothing in
-- the app can ask this way; the function no longer depends on that.
select is(
  (select monthly_goal_hours from public.ministry_status_for_month(
    date_trunc('month', now())::date + 14)),
  15::smallint,
  'a mid-month date is read as the month it falls in'
);
select is(
  (select count(*) from public.ministry_status_for_month(
    (date_trunc('month', now()) + interval '1 month')::date + 14)),
  0::bigint,
  'and the one-month status still ends itself when asked mid-month'
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

-- West of Greenwich in the first hours of a month, the month under way
-- is the one UTC has just left, and this is the save that used to come
-- back refused. It is accepted, it lands on that month — and it stops
-- there: the month UTC has already entered keeps its own row, which is
-- the whole of what the second sweep condition is for.
select is(
  (select monthly_goal_hours from public.set_ministry_status(
    (date_trunc('month', now()) - interval '1 month')::date,
    'publisher', 20::smallint)),
  20::smallint,
  'a phone still in last month may set its status there'
);
select is(
  (select monthly_goal_hours from public.ministry_status_for_month(
    (date_trunc('month', now()) - interval '1 month')::date)),
  20::smallint,
  'last month takes it'
);
select is(
  (select monthly_goal_hours from public.ministry_status_for_month(
    date_trunc('month', now())::date)),
  50::smallint,
  'and the month UTC is in keeps exactly what it showed'
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
  2::bigint,
  'and the second person has exactly the two months they wrote'
);

select * from finish();

rollback;
