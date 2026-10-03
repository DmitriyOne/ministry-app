begin;

create extension if not exists pgtap with schema extensions;

select plan(45);

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

select ok(
  (select relrowsecurity from pg_class where oid = 'public.waitlist_signups'::regclass),
  'row level security is enabled on waitlist_signups'
);
select is(
  (select count(*)::int from pg_policies
    where schemaname = 'public' and tablename = 'waitlist_signups'),
  0,
  'waitlist_signups has no policies'
);

select ok(
  not has_table_privilege('anon', 'public.push_subscriptions', 'select'),
  'anon cannot select push_subscriptions'
);
select ok(
  not has_table_privilege('anon', 'public.push_subscriptions', 'insert'),
  'anon cannot insert push_subscriptions directly'
);
select ok(
  (select relrowsecurity from pg_class where oid = 'public.push_subscriptions'::regclass),
  'row level security is enabled on push_subscriptions'
);
select is(
  (select count(*)::int from pg_policies
    where schemaname = 'public' and tablename = 'push_subscriptions'),
  0,
  'push_subscriptions has no policies'
);
-- Secret-key model (ADR 0037): only service_role can execute the functions.
select ok(
  not has_function_privilege('anon', 'public.join_waitlist(text)', 'execute'),
  'anon cannot execute join_waitlist'
);
select ok(
  not has_function_privilege('authenticated', 'public.join_waitlist(text)', 'execute'),
  'authenticated cannot execute join_waitlist'
);
select ok(
  has_function_privilege('service_role', 'public.join_waitlist(text)', 'execute'),
  'service_role can execute join_waitlist'
);
select ok(
  not has_function_privilege('anon', 'public.register_waitlist_push_subscription(uuid,text,text,text)', 'execute'),
  'anon cannot execute register_waitlist_push_subscription'
);
select ok(
  not has_function_privilege('authenticated', 'public.register_waitlist_push_subscription(uuid,text,text,text)', 'execute'),
  'authenticated cannot execute register_waitlist_push_subscription'
);
select ok(
  has_function_privilege('service_role', 'public.register_waitlist_push_subscription(uuid,text,text,text)', 'execute'),
  'service_role can execute register_waitlist_push_subscription'
);
select ok(
  not (select prosecdef from pg_proc where oid = 'public.join_waitlist(text)'::regprocedure),
  'join_waitlist is not security definer'
);
select ok(
  not (select prosecdef from pg_proc
        where oid = 'public.register_waitlist_push_subscription(uuid,text,text,text)'::regprocedure),
  'register_waitlist_push_subscription is not security definer'
);
select hasnt_schema('private', 'the private schema (shared-secret machinery) is gone');

truncate table public.push_subscriptions restart identity;
delete from public.waitlist_signups;


select results_eq(
  $$ select already_joined, list_position from public.join_waitlist('  First@Example.COM ') $$,
  $$ values (false, 1::bigint) $$,
  'a first signup is new and lands at position 1'
);

select ok(
  (select push_enrollment_token is not null
     from public.join_waitlist('second@example.com')),
  'a fresh signup receives a push enrollment token'
);

select results_eq(
  $$ select already_joined, list_position, push_enrollment_token is null
       from public.join_waitlist('first@example.com') $$,
  $$ values (true, 1::bigint, true) $$,
  'an existing signup is recognised and receives no push token'
);

select results_eq(
  $$ select email from public.waitlist_signups order by id limit 1 $$,
  $$ values ('first@example.com'::text) $$,
  'the padded, upper-cased address was normalised'
);

-- Register a subscription using the token created for second@example.com.
select ok(
  public.register_waitlist_push_subscription(
    (select push_enrollment_token
       from public.waitlist_signups
      where email = 'second@example.com'),
    'https://push.example.test/subscription/1',
    'p256dh-test-value',
    'auth-test-value'
  ),
  'a valid fresh-signup token can register a push subscription'
);

select is(
  (select count(*)::int from public.push_subscriptions),
  1,
  'the push subscription was stored exactly once'
);

select is(
  (select push_enrollment_token
     from public.waitlist_signups
    where email = 'second@example.com'),
  null,
  'a used token is consumed'
);

-- Expired token: rejected, and cleared on first use. Back-dating the row is
-- safe, the whole file runs in one rolled-back transaction.
select ok(
  (select push_enrollment_token is not null
     from public.join_waitlist('third@example.com')),
  'a third fresh signup receives a push enrollment token'
);

