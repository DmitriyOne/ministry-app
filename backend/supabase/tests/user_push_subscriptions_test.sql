begin;

create extension if not exists pgtap with schema extensions;

select plan(13);

select has_function(
  'public', 'register_user_push_subscription', 'the register function exists');
select has_function(
  'public', 'forget_user_push_subscription', 'the forget function exists');

-- security invoker, like every write path added since ADR 0037: the
-- caller holds the secret key, the function does not grant itself rights.
select is(
  (select prosecdef from pg_proc where oid = 'public.register_user_push_subscription(uuid, text, text, text)'::regprocedure),
  false,
  'register_user_push_subscription is security invoker'
);
select is(
  (select prosecdef from pg_proc where oid = 'public.forget_user_push_subscription(uuid, text)'::regprocedure),
  false,
  'forget_user_push_subscription is security invoker'
);
select ok(
  not has_function_privilege('authenticated', 'public.register_user_push_subscription(uuid, text, text, text)', 'execute'),
  'authenticated cannot call the register function directly'
);
select ok(
  not has_function_privilege('anon', 'public.forget_user_push_subscription(uuid, text)', 'execute'),
  'anon cannot call the forget function directly'
);

-- A row has to belong to someone; neither owner is not a row anyone
-- could ever address.
select throws_ok(
  $$insert into public.push_subscriptions (endpoint, p256dh, auth)
    values ('https://push.example.com/orphan', 'key', 'auth')$$,
  '23514',
  null,
  'a subscription with neither owner is rejected'
);

insert into auth.users (id, email) values
  ('66666666-6666-6666-6666-666666666666', 'push@example.com');

select is(
  public.register_user_push_subscription(
    '66666666-6666-6666-6666-666666666666',
    'https://push.example.com/aaa', 'key-a', 'auth-a'),
  true,
  'registering a subscription for a signed-in person succeeds'
);

-- The point of keeping the owner as a column: one device is one row,
-- whatever it subscribed for.
select is(
  public.register_user_push_subscription(
    '66666666-6666-6666-6666-666666666666',
    'https://push.example.com/aaa', 'key-b', 'auth-b'),
  true,
  'registering the same endpoint again succeeds'
);
select is(
  (select count(*)::int from public.push_subscriptions
    where endpoint = 'https://push.example.com/aaa'),
  1,
  'the same endpoint does not produce a second row'
);
select is(
  (select p256dh from public.push_subscriptions
    where endpoint = 'https://push.example.com/aaa'),
  'key-b',
  'the keys of an existing endpoint are updated in place'
);

-- Scoped to the caller's own row: an endpoint is a bearer token for a
-- device, and knowing one must not switch off someone else's.
select is(
  public.forget_user_push_subscription(
    '77777777-7777-7777-7777-777777777777', 'https://push.example.com/aaa'),
  false,
  'another account cannot forget this subscription'
);

select is(
  public.forget_user_push_subscription(
    '66666666-6666-6666-6666-666666666666', 'https://push.example.com/aaa'),
  true,
  'the owner forgets their own subscription'
);

select * from finish();
rollback;
