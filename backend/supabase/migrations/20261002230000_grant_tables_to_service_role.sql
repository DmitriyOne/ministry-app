-- Grant the two tables to service_role explicitly.
--
-- No earlier migration grants anything on these tables: service_role reached
-- them only through Supabase's platform default privileges (pg_default_acl).
-- Both RPC functions are `security invoker`, so they run with the caller's
-- rights and depend on that default directly, as does the launch script.
-- Supabase is moving towards revoking those automatic grants and making
-- exposure opt-in; on a project with that default every call would fail with
-- 42501. This migration stops the project depending on a platform default
-- that is being changed.
--
-- anon and authenticated are deliberately not mentioned here: their grants
-- were revoked on purpose (see the earlier migrations).
--
-- Grants are idempotent, so this is safe on a database that already has them.

grant select, insert, update, delete on public.waitlist_signups  to service_role;
grant select, insert, update, delete on public.push_subscriptions to service_role;
