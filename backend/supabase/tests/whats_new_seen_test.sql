begin;

create extension if not exists pgtap with schema extensions;

select plan(7);

-- What this file is really about: the column grant. The RLS policy on
-- profiles already limits a person to their own ROW; nothing in it says
-- anything about COLUMNS, so writing to whats_new_seen is permitted by
-- `grant update (whats_new_seen)` and by nothing else. Drop that grant
-- and the marker silently stops clearing; widen it to the whole table
-- and a person can rewrite their own created_at. Both mistakes are
-- invisible in TypeScript, so they are pinned here (ADR 0043/0057).

select has_column('public', 'profiles', 'whats_new_seen',
  'profiles carries whats_new_seen');
select col_is_null('public', 'profiles', 'whats_new_seen',
  'whats_new_seen is nullable: null means this person has opened none');
select col_hasnt_default('public', 'profiles', 'whats_new_seen',
  'no default, so existing people are not claimed to have read anything');

select ok(
  has_column_privilege('authenticated', 'public.profiles', 'whats_new_seen', 'update'),
  'authenticated may update whats_new_seen'
);

-- Two people, so "their own row" is a real restriction rather than the
-- only row in the table. handle_new_user creates the profiles.
insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'one@jw.fenko.dev'),
  ('22222222-2222-2222-2222-222222222222', 'two@jw.fenko.dev');

set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';

update public.profiles set whats_new_seen = '2.0.0'
  where id = '11111111-1111-1111-1111-111111111111';
select is(
  (select whats_new_seen from public.profiles
     where id = '11111111-1111-1111-1111-111111111111'),
  '2.0.0',
  'a person marks their own What''s New as read'
);

-- No error: the policy filters the row out, so the statement succeeds and
-- changes nothing. That is the shape of an RLS refusal on update, and the
-- assertion is on the other row being untouched.
update public.profiles set whats_new_seen = '9.9.9'
  where id = '22222222-2222-2222-2222-222222222222';
select is(
  (select whats_new_seen from public.profiles
     where id = '22222222-2222-2222-2222-222222222222'),
  null,
  'a person cannot mark someone else''s What''s New as read'
);

-- The grant is per column, and this is what proves it: the same statement
-- shape, one column over, is refused outright.
select throws_ok(
  $$update public.profiles set created_at = '1970-01-01Z'
      where id = '11111111-1111-1111-1111-111111111111'$$,
  '42501',
  null,
  'the new grant did not widen write access to the rest of the row'
);

select * from finish();

rollback;
