begin;

create extension if not exists pgtap with schema extensions;

select plan(22);

-- What this file pins: closing a month is a fact in a table, and every
-- rule about it lives in two security definer functions (ADR 0066).
-- Worth testing are the things a reader of the TypeScript cannot see —
-- that a month still being lived cannot be closed, that closing twice is
-- harmless, that reopening a month nobody closed is not an error, and
-- that neither row nor function reaches anybody else's month.
--
-- The lock itself — a closed month refusing hours — is pinned in
-- ministry_days_test.sql, beside the function it changed.
--
-- Every date is derived from now(), never written out, so the file does
-- not start failing next month.

-- ---------------------------------------------------------------------
-- The table and who may touch it
-- ---------------------------------------------------------------------
select has_table('public', 'ministry_month_closures', 'the closure table exists');
select ok(
  (select relrowsecurity
     from pg_class where oid = 'public.ministry_month_closures'::regclass),
  'row level security is on'
);
select ok(
  has_table_privilege('authenticated', 'public.ministry_month_closures', 'select'),
  'a person reads their own closures directly'
);

-- The three that must NOT be there: closing goes through the function,
-- so a direct write is impossible rather than unused.
select ok(
  not has_table_privilege('authenticated', 'public.ministry_month_closures', 'insert'),
  'no direct insert'
);
select ok(
  not has_table_privilege('authenticated', 'public.ministry_month_closures', 'update'),
  'no direct update'
);
select ok(
  not has_table_privilege('authenticated', 'public.ministry_month_closures', 'delete'),
  'no direct delete'
);
select has_trigger('public', 'ministry_month_closures',
  'ministry_month_closures_set_updated_at',
  'updated_at is maintained by the shared trigger function');

select ok(
  not has_function_privilege('anon', 'public.close_ministry_month(date)', 'execute'),
  'anon cannot close a month'
);
select ok(
  has_function_privilege('authenticated', 'public.close_ministry_month(date)', 'execute'),
  'a signed-in person can close their month'
);
select ok(
  not has_function_privilege('anon', 'public.reopen_ministry_month(date)', 'execute'),
  'anon cannot reopen a month'
);
select ok(
  has_function_privilege('authenticated', 'public.reopen_ministry_month(date)', 'execute'),
  'a signed-in person can reopen their month'
);

-- Internal, like ministry_status_shape: the write path asks it, nobody
-- outside the database does.
select ok(
  not has_function_privilege('authenticated',
    'public.is_ministry_month_closed(uuid, date)', 'execute'),
  'the question itself is not reachable from outside'
);

-- ---------------------------------------------------------------------
-- Two people. "Their own rows" is only a real restriction with two.
-- handle_new_user creates the profiles.
-- ---------------------------------------------------------------------
insert into auth.users (id, email) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'closer@jw.fenko.dev'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'other@jw.fenko.dev');

-- The backstop in the table itself, tested as the owner because no
-- caller of the app can reach the table directly.
select throws_ok(
  $$insert into public.ministry_month_closures (user_id, month)
    values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
            (date_trunc('month', now()) + interval '14 days')::date)$$,
  '23514',
  null,
  'a month that is not a first day is refused by the constraint'
);

set local role authenticated;
set local request.jwt.claims = '{"sub":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa","role":"authenticated"}';

select is(
  (select (public.close_ministry_month(
    (date_trunc('month', now() - interval '1 month'))::date)).month),
  (date_trunc('month', now() - interval '1 month'))::date,
  'last month closes'
);

-- Read from the table, not through is_ministry_month_closed: that one is
-- internal and `authenticated` has no execute on it (asserted above).
-- What the lock does with the answer is pinned in ministry_days_test.sql.
select is(
  (select count(*)::int from public.ministry_month_closures
    where month = (date_trunc('month', now() - interval '1 month'))::date
      and deleted_at is null),
  1,
  'and is then closed'
);

-- A second tap on the same button: the row is the same row.
select lives_ok(
  $$select public.close_ministry_month(
    (date_trunc('month', now() - interval '1 month'))::date)$$,
  'closing an already closed month is harmless'
);
select is(
  (select count(*)::int from public.ministry_month_closures where deleted_at is null),
  1,
  'and leaves one living row, not two'
);

select lives_ok(
  $$select public.reopen_ministry_month(
    (date_trunc('month', now() - interval '1 month'))::date)$$,
  'the month reopens'
);
select is(
  (select count(*)::int from public.ministry_month_closures
    where deleted_at is null),
  0,
  'and is then open again'
);

-- Reopening something nobody closed matches no row. That is not a
-- failure: the answer to "is it closed now" is the same either way.
select lives_ok(
  $$select public.reopen_ministry_month(
    (date_trunc('month', now() - interval '13 months'))::date)$$,
  'reopening a month that was never closed is not an error'
);

-- The owner's rule: the button appears after midnight of the following
-- month, and the database refuses anything earlier.
--
-- The month asked about here is the NEXT one, not the current one, and
-- that is about this file rather than about the rule. The fence carries
-- a day of slack from UTC (see the migration), so on the last UTC day
-- of a month the current month is accepted — and an assertion that it
-- throws would go red on 31 October, 30 November and ten other days a
-- year, in a file whose own header promises it does not start failing
-- next month. The next month is refused on every day of every month,
-- through the same branch.
select throws_ok(
  $$select public.close_ministry_month(
    (date_trunc('month', now() + interval '1 month'))::date)$$,
  '23514',
  null,
  'a month that has not started cannot be closed'
);

-- The other person's view of all of it.
set local request.jwt.claims = '{"sub":"bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb","role":"authenticated"}';

select is(
  (select count(*)::int from public.ministry_month_closures),
  0,
  'somebody else sees none of it'
);

select * from finish();

rollback;
