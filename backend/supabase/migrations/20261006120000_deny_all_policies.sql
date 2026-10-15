-- Makes the deny-all intent of the three closed tables explicit in the
-- database itself (ADR 0048), replacing "no policies at all" as the way
-- it is expressed (ADR 0033, which asked for exactly this record before
-- any policy appeared on these tables).
--
-- IMPORTANT: this adds no protection, and it must not be read as the
-- lock. RLS enabled with zero policies already denies every row to every
-- role that goes through RLS, which is what ADR 0033 relied on. What
-- changes is legibility: `select * from pg_policies` and the Studio UI
-- now state the rule instead of leaving a reader to infer it from an
-- absence, and the "RLS enabled, no policy" advisor — which is defined
-- by that absence — has nothing left to report.
--
-- `to public` rather than `to anon, authenticated`: public covers every
-- role that exists now and every one added later. It nominally includes
-- service_role too, which changes nothing — see below.
--
-- WHAT ACTUALLY REACHES THESE TABLES, and why no policy can govern it:
-- only two things read them, and both bypass RLS entirely
-- (`rolbypassrls`), so Postgres never consults a policy for either —
-- verified on a live database, see ADR 0047:
--   * the RPC functions called with the secret key, which run as
--     service_role (join_waitlist, register_waitlist_push_subscription);
--   * public.custom_access_token_hook, which is security definer and
--     owned by postgres.
-- Access to these tables is therefore granted by holding the secret key,
-- not by anything written below. `anon` and `authenticated` additionally
-- have no grants at all (`revoke all`, ADR 0033) — a policy without a
-- grant does nothing on its own.

create policy "deny all direct access" on public.waitlist_signups
  for all to public using (false) with check (false);

comment on policy "deny all direct access" on public.waitlist_signups is
  'Deny-all by design: this table is reachable only through its RPC functions under service_role, which bypasses RLS. Documentation of intent, not the lock — see ADR 0033/0047/0048.';

create policy "deny all direct access" on public.push_subscriptions
  for all to public using (false) with check (false);

comment on policy "deny all direct access" on public.push_subscriptions is
  'Deny-all by design: written only by register_waitlist_push_subscription under service_role, which bypasses RLS. See ADR 0033/0047/0048.';

create policy "deny all direct access" on public.user_roles
  for all to public using (false) with check (false);

comment on policy "deny all direct access" on public.user_roles is
  'Deny-all by design: a person learns their role from their own JWT, never by reading this table. Read only by custom_access_token_hook (security definer, owned by postgres) and by service_role, both of which bypass RLS. See ADR 0044/0048.';
