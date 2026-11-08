begin;

create extension if not exists pgtap with schema extensions;

select plan(26);

-- What this file pins: the two reads the service year screen added
-- (ADR 0067, decision 9), and specifically the things a reader of the
-- TypeScript cannot see.
--
-- The one that matters most is an ABSENCE. A month with nothing recorded
-- must come back missing from the monthly sums, not as a zero, because
-- the screen draws a dash for "nobody opened this month" and 0:00 for
-- "somebody looked and there was nothing". A later hand turning the
-- absence into a zero "for convenience" would destroy that distinction
-- silently, and nothing in the browser would catch it.
--
-- The mirror of it is also pinned: ministry_status_year_months must KEEP
-- a month with no status at all (nulls), because a table has a line to
-- draw for it even when a sum has nothing to add.
--
-- Every date is derived from a fixed September inside the test rather
-- than from now(), because these functions are about a span the caller
-- chooses: pinning the span is the point, and now() would make the file
-- test a different twelve months every month.

-- ---------------------------------------------------------------------
-- Who may call them
-- ---------------------------------------------------------------------
select has_function('public', 'ministry_days_monthly_minutes',
  array['date', 'date'], 'the monthly sums function exists');
select has_function('public', 'ministry_status_year_months',
  array['date'], 'the twelve-month status function exists');

select ok(
  not has_function_privilege('anon',
    'public.ministry_days_monthly_minutes(date, date)', 'execute'),
  'anon cannot read monthly sums'
);
select ok(
  has_function_privilege('authenticated',
    'public.ministry_days_monthly_minutes(date, date)', 'execute'),
  'a signed-in person can read monthly sums'
);
select ok(
  not has_function_privilege('anon',
    'public.ministry_status_year_months(date)', 'execute'),
  'anon cannot read the year''s statuses'
);
select ok(
  has_function_privilege('authenticated',
    'public.ministry_status_year_months(date)', 'execute'),
  'a signed-in person can read the year''s statuses'
);

-- security invoker on both: the policy does the scoping, and a definer
-- here would hand one person another person's figures.
select ok(
  not (select prosecdef from pg_proc
        where oid = 'public.ministry_days_monthly_minutes(date, date)'::regprocedure),
  'monthly sums run as the caller, not as the owner'
);
select ok(
  not (select prosecdef from pg_proc
        where oid = 'public.ministry_status_year_months(date)'::regprocedure),
  'the year''s statuses run as the caller, not as the owner'
);

-- ---------------------------------------------------------------------
-- Two people, one of whom records nothing
-- ---------------------------------------------------------------------
insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'one@jw.fenko.dev'),
  ('22222222-2222-2222-2222-222222222222', 'two@jw.fenko.dev');

-- Written as the owner: no caller of the app can reach these tables
-- directly, and what is under test here is the reading, not the writing.
--
-- September and October hold hours, November holds a recorded ZERO, and
-- December holds nothing at all — the four cases the screen has to tell
-- apart. One row of the second person's, in the same month, to prove the
-- scoping.
insert into public.ministry_days (user_id, day, minutes) values
  ('11111111-1111-1111-1111-111111111111', '2026-09-08', 1200),
  ('11111111-1111-1111-1111-111111111111', '2026-09-25', 730),
  ('11111111-1111-1111-1111-111111111111', '2026-10-28', 940),
  ('11111111-1111-1111-1111-111111111111', '2026-11-04', 0),
  ('22222222-2222-2222-2222-222222222222', '2026-09-09', 600);

insert into public.ministry_status_months
  (user_id, month, status, duration, monthly_goal_hours) values
  ('11111111-1111-1111-1111-111111111111', '2026-10-01',
   'regular_pioneer', 'until_changed', 50);

set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';

-- ---------------------------------------------------------------------
-- Monthly sums
-- ---------------------------------------------------------------------
select is(
  (select count(*)::integer from public.ministry_days_monthly_minutes(
     '2026-09-01', '2027-08-31')),
  3,
  'three months come back: the two with hours and the one with a recorded zero'
);

