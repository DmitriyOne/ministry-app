-- Puts the person's role into their access token (ADR 0044), so the
-- front end and proxy.ts read it from the JWT instead of querying a
-- table on every request.
--
-- The second half of Supabase's RBAC example — a role_permissions table
-- and an authorize(permission) function — is deliberately NOT here:
-- with two roles and no data tables there is nothing to authorise
-- against. It returns with the first ministry tables.
--
-- Enabling the hook is a PROJECT SETTING, not part of a migration:
-- [auth.hook.custom_access_token] in config.toml locally, and
-- Authentication → Hooks in the cloud dashboard for production.
create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  claims jsonb;
  found_role public.app_role;
begin
  claims := event -> 'claims';

  select role into found_role
    from public.user_roles
    where user_id = (event ->> 'user_id')::uuid;

  -- No row means the role was removed by hand. Signing in must still
  -- work, so the claims go back untouched and the front end applies its
  -- own default (shared/lib/auth).
  if found_role is not null then
    claims := jsonb_set(claims, '{user_role}', to_jsonb(found_role::text));
  end if;

  return jsonb_build_object('claims', claims);
end;
$$;

grant usage on schema public to supabase_auth_admin;
grant execute on function public.custom_access_token_hook(jsonb) to supabase_auth_admin;
revoke execute on function public.custom_access_token_hook(jsonb)
  from public, anon, authenticated;

-- Supabase's example grants this, and it is kept, but the comment it
-- usually carries would be wrong here: the hook does NOT need it. The
-- function is security definer and owned by postgres, so its body reads
-- user_roles as the table's owner, for whom neither this grant nor RLS
-- applies. Verified by revoking the grant and signing in for real: the
-- user_role claim still arrived.
--
-- It stays because the failure mode of being wrong is asymmetric. If the
-- function's owner ever differs from the table's — something this
-- migration cannot check in the cloud project — the hook would raise
-- insufficient_privilege, and GoTrue would fail to issue a token at all,
-- so nobody could sign in. A redundant select for supabase_auth_admin,
-- the role that already administers auth.users, is a far smaller cost
-- than that.
grant select on table public.user_roles to supabase_auth_admin;
