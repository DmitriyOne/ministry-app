begin;

create extension if not exists pgtap with schema extensions;

select plan(85);

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

-- And the correction is callable by NOBODY (ADR 0072). It was granted to
-- `authenticated` on the expectation of a screen that never arrived, and
-- a grant with no caller is still an endpoint: it is the only route to a
-- month outside the window set_ministry_status fences itself to,
-- including a month already closed. The calls below therefore run as the
-- owner, which is also the honest shape of the test — the rules it pins
-- are the function's, not the app's.
select ok(
  not has_function_privilege('authenticated',
    'public.amend_ministry_status_month(date, text, smallint)', 'execute'),
  'a signed-in person cannot correct a month: no screen offers it'
);
select ok(
  not has_function_privilege('anon',
    'public.amend_ministry_status_month(date, text, smallint)', 'execute'),
  'and anon cannot either'
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
-- As the owner: execute was revoked from every PostgREST role
-- (ADR 0072). The claims stay set, so auth.uid() still names the
-- person whose month this is.
reset role;
select is(
  (select monthly_goal_hours from public.amend_ministry_status_month(
    (date_trunc('month', now()) - interval '1 month')::date,
    'regular_auxiliary_pioneer')),
  30::smallint,
  'a regular auxiliary pioneer is 30 hours every month'
);
set local role authenticated;
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
-- As the owner again, for the same reason.
reset role;
select is(
  (select monthly_goal_hours from public.amend_ministry_status_month(
    date_trunc('month', now())::date, 'regular_pioneer')),
  50::smallint,
  'this month takes the correction'
);
set local role authenticated;
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
-- As the owner again, for the same reason.
reset role;
select is(
  (select monthly_goal_hours from public.amend_ministry_status_month(
    (date_trunc('month', now()) + interval '1 month')::date,
    'regular_auxiliary_pioneer')),
  30::smallint,
  'a month swept away earlier can be written again'
);
set local role authenticated;
select is(
  (select count(*) from public.ministry_status_months
    where month = (date_trunc('month', now()) + interval '1 month')::date),
  1::bigint,
  'and that leaves one row for the month, not two'
);

-- The yearly norm belongs to a regular pioneer and to nobody else. This
-- person is a publisher this month and a regular auxiliary pioneer from
-- the next one — twelve months with goals in them, and not one hour of
-- it is a year's norm.
select is(
  public.ministry_status_year_goal(date_trunc('month', now())::date),
  0,
  'a publisher and an auxiliary pioneer have no yearly norm at all'
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

-- A regular pioneer from this month on: every one of the twelve months
-- reads from that row, so the year is the number people know.
select is(
  public.ministry_status_year_goal(date_trunc('month', now())::date),
  600,
  'twelve pioneered months come to 600'
);
-- And a year that starts one month earlier counts eleven of them: that
-- month is this person's publisher month, which carries no norm. This is
-- the appointed-mid-year case, where a stored 600 would have been wrong
-- from the first day to the last.
select is(
  public.ministry_status_year_goal((date_trunc('month', now()) - interval '1 month')::date),
  550,
  'a year only partly pioneered counts only the months that were'
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


-- ---------------------------------------------------------------------
-- "I have been on this status since September" — set_ministry_status_from
-- ---------------------------------------------------------------------
-- The third intention (ADR 0061, update 2026-10-29). A pioneer who only
-- signs up in February still served from September, and the year has to
-- add up to its 600 hours. Neither existing function can say that:
-- set_ministry_status refuses any month but the one under way, and
-- amend_ministry_status_month pins the month after it so a correction
-- cannot spread.
--
-- A third person, so the rows below start from nothing.
insert into auth.users (id, email) values
  ('33333333-3333-3333-3333-333333333333', 'three@jw.fenko.dev');

set local role authenticated;
set local request.jwt.claims = '{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}';

select ok(
  has_function_privilege('authenticated',
    'public.set_ministry_status_from(date, text, smallint, date)', 'execute'),
  'a signed-in person may say since when'
);
select ok(
  not has_function_privilege('anon',
    'public.set_ministry_status_from(date, text, smallint, date)', 'execute'),
  'and anon may not'
);

-- The history this is meant to overwrite: a publisher month marked in
-- between, which without the sweep would shadow the backdated row for
-- every month after it.
select is(
  (select status from public.set_ministry_status(
    (date_trunc('month', now()) - interval '1 month')::date, 'publisher')),
  'publisher',
  'a month in between is marked first, so the sweep has something to do'
);

select is(
  (select monthly_goal_hours from public.set_ministry_status_from(
    (date_trunc('month', now()) - interval '3 months')::date,
    'regular_pioneer')),
  50::smallint,
  'the pioneer is written three months back, where set_ministry_status refuses to reach'
);
select is(
  (select count(*) from public.ministry_status_months
    where user_id = '33333333-3333-3333-3333-333333333333'
      and deleted_at is null),
  1::bigint,
  'and the month marked in between is swept: one row governs them all'
);
select is(
  (select monthly_goal_hours from public.ministry_status_for_month(
    (date_trunc('month', now()) - interval '2 months')::date)),
  50::smallint,
  'a month between the start and now reads the pioneer'
);
select is(
  (select monthly_goal_hours from public.ministry_status_for_month(
    date_trunc('month', now())::date)),
  50::smallint,
  'and so does the month under way, which is the whole point'
);
select is(
  (select user_id from public.ministry_status_months
    where deleted_at is null
      and month = (date_trunc('month', now()) - interval '3 months')::date),
  '33333333-3333-3333-3333-333333333333'::uuid,
  'the definer function wrote the caller''s own row, not the first one it found'
);

-- A one-month status cannot be backdated: "auxiliary pioneer since
-- September" is not a statement this table can hold — it would mean one
-- month, and the one it would mean is in the past.
select throws_ok(
  $$select public.set_ministry_status_from(
      (date_trunc('month', now()) - interval '3 months')::date,
      'auxiliary_pioneer', 15::smallint)$$,
  '23514',
  null,
  'a status that lasts one month cannot be backdated'
);
-- The shared fence still holds in both directions.
select throws_ok(
  $$select public.set_ministry_status_from(
      (date_trunc('month', now()) - interval '24 months')::date, 'regular_pioneer')$$,
  '23514',
  null,
  'and neither can a month from before the account existed'
);
select throws_ok(
  $$select public.set_ministry_status_from(
      (date_trunc('month', now()) + interval '6 months')::date, 'regular_pioneer')$$,
  '23514',
  null,
  'nor one far in the future: this function reaches back, never forward'
);

reset role;


-- ---------------------------------------------------------------------
-- A one-month status ends the assignment behind it
-- ---------------------------------------------------------------------
-- The owner's rule (2026-10-29), found through the year's figure: with
-- September set to regular pioneer and this month taken as a one-month
-- auxiliary pioneer, the month after reached back PAST the auxiliary row
-- and was a pioneer again — eleven months of the year were still counted
-- as pioneered. Choosing the auxiliary row means the appointment is
-- over, so the next month is written out as a publisher.
insert into auth.users (id, email) values
  ('44444444-4444-4444-4444-444444444444', 'four@jw.fenko.dev');

set local role authenticated;
set local request.jwt.claims = '{"sub":"44444444-4444-4444-4444-444444444444","role":"authenticated"}';

select is(
  (select status from public.set_ministry_status_from(
    (date_trunc('month', now()) - interval '1 month')::date, 'regular_pioneer')),
  'regular_pioneer',
  'a pioneer from last month on'
);
select is(
  (select status from public.set_ministry_status(
    date_trunc('month', now())::date, 'auxiliary_pioneer', 30::smallint)),
  'auxiliary_pioneer',
  'and a month of auxiliary pioneering now'
);
select is(
  (select status from public.ministry_status_for_month(
    (date_trunc('month', now()) + interval '1 month')::date)),
  'publisher',
  'the month after a one-month status is a publisher, not the pioneer again'
);
select is(
  (select monthly_goal_hours from public.ministry_status_for_month(
    (date_trunc('month', now()) + interval '1 month')::date)),
  null::smallint,
  'and it carries no goal: the 50 belonged to the appointment that ended'
);
select is(
  public.ministry_status_year_goal((date_trunc('month', now()) - interval '1 month')::date),
  50,
  'so the year counts the one month actually pioneered'
);

reset role;

-- A publisher's own number is not an appointment and survives the same
-- move: a month of auxiliary pioneering, and then back to the goal they
-- set themselves. A fifth person, because the goal has to be set in an
-- EARLIER month than the auxiliary one — a month holds one row, so a
-- publisher who sets 20 and then takes the auxiliary row in the same
-- month has overwritten their own number, and there is nothing left to
-- come back to.
insert into auth.users (id, email) values
  ('55555555-5555-5555-5555-555555555555', 'five@jw.fenko.dev');

set local role authenticated;
set local request.jwt.claims = '{"sub":"55555555-5555-5555-5555-555555555555","role":"authenticated"}';

select is(
  (select monthly_goal_hours from public.set_ministry_status(
    (date_trunc('month', now()) - interval '1 month')::date, 'publisher', 20::smallint)),
  20::smallint,
  'a publisher sets a goal of their own last month'
);
select is(
  (select monthly_goal_hours from public.set_ministry_status(
    date_trunc('month', now())::date, 'auxiliary_pioneer', 15::smallint)),
  15::smallint,
  'then takes a month of auxiliary pioneering'
);
select is(
  (select status from public.ministry_status_for_month(
    (date_trunc('month', now()) + interval '1 month')::date)),
  'publisher',
  'the month after is a publisher again'
);
select is(
  (select monthly_goal_hours from public.ministry_status_for_month(
    (date_trunc('month', now()) + interval '1 month')::date)),
  20::smallint,
  'and keeps their own number, because it was never an appointment'
);

reset role;


-- ---------------------------------------------------------------------
-- "From this month" has to UNSAY an earlier "since September"
-- ---------------------------------------------------------------------
-- The owner picked the service year, then changed to this month, and
-- the year still read 600: the September row nobody had retracted went
-- on being counted. The fourth argument is that retraction, and it
-- reaches only pioneer rows inside the service year it is given.
insert into auth.users (id, email) values
  ('88888888-8888-8888-8888-888888888888', 'eight@jw.fenko.dev');

set local role authenticated;
set local request.jwt.claims = '{"sub":"88888888-8888-8888-8888-888888888888","role":"authenticated"}';

select is(
  (select status from public.set_ministry_status_from(
    (date_trunc('month', now()) - interval '2 months')::date, 'regular_pioneer')),
  'regular_pioneer',
  'a pioneer backdated two months, as "since the year began" does'
);
select is(
  (select status from public.set_ministry_status_from(
    date_trunc('month', now())::date,
    'regular_pioneer',
    null,
    (date_trunc('month', now()) - interval '2 months')::date)),
  'regular_pioneer',
  'then the same person says it started this month instead'
);
select is(
  (select count(*) from public.ministry_status_for_month(
    (date_trunc('month', now()) - interval '2 months')::date)),
  0::bigint,
  'and the earlier pioneer month is retracted: it reads the default again'
);

-- What the retraction does NOT touch: a month marked with something
-- that is not an appointment. It carries no yearly norm, so it says
-- nothing about when the pioneering began — and the owner keeps the
-- monthly goal they recorded for it.
-- As the owner again, for the same reason.
reset role;
select is(
  (select monthly_goal_hours from public.amend_ministry_status_month(
    (date_trunc('month', now()) - interval '2 months')::date,
    'auxiliary_pioneer', 15::smallint)),
  15::smallint,
  'that month is marked a one-month auxiliary pioneer instead'
);
set local role authenticated;
select is(
  (select status from public.set_ministry_status_from(
    date_trunc('month', now())::date,
    'regular_pioneer',
    null,
    (date_trunc('month', now()) - interval '2 months')::date)),
  'regular_pioneer',
  'and the pioneer is set from this month again'
);
select is(
  (select monthly_goal_hours from public.ministry_status_for_month(
    (date_trunc('month', now()) - interval '2 months')::date)),
  15::smallint,
  'the auxiliary month survives with its own hours: only pioneering is retracted'
);

reset role;

select * from finish();

rollback;
