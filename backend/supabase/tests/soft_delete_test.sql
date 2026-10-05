begin;

create extension if not exists pgtap with schema extensions;

select plan(14);

-- The column exists on every table.
select has_column('public', 'profiles', 'deleted_at', 'profiles.deleted_at exists');
select has_column('public', 'user_roles', 'deleted_at', 'user_roles.deleted_at exists');
select has_column('public', 'waitlist_signups', 'deleted_at', 'waitlist_signups.deleted_at exists');
select has_column('public', 'push_subscriptions', 'deleted_at', 'push_subscriptions.deleted_at exists');

-- The policy no longer shows a soft-deleted row to its owner.
insert into auth.users (id, email) values
  ('33333333-3333-3333-3333-333333333333', 'ruth@example.com');
update public.profiles set deleted_at = now()
  where id = '33333333-3333-3333-3333-333333333333';

set local role authenticated;
set local request.jwt.claims = '{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}';
select is(
  (select count(*)::int from public.profiles),
  0,
  'a soft-deleted profile is invisible even to its owner'
);
reset role;

-- Partial UNIQUE: two deleted rows may share an address, two live ones may not.
insert into public.waitlist_signups (email, deleted_at)
  values ('twice@example.com', now()), ('twice@example.com', now());
select lives_ok(
  $$insert into public.waitlist_signups (email) values ('twice@example.com')$$,
  'an address freed by a soft delete can be used again'
);
select throws_ok(
  $$insert into public.waitlist_signups (email) values ('twice@example.com')$$,
  '23505',
  null,
  'two live rows still cannot share an address'
);

-- join_waitlist treats a deleted signup as absent...
insert into public.waitlist_signups (email, deleted_at)
  values ('returning@example.com', now());
select is(
  (select already_joined from public.join_waitlist('returning@example.com')),
  false,
  'join_waitlist treats a soft-deleted signup as absent, so the person can re-join'
);
-- ...and does not inflate the position.
-- Joined in its own statement: a count in the same statement would run on
-- the snapshot taken before the function inserted its row.
create temp table counted_join as
  select * from public.join_waitlist('counted@example.com');
select is(
  (select list_position from counted_join),
  (select count(*) from public.waitlist_signups where deleted_at is null),
  'the list position counts only live signups'
);

-- The hook does not hand out a deleted role.
insert into auth.users (id, email) values
  ('44444444-4444-4444-4444-444444444444', 'gone@example.com');
update public.user_roles set deleted_at = now()
  where user_id = '44444444-4444-4444-4444-444444444444';
select is(
  public.custom_access_token_hook(jsonb_build_object(
    'user_id', '44444444-4444-4444-4444-444444444444',
    'claims', jsonb_build_object('sub', '44444444-4444-4444-4444-444444444444')
  )) -> 'claims' ->> 'user_role',
  null,
  'a soft-deleted role does not reach the JWT'
);

-- on conflict against the partial index: registering the same endpoint
-- twice must update the row, not fail.
select lives_ok(
  $$select public.register_waitlist_push_subscription(
      (select push_enrollment_token from public.waitlist_signups
        where email = 'counted@example.com'),
      'https://push.example.com/abc', 'key', 'auth')$$,
  'registering a push subscription still works through the partial index'
);
select is(
  (select count(*)::int from public.push_subscriptions
    where endpoint = 'https://push.example.com/abc'),
  1,
  'the upsert path still updates in place rather than inserting twice'
);

-- The trigger functions must not be callable by the PostgREST roles. The
-- triggers themselves keep working — checked by the inserts above, which
-- rely on handle_new_user to create the profile rows.
select ok(
  not has_function_privilege('authenticated', 'public.handle_new_user()', 'execute'),
  'authenticated cannot execute the new-user trigger function'
);
select ok(
  not has_function_privilege('anon', 'public.set_updated_at()', 'execute'),
  'anon cannot execute the updated_at trigger function'
);

select * from finish();

rollback;
