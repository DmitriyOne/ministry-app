begin;

create extension if not exists pgtap with schema extensions;

select plan(18);

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
select is(
  (select count(*)::int from pg_policies
    where schemaname = 'public' and tablename = 'user_roles'),
  0,
  'user_roles has no policies'
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

-- user_roles keeps the v1 model: no policy and no grant, so the table is
-- unreachable rather than merely empty from this side.
select throws_ok(
  $$select count(*) from public.user_roles$$,
  '42501',
  null,
  'authenticated has no access to user_roles at all'
);

reset role;

select * from finish();
rollback;