select is(
  (select minutes from public.ministry_days_monthly_minutes(
     '2026-09-01', '2027-08-31') where month = '2026-09-01'),
  1930,
  'September adds its own days together and nobody else''s'
);
select is(
  (select minutes from public.ministry_days_monthly_minutes(
     '2026-09-01', '2027-08-31') where month = '2026-10-01'),
  940,
  'October is the single day it holds'
);

-- The distinction this file exists for.
select is(
  (select minutes from public.ministry_days_monthly_minutes(
     '2026-09-01', '2027-08-31') where month = '2026-11-01'),
  0,
  'a month whose only row is a recorded zero comes back AS zero'
);
select ok(
  not exists (select 1 from public.ministry_days_monthly_minutes(
     '2026-09-01', '2027-08-31') where month = '2026-12-01'),
  'a month with no rows at all is ABSENT, not zero — the screen draws a dash for it'
);

select is(
  (select month from public.ministry_days_monthly_minutes(
     '2026-09-01', '2027-08-31') order by month limit 1),
  '2026-09-01'::date,
  'the month comes back as its first day, the shape the rest of the schema uses'
);

-- The sums must agree with the range total, or the card and the table on
-- one screen would disagree about the same year.
select is(
  (select sum(minutes)::integer from public.ministry_days_monthly_minutes(
     '2026-09-01', '2027-08-31')),
  public.ministry_days_total_minutes('2026-09-01', '2027-08-31'),
  'the monthly sums add up to exactly what the range total says'
);

-- The span is the caller's, and a narrower one must cut.
select is(
  (select count(*)::integer from public.ministry_days_monthly_minutes(
     '2026-10-01', '2026-10-31')),
  1,
  'a one-month span returns that month alone'
);

-- ---------------------------------------------------------------------
-- The twelve months of status
-- ---------------------------------------------------------------------
select is(
  (select count(*)::integer from public.ministry_status_year_months('2026-09-01')),
  12,
  'twelve rows, one per month of the service year'
);

-- September is BEFORE the only status row, so it has no status at all.
select ok(
  (select status is null and monthly_goal_hours is null
     from public.ministry_status_year_months('2026-09-01')
    where month = '2026-09-01'),
  'a month earlier than any status row is kept, with nulls rather than dropped'
);

select is(
  (select status from public.ministry_status_year_months('2026-09-01')
    where month = '2026-10-01'),
  'regular_pioneer',
  'the month of the row carries its status'
);
select is(
  (select monthly_goal_hours from public.ministry_status_year_months('2026-09-01')
    where month = '2027-08-01'),
  50::smallint,
  'a later month inherits by carry-forward, which this function does not re-implement'
);

select is(
  (select count(*)::integer from public.ministry_status_year_months('2026-09-01')
    where status = 'regular_pioneer'),
  11,
  'eleven pioneer months — October through August, September having none'
);

-- The division of labour: this function does not sum, and the goal
-- function still owns the rule.
select is(
  public.ministry_status_year_goal('2026-09-01'),
  550,
  'the year''s goal stays with its own function and counts the eleven pioneer months'
);

select is(
  (select month from public.ministry_status_year_months('2026-09-01')
    order by month desc limit 1),
  '2027-08-01'::date,
  'the twelfth month is the following August — September to August, set by the caller'
);

-- ---------------------------------------------------------------------
-- The other person sees their own figures and nothing of these
-- ---------------------------------------------------------------------
set local request.jwt.claims = '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';

select is(
  (select count(*)::integer from public.ministry_days_monthly_minutes(
     '2026-09-01', '2027-08-31')),
  1,
  'the second person sees the one month they recorded in'
);
select is(
  (select minutes from public.ministry_days_monthly_minutes(
     '2026-09-01', '2027-08-31') where month = '2026-09-01'),
  600,
  'and sees their own minutes, not the first person''s September'
);
select ok(
  (select bool_and(status is null)
     from public.ministry_status_year_months('2026-09-01')),
  'and has no status in any month, the first person''s row being invisible to them'
);

select * from finish();

rollback;
