begin;

create extension if not exists pgtap with schema extensions;

select plan(34);

-- The enum, not text: a typo in a role must fail on insert rather than
-- surface later as a failed permission check.
select has_type('public', 'app_role', 'app_role enum exists');
select is(
  (select array_agg(e.enumlabel::text order by e.enumsortorder)
     from pg_enum e where e.enumtypid = 'public.app_role'::regtype),
  array['user', 'admin'],
  'app_role has exactly the two roles v2 defines'
);

select has_table('public', 'profiles', 'profiles exists');
select has_table('public', 'user_roles', 'user_roles exists');
select has_function(
  'public', 'set_updated_at', 'the shared updated_at trigger function exists');

select ok(
  (select relrowsecurity from pg_class where oid = 'public.profiles'::regclass),
  'row level security is enabled on profiles'
);
select ok(
  (select relrowsecurity from pg_class where oid = 'public.user_roles'::regclass),
  'row level security is enabled on user_roles'
);

-- profiles is the deliberate departure from the v1 closed-table model
-- (ADR 0033/0037): rows belong to the person reading them, so real
-- policies are the right tool. Exactly two, and no insert/delete.
select is(
  (select count(*)::int from pg_policies
    where schemaname = 'public' and tablename = 'profiles'),
  2,
  'profiles has exactly the two policies the spec defines'
);
select is(
  (select array_agg(cmd::text order by cmd::text) from pg_policies
    where schemaname = 'public' and tablename = 'profiles'),
  array['SELECT', 'UPDATE'],
  'profiles grants no insert or delete policy'
);

-- user_roles stays fully in the v1 model: no policy at all, so nothing
-- authenticated asks of it is ever permitted.
-- Deny-all, stated rather than implied (ADR 0048). The protection is the
-- same as it was with no policies at all: every reader of this table
-- bypasses RLS, so the policy governs nobody — it makes the rule legible
-- and gives the "RLS enabled, no policy" advisor nothing to report.
select is(
  (select count(*)::int from pg_policies
    where schemaname = 'public' and tablename = 'user_roles'),
  1,
  'user_roles has exactly the one deny-all policy'
);
select is(
  (select array_agg(distinct coalesce(qual, 'null') || '/' || coalesce(with_check, 'null'))
     from pg_policies
    where schemaname = 'public' and tablename = 'user_roles'),
  array['false/false'],
  'user_roles: the policy denies both reads and writes'
);
select ok(
  not has_table_privilege('authenticated', 'public.user_roles', 'select'),
  'authenticated has no select on user_roles'
);
select ok(
  not has_table_privilege('anon', 'public.profiles', 'select'),
  'anon has no select on profiles'
);

-- The trigger is what makes "create a person in Studio" a single action.
insert into auth.users (id, email, raw_user_meta_data)
values (
  '11111111-1111-1111-1111-111111111111',
  'ruth@example.com',
  '{"display_name": "Ruth"}'::jsonb
);
select is(
  (select display_name from public.profiles
    where id = '11111111-1111-1111-1111-111111111111'),
  'Ruth',
  'the trigger takes display_name from the metadata when present'
);
select is(
  (select role::text from public.user_roles
    where user_id = '11111111-1111-1111-1111-111111111111'),
  'user',
  'the trigger defaults the role to user'
);

-- No metadata: the local part of the address is the fallback, so a person
-- created with nothing but an email still has a usable name on /profile.
insert into auth.users (id, email) values
  ('22222222-2222-2222-2222-222222222222', 'naomi@example.com');
select is(
  (select display_name from public.profiles
    where id = '22222222-2222-2222-2222-222222222222'),
  'naomi',
  'the trigger falls back to the local part of the email'
);

-- A name must never be the reason an account cannot exist. Each case
-- below made the insert into auth.users fail before migration
-- 20261012165606 — the trigger raised, the whole insert rolled back, and
-- the only thing visible from the outside was a 500 from GoTrue.
insert into auth.users (id, email, raw_user_meta_data) values
  ('33333333-3333-3333-3333-333333333333', 'esther@example.com', '{"display_name": "   "}'::jsonb);
select is(
  (select display_name from public.profiles
    where id = '33333333-3333-3333-3333-333333333333'),
  'esther',
  'a display_name of nothing but spaces falls through to the address'
);

-- An account with no address at all: a phone signup, or
-- auth.admin.createUser called without one.
insert into auth.users (id) values ('44444444-4444-4444-4444-444444444444');
select is(
  (select display_name from public.profiles
    where id = '44444444-4444-4444-4444-444444444444'),
  '44444444',
  'an account with no address still gets a profile, named after its id'
);

insert into auth.users (id, email) values
  ('55555555-5555-5555-5555-555555555555', '@example.com');
select is(
  (select display_name from public.profiles
    where id = '55555555-5555-5555-5555-555555555555'),
  '55555555',
  'an address with an empty local part does not produce an empty name'
);

