begin;

create extension if not exists pgtap with schema extensions;

select plan(42);

-- What this file pins: the rules that exist nowhere else. The day table
-- is written by one security definer function, so the things worth
-- testing are the ones a reader of the TypeScript cannot see — that the
-- function writes to the CALLER's row, that a day which has not happened
-- is refused while every time zone can still write its own today, that
-- zero is a value and not an absence, and that a row marked deleted does
-- not hold its day for good (ADR 0047).
--
-- Every date is derived from now(), never written out, so the file does
-- not start failing next month.

-- ---------------------------------------------------------------------
-- The table and who may touch it
-- ---------------------------------------------------------------------
select has_table('public', 'ministry_days', 'the day table exists');
select ok(
  (select relrowsecurity from pg_class where oid = 'public.ministry_days'::regclass),
  'row level security is on'
);
select ok(
  has_table_privilege('authenticated', 'public.ministry_days', 'select'),
  'a person reads their own days directly'
);

-- The three that must NOT be there: every write goes through the
-- function, so a direct write is impossible rather than unused.
select ok(
  not has_table_privilege('authenticated', 'public.ministry_days', 'insert'),
  'no direct insert'
);
select ok(
  not has_table_privilege('authenticated', 'public.ministry_days', 'update'),
  'no direct update'
);
select ok(
  not has_table_privilege('authenticated', 'public.ministry_days', 'delete'),
  'no direct delete'
);
select has_trigger('public', 'ministry_days', 'ministry_days_set_updated_at',
  'updated_at is maintained by the shared trigger function');

select ok(
  not has_function_privilege('anon',
    'public.set_ministry_day_minutes(date, smallint)', 'execute'),
  'anon cannot record hours'
);
select ok(
  has_function_privilege('authenticated',
    'public.set_ministry_day_minutes(date, smallint)', 'execute'),
  'a signed-in person can record hours'
);

select ok(
  not has_function_privilege('anon',
    'public.ministry_days_total_minutes(date, date)', 'execute'),
  'anon cannot total anybody''s days'
);
select ok(
  has_function_privilege('authenticated',
    'public.ministry_days_total_minutes(date, date)', 'execute'),
  'a signed-in person can total their own'
);

-- ---------------------------------------------------------------------
-- Two people. "Their own rows" is only a real restriction with two.
-- handle_new_user creates the profiles.
-- ---------------------------------------------------------------------
insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'one@jw.fenko.dev'),
  ('22222222-2222-2222-2222-222222222222', 'two@jw.fenko.dev');

-- The backstop in the table itself, tested as the owner because no
-- caller of the app can reach the table directly.
select throws_ok(
  $$insert into public.ministry_days (user_id, day, minutes)
    values ('11111111-1111-1111-1111-111111111111', now()::date, 1441)$$,
  '23514',
  null,
  'more minutes than a day holds is refused by the constraint'
);
select throws_ok(
  $$insert into public.ministry_days (user_id, day, minutes)
    values ('11111111-1111-1111-1111-111111111111', now()::date, -1)$$,
  '23514',
  null,
  'negative minutes are refused by the constraint'
);

set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';

select is(
  (select minutes from public.set_ministry_day_minutes(now()::date, 75::smallint)),
  75::smallint,
  'today is recorded'
);

-- The whole reason the day screen pages backwards: a day already lived
-- is freely writable, unlike the ministry status (ADR 0061, decision 9).
select is(
  (select minutes from public.set_ministry_day_minutes(
    (now() - interval '30 days')::date, 120::smallint)),
  120::smallint,
  'a day thirty days back is recorded, because that is what paging back is for'
);

-- What a phone in Kiritimati sends on the last evening of a UTC day: its
-- own today is already UTC's tomorrow.
select is(
  (select minutes from public.set_ministry_day_minutes(
    ((now() at time zone 'utc')::date + 1), 45::smallint)),
  45::smallint,
  'a time zone ahead of UTC may write its own today'
);

select throws_ok(
  format($$select public.set_ministry_day_minutes(%L::date, 60::smallint)$$,
    ((now() at time zone 'utc')::date + 2)),
  '23514',
  null,
  'two days out is nobody''s today and is refused'
);

select throws_ok(
  $$select public.set_ministry_day_minutes(now()::date, 1441::smallint)$$,
  '23514',
  null,
  'the function refuses more minutes than a day holds'
);
select throws_ok(
  $$select public.set_ministry_day_minutes(now()::date, null::smallint)$$,
  '23514',
  null,
  'no minutes at all is a malformed call, not a zero'
);

-- Writing the same day again replaces it. The card saves on every tap,
-- so this is the ordinary case rather than the exception.
select is(
  (select minutes from public.set_ministry_day_minutes(now()::date, 90::smallint)),
  90::smallint,
  'writing today again replaces what it held'
);
select is(
  (select count(*) from public.ministry_days
    where day = now()::date and deleted_at is null),
  1::bigint,
  'and leaves one row for that day, not two'
);

-- Zero is a value: somebody looked and there was nothing. The row stays,
-- so the next tap is the same upsert as any other.
select is(
  (select minutes from public.set_ministry_day_minutes(
    (now() - interval '1 day')::date, 0::smallint)),
  0::smallint,
  'zero minutes is stored as a row rather than as an absence'
);

