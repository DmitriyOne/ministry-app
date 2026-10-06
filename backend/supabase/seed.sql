-- Local seed data for `supabase db reset`. LOCAL ONLY: this file is never
-- applied to the cloud project — `supabase db push` sends migrations, not
-- seeds — so the passwords below never leave a developer's machine. They are
-- deliberately obvious for the same reason.
--
-- Two accounts, one per role, because v2 has exactly two (ADR 0043) and the
-- difference is only visible once you can sign in as each:
--
--   admin@ministry.local / password123   role: admin
--   user@ministry.local  / password123   role: user
--
-- Rows go straight into auth.users rather than through the Admin API,
-- because a seed file runs as SQL with no server to call. That means every
-- column GoTrue expects has to be filled in by hand; the ones that matter
-- are encrypted_password (bcrypt, via pgcrypto) and email_confirmed_at —
-- without the latter, sign-in is refused as an unconfirmed address.
--
-- The empty strings below are not decoration. GoTrue reads these token
-- columns into non-nullable Go strings, so a NULL in any of them makes every
-- sign-in fail with "unexpected_failure", and the reason is visible only in
-- the auth container's log: `Scan error on column index 3, name
-- "confirmation_token": converting NULL to string is unsupported`. Found
-- exactly that way.
--
-- public.profiles and public.user_roles are NOT inserted here: the
-- on_auth_user_created trigger (ADR 0043) creates both, and writing them
-- again would both duplicate the trigger's job and hide it if it broke. The
-- admin's role is the one thing the trigger cannot know, so it is updated
-- afterwards.

insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  confirmation_token,
  recovery_token,
  email_change,
  email_change_token_new,
  email_change_token_current,
  phone_change,
  phone_change_token,
  reauthentication_token,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
values
  (
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-4000-8000-000000000001',
    'authenticated',
    'authenticated',
    'admin@ministry.local',
    extensions.crypt('password123', extensions.gen_salt('bf')),
    now(),
    '', '', '', '', '', '', '', '',
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    '{"display_name": "Admin"}'::jsonb,
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-4000-8000-000000000002',
    'authenticated',
    'authenticated',
    'user@ministry.local',
    extensions.crypt('password123', extensions.gen_salt('bf')),
    now(),
    '', '', '', '', '', '', '', '',
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    '{"display_name": "User"}'::jsonb,
    now(),
    now()
  );

-- GoTrue looks the account up by its identity, not only by auth.users, so a
-- row seeded without one can be signed in with but behaves oddly afterwards.
insert into auth.identities (
  provider_id,
  user_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
)
select
  u.id::text,
  u.id,
  jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true),
  'email',
  now(),
  now(),
  now()
from auth.users u
where u.email in ('admin@ministry.local', 'user@ministry.local');

-- The trigger gave both accounts the default role; only this one differs.
update public.user_roles
   set role = 'admin'
 where user_id = '00000000-0000-4000-8000-000000000001';
