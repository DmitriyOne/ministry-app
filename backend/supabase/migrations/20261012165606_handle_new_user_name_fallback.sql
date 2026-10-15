-- A profile name must never be the reason an account cannot exist.
--
-- handle_new_user derived display_name from the metadata, falling back to
-- the local part of the address. Both can be absent, and then the insert
-- failed — verified on a live database, not reasoned about:
--
--   * an account with no email at all (a phone signup, or
--     auth.admin.createUser called without an address) →
--     null value in column "display_name" violates not-null constraint;
--   * an address whose local part is empty ('@jw.fenko.dev') →
--     new row violates check constraint "profiles_display_name_check".
--
-- The trigger runs inside the insert into auth.users, so either failure
-- rolls that insert back: the account is not created, GoTrue answers 500,
-- and the form says "the service is unavailable" (ADR 0046) with nothing
-- anywhere saying why. Neither case is reachable from the create-account
-- screen today — it requires an address and a name — so this is about the
-- next way an account gets made, not about a bug anyone has hit.
--
-- The last resort is the first eight characters of the user's id, not a
-- word: a word would be interface copy, which belongs in the dictionary
-- (en-GB.json) and not in a migration, and the same word on several rows
-- hides the fact that a name was never given. An id fragment is obviously
-- a placeholder to whoever reads the list of people.
--
-- Everything else is restated verbatim (ADR 0047's rule for replacing a
-- function): language, security mode, search_path.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      nullif(pg_catalog.btrim(new.raw_user_meta_data ->> 'display_name'), ''),
      nullif(pg_catalog.split_part(coalesce(new.email, ''), '@', 1), ''),
      pg_catalog.left(new.id::text, 8)
    )
  );

  insert into public.user_roles (user_id, role) values (new.id, 'user');

  return new;
end;
$$;

-- create or replace keeps privileges, so the revoke from ADR 0048 still
-- stands. Restated anyway: it costs nothing and the one thing worse than
-- a missing revoke is one that silently came back.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