-- ---------------------------------------------------------------------
-- The total over a span of days
-- ---------------------------------------------------------------------
-- This person now holds: 90 minutes today, 0 yesterday, 120 thirty days
-- back, 45 on UTC's tomorrow.
select is(
  public.ministry_days_total_minutes(now()::date, now()::date),
  90,
  'one day totals that day'
);
select is(
  public.ministry_days_total_minutes((now() - interval '30 days')::date, now()::date),
  210,
  'a span totals every day in it'
);
-- Both ends included: a month's first and last day are in that month,
-- and an exclusive end would silently lose the 31st.
select is(
  public.ministry_days_total_minutes(
    (now() - interval '30 days')::date, (now() - interval '30 days')::date),
  120,
  'the ends of the span are inside it'
);
-- Zero, never null: "nothing recorded" has to reach a screen as 0:00
-- rather than as a blank nobody can tell from a failed read.
select is(
  public.ministry_days_total_minutes(
    (now() - interval '10 days')::date, (now() - interval '9 days')::date),
  0,
  'a span with nothing in it totals zero rather than null'
);
select is(
  public.ministry_days_total_minutes(now()::date, (now() - interval '1 day')::date),
  0,
  'a span that runs backwards totals zero'
);

reset role;
update public.ministry_days
   set deleted_at = now()
 where user_id = '11111111-1111-1111-1111-111111111111'
   and day = now()::date;

set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';

select is(
  (select count(*) from public.ministry_days where day = now()::date),
  0::bigint,
  'a row marked deleted is invisible to the person it belongs to'
);
-- And out of the total as well. The function runs as the caller, so the
-- policy is what hides it — which is the point of invoker here.
select is(
  public.ministry_days_total_minutes(now()::date, now()::date),
  0,
  'a day marked deleted is not in the total either'
);

-- And choosing that day again revives it. Without the `deleted_at = null`
-- in the upsert the primary key would hold the day for good.
select is(
  (select minutes from public.set_ministry_day_minutes(now()::date, 30::smallint)),
  30::smallint,
  'recording the day again revives the row the sweep had marked'
);

-- The second person. If the function scoped by anything other than
-- auth.uid(), this call would land on the first person's row.
set local request.jwt.claims = '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';

select is(
  (select count(*) from public.ministry_days),
  0::bigint,
  'the second person sees none of the first person''s days'
);

select is(
  (select minutes from public.set_ministry_day_minutes(now()::date, 15::smallint)),
  15::smallint,
  'and records their own'
);
-- 15, not 45: the first person's 30 minutes of the same day are no part
-- of this total.
select is(
  public.ministry_days_total_minutes(now()::date, now()::date),
  15,
  'a total holds the caller''s days and nobody else''s'
);

reset role;

select is(
  (select minutes from public.ministry_days
    where user_id = '11111111-1111-1111-1111-111111111111'
      and day = now()::date
      and deleted_at is null),
  30::smallint,
  'the first person''s day is still theirs after the second one wrote'
);

-- ---------------------------------------------------------------------
-- A closed month (ADR 0066)
-- ---------------------------------------------------------------------
-- The amendment to "a day already lived is freely writable": once the
-- month is reported, its days stop moving. Back as the second person,
-- who has one day of their own and nothing else.
set local role authenticated;
set local request.jwt.claims = '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';

-- A day in the middle of last month, so that the month boundary is the
-- thing being tested rather than the edge of it.
select is(
  (select minutes from public.set_ministry_day_minutes(
    (date_trunc('month', now() - interval '1 month'))::date + 14, 60::smallint)),
  60::smallint,
  'a day in last month is recorded while the month is open'
);

select lives_ok(
  $$select public.close_ministry_month(
    (date_trunc('month', now() - interval '1 month'))::date)$$,
  'last month closes'
);

-- Closing says nothing about the hours themselves, and must not touch
-- them: it is a lock, not an edit.
select is(
  (select minutes from public.ministry_days
    where day = (date_trunc('month', now() - interval '1 month'))::date + 14),
  60::smallint,
  'closing the month leaves the hours exactly as they were'
);

select throws_ok(
  format($$select public.set_ministry_day_minutes(%L::date, 90::smallint)$$,
    (date_trunc('month', now() - interval '1 month'))::date + 14),
  '55000',
  null,
  'a day inside a closed month is refused, and not as a check violation'
);

-- And the refusal changed nothing, which is the whole point of it.
select is(
  (select minutes from public.ministry_days
    where day = (date_trunc('month', now() - interval '1 month'))::date + 14),
  60::smallint,
  'the refused write left the day untouched'
);

-- The lock is one month wide. Today belongs to a month nobody closed.
select is(
  (select minutes from public.set_ministry_day_minutes(now()::date, 25::smallint)),
  25::smallint,
  'a day in an open month is still written while another month is closed'
);

select lives_ok(
  $$select public.reopen_ministry_month(
    (date_trunc('month', now() - interval '1 month'))::date)$$,
  'the month reopens'
);

select is(
  (select minutes from public.set_ministry_day_minutes(
    (date_trunc('month', now() - interval '1 month'))::date + 14, 90::smallint)),
  90::smallint,
  'and the day it was holding can be written again'
);

reset role;

select * from finish();

rollback;