-- The policies are the security boundary, so they are exercised as a
-- person rather than inspected in pg_policies: counting policies proves
-- they exist, not that they keep anyone out.
set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';

select is(
  (select count(*)::int from public.profiles),
  1,
  'authenticated sees exactly one profile, their own, with no filter applied'
);
select is(
  (select count(*)::int from public.profiles
    where id = '22222222-2222-2222-2222-222222222222'),
  0,
  'authenticated cannot read another person''s profile'
);

-- Pins the behaviour, not the clause that produces it: with the policies
-- as they stand, using alone would already block this (Postgres applies
-- an update policy's using expression to the new row when with check is
-- omitted). The assertion is here so that a future policy with a wider
-- using expression cannot quietly make a row stealable.
select throws_ok(
  $$update public.profiles set id = '22222222-2222-2222-2222-222222222222'
      where id = '11111111-1111-1111-1111-111111111111'$$,
  '42501',
  null,
  'a person cannot move their profile row onto someone else''s id'
);

-- A policy limits rows, not columns. Without the column grant a person
-- could rewrite their own created_at, which is how this was found.
select throws_ok(
  $$update public.profiles set created_at = '1970-01-01Z'
      where id = '11111111-1111-1111-1111-111111111111'$$,
  '42501',
  null,
  'a person cannot rewrite created_at on their own profile'
);
select throws_ok(
  $$update public.profiles set updated_at = '1970-01-01Z'
      where id = '11111111-1111-1111-1111-111111111111'$$,
  '42501',
  null,
  'a person cannot forge updated_at; only the trigger sets it'
);

-- The one field a person may actually change.
select lives_ok(
  $$update public.profiles set display_name = 'Ruth B'
      where id = '11111111-1111-1111-1111-111111111111'$$,
  'a person can change their own display name'
);

-- user_roles keeps the v1 model: no policy and no grant, so the table is
-- unreachable rather than merely empty from this side.
select throws_ok(
  $$select count(*) from public.user_roles$$,
  '42501',
  null,
  'authenticated has no access to user_roles at all'
);

-- The rest needs the owner's rights, so the role goes back here and the
-- assertions below are no longer about what a person may do.
reset role;

-- Checked by value, not by the clock: now() is the transaction's start
-- time, so within this single transaction updated_at can never come out
-- greater than created_at. What is observable — and what actually
-- matters — is that the trigger overrides whatever the writer supplied,
-- even a writer holding full rights on the column.
update public.profiles
  set display_name = 'Ruth C', updated_at = '1970-01-01Z'
  where id = '11111111-1111-1111-1111-111111111111';
select isnt(
  (select updated_at from public.profiles
    where id = '11111111-1111-1111-1111-111111111111'),
  '1970-01-01Z'::timestamptz,
  'the trigger overrides an updated_at supplied by the writer'
);
select is(
  (select updated_at from public.profiles
    where id = '11111111-1111-1111-1111-111111111111'),
  now(),
  'the trigger sets updated_at to the current transaction timestamp'
);

-- The hook itself. Runs as the owner (after reset role above).
-- supabase_auth_admin is the only role that may run it: it returns
-- another person's role when asked, so execute for anon or authenticated
-- would be a way to read user_roles around its own missing policies.
select has_function('public', 'custom_access_token_hook', 'the hook exists');
select ok(
  has_function_privilege(
    'supabase_auth_admin', 'public.custom_access_token_hook(jsonb)', 'execute'),
  'supabase_auth_admin can execute the hook'
);
select ok(
  not has_function_privilege(
    'anon', 'public.custom_access_token_hook(jsonb)', 'execute'),
  'anon cannot execute the hook'
);
select ok(
  not has_function_privilege(
    'authenticated', 'public.custom_access_token_hook(jsonb)', 'execute'),
  'authenticated cannot execute the hook'
);

select is(
  public.custom_access_token_hook(jsonb_build_object(
    'user_id', '11111111-1111-1111-1111-111111111111',
    'claims', jsonb_build_object('sub', '11111111-1111-1111-1111-111111111111')
  )) -> 'claims' ->> 'user_role',
  'user',
  'the hook puts the role into the claims'
);

-- A person whose user_roles row was removed by hand must still be able
-- to sign in: the hook returns the claims untouched rather than failing,
-- and the front end falls back to the default role (Review Focus 2).
delete from public.user_roles
  where user_id = '22222222-2222-2222-2222-222222222222';
select is(
  public.custom_access_token_hook(jsonb_build_object(
    'user_id', '22222222-2222-2222-2222-222222222222',
    'claims', jsonb_build_object('sub', '22222222-2222-2222-2222-222222222222')
  )) -> 'claims' ->> 'user_role',
  null,
  'a person with no role row gets claims without user_role, not an error'
);

select * from finish();
rollback;