update public.waitlist_signups
   set push_enrollment_token_created_at = now() - interval '31 minutes'
 where email = 'third@example.com';

select ok(
  not public.register_waitlist_push_subscription(
    (select push_enrollment_token
       from public.waitlist_signups
      where email = 'third@example.com'),
    'https://push.example.test/subscription/2',
    'p256dh-test-value',
    'auth-test-value'
  ),
  'an expired token is rejected'
);

select results_eq(
  $$ select push_enrollment_token is null, push_enrollment_token_created_at is null
       from public.waitlist_signups where email = 'third@example.com' $$,
  $$ values (true, true) $$,
  'an expired token is cleared on first use'
);

select ok(
  exists (
    select 1 from pg_indexes
     where schemaname = 'public'
       and tablename = 'push_subscriptions'
       and indexname = 'push_subscriptions_waitlist_signup_id_idx'
  ),
  'the push_subscriptions foreign key is indexed'
);

set local role anon;
select throws_ok(
  $$ select * from public.join_waitlist('attacker@example.com') $$,
  '42501',
  null,
  'anon calling join_waitlist directly is refused'
);
select throws_ok(
  $$ select public.register_waitlist_push_subscription(
       gen_random_uuid(),
       'https://push.example.test/subscription/x',
       'p256dh-test-value',
       'auth-test-value'
     ) $$,
  '42501',
  null,
  'anon calling register_waitlist_push_subscription directly is refused'
);
reset role;

set local role anon;
select throws_ok(
  $$ select count(*) from public.waitlist_signups $$,
  '42501',
  null,
  'anon reading waitlist_signups directly is refused'
);
reset role;

select ok(
  has_table_privilege('service_role', 'public.waitlist_signups', 'select'),
  'service_role can select on waitlist_signups'
);
select ok(
  has_table_privilege('service_role', 'public.waitlist_signups', 'insert'),
  'service_role can insert on waitlist_signups'
);
select ok(
  has_table_privilege('service_role', 'public.waitlist_signups', 'update'),
  'service_role can update on waitlist_signups'
);
select ok(
  has_table_privilege('service_role', 'public.waitlist_signups', 'delete'),
  'service_role can delete on waitlist_signups'
);
select ok(
  has_table_privilege('service_role', 'public.push_subscriptions', 'select'),
  'service_role can select on push_subscriptions'
);
select ok(
  has_table_privilege('service_role', 'public.push_subscriptions', 'insert'),
  'service_role can insert on push_subscriptions'
);
select ok(
  has_table_privilege('service_role', 'public.push_subscriptions', 'update'),
  'service_role can update on push_subscriptions'
);
select ok(
  has_table_privilege('service_role', 'public.push_subscriptions', 'delete'),
  'service_role can delete on push_subscriptions'
);
select ok(
  not (
    has_table_privilege('anon', 'public.waitlist_signups', 'select')
    or has_table_privilege('anon', 'public.waitlist_signups', 'insert')
    or has_table_privilege('anon', 'public.waitlist_signups', 'update')
    or has_table_privilege('anon', 'public.waitlist_signups', 'delete')
  ),
  'anon has no select, insert, update or delete on waitlist_signups'
);
select ok(
  not (
    has_table_privilege('anon', 'public.push_subscriptions', 'select')
    or has_table_privilege('anon', 'public.push_subscriptions', 'insert')
    or has_table_privilege('anon', 'public.push_subscriptions', 'update')
    or has_table_privilege('anon', 'public.push_subscriptions', 'delete')
  ),
  'anon has no select, insert, update or delete on push_subscriptions'
);
select ok(
  not (
    has_table_privilege('authenticated', 'public.waitlist_signups', 'select')
    or has_table_privilege('authenticated', 'public.waitlist_signups', 'insert')
    or has_table_privilege('authenticated', 'public.waitlist_signups', 'update')
    or has_table_privilege('authenticated', 'public.waitlist_signups', 'delete')
  ),
  'authenticated has no select, insert, update or delete on waitlist_signups'
);
select ok(
  not (
    has_table_privilege('authenticated', 'public.push_subscriptions', 'select')
    or has_table_privilege('authenticated', 'public.push_subscriptions', 'insert')
    or has_table_privilege('authenticated', 'public.push_subscriptions', 'update')
    or has_table_privilege('authenticated', 'public.push_subscriptions', 'delete')
  ),
  'authenticated has no select, insert, update or delete on push_subscriptions'
);

select * from finish();
rollback;
