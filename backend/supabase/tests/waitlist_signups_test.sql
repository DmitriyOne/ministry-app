-- pgTAP tests for the waitlist table's access model (ADR 0033). Run with
-- `pnpm db:test` against the LOCAL database only.
--
-- The whole file runs inside one transaction that is rolled back at the
-- end, so `create extension pgtap` and every row these tests insert
-- disappear afterwards — nothing here reaches a migration or the cloud
-- project.
begin;

create extension if not exists pgtap with schema extensions;

select plan(12);

-- The grants. A new table in `public` is granted select/insert/update/
-- delete to anon and authenticated automatically (config.toml leaves
-- `auto_expose_new_tables` at its default), and adding policies does not
-- take those grants back — so the migration has to revoke them, and
-- these four tests are what proves it did.
select ok(
  not has_table_privilege('anon', 'public.waitlist_signups', 'select'),
  'anon cannot select from waitlist_signups'
);
select ok(
  not has_table_privilege('anon', 'public.waitlist_signups', 'insert'),
  'anon cannot insert into waitlist_signups directly'
);
select ok(
  not has_table_privilege('authenticated', 'public.waitlist_signups', 'select'),
  'authenticated cannot select from waitlist_signups'
);
select ok(
  not has_table_privilege('authenticated', 'public.waitlist_signups', 'insert'),
  'authenticated cannot insert into waitlist_signups directly'
);

-- Row level security, and the deliberate absence of policies: with RLS
-- on and no policy at all, nothing but the table's owner can reach a
-- row. A policy appearing here later must be a decision, not a slip.
select ok(
  (select relrowsecurity from pg_class where oid = 'public.waitlist_signups'::regclass),
  'row level security is enabled on waitlist_signups'
);
select is(
  (select count(*)::int from pg_policies
    where schemaname = 'public' and tablename = 'waitlist_signups'),
  0,
  'waitlist_signups has no policies: the function is the only door'
);

-- The function is the door, and only anon needs the key. Postgres grants
-- execute to role `public` by default, so the migration has to revoke
-- that first — this pair is what proves it did.
select ok(
  has_function_privilege('anon', 'public.join_waitlist(text)', 'execute'),
  'anon can execute join_waitlist'
);
select ok(
  not has_function_privilege('authenticated', 'public.join_waitlist(text)', 'execute'),
  'authenticated was not granted join_waitlist it does not need'
);

-- Joining, normalisation and the counter.
--
-- Emptied first, so the positions below are deterministic. The three
-- tests that follow assert exact numbers, and on a database that already
-- holds signups — a local one someone has been clicking through, or any
-- database that is not freshly reset — those numbers would be whatever
-- the existing rows make them, and the tests would fail for no reason
-- but that. This delete is safe precisely because the whole file runs in
-- one transaction that is rolled back at the end: nothing real is lost,
-- including on a database with live rows in it.
delete from public.waitlist_signups;

select results_eq(
  $$ select already_joined, list_position from public.join_waitlist('  First@Example.COM ') $$,
  $$ values (false, 1::bigint) $$,
  'a first signup is new and lands at position 1'
);
select results_eq(
  $$ select already_joined, list_position from public.join_waitlist('first@example.com') $$,
  $$ values (true, 1::bigint) $$,
  'the same address, normalised, is recognised at the same position'
);
select results_eq(
  $$ select email from public.waitlist_signups order by id $$,
  $$ values ('first@example.com'::text) $$,
  'the padded, upper-cased address was stored once, lower-cased and trimmed'
);

-- The end-to-end claim of the whole design: a signed-out visitor can
-- join through the function, and cannot read the table that holds the
-- addresses. 42501 is insufficient_privilege.
set local role anon;
select throws_ok(
  $$ select count(*) from public.waitlist_signups $$,
  '42501',
  null,
  'anon reading the table directly is refused'
);
reset role;

select * from finish();

rollback;
