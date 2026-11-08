-- The correction stops being a public endpoint (ADR 0072)
-- ---------------------------------------------------------------------
-- amend_ministry_status_month was granted to `authenticated` when it was
-- written (ADR 0061), on the expectation that a screen would soon offer
-- the correction. None does, in 2.9 as in 2.2 — and a security definer
-- function in `public` with a grant is a reachable endpoint whether or
-- not the app knows about it: anyone holding a session can post to it
-- through PostgREST.
--
-- What it reaches is exactly what the other write functions refuse.
-- set_ministry_status fences itself to the month under way; this one
-- takes any month at all, including a month the person has CLOSED. The
-- accepted cost named in ADR 0066 — "a closed month may still change its
-- goal, never its hours" — was written about a correction nobody could
-- make yet. Leaving the grant means it is one request away.
--
-- So the function stays, with its rules and its tests, and the grant
-- goes. Nothing in the app loses anything: there is no caller to break,
-- and the day the screen is written, the grant belongs in that screen's
-- migration — an unused write privilege is still a write privilege
-- (the same rule profiles.time_zone has lived under since ADR 0061).
--
-- Execute is left with the owner alone. service_role does not inherit
-- it either: the original migration revoked it from `public`, and
-- service_role has no grant of its own.
revoke execute on function public.amend_ministry_status_month(date, text, smallint)
  from public, anon, authenticated;

comment on function public.amend_ministry_status_month(date, text, smallint) is
  'Corrects one month, including one already lived, leaving every other month showing exactly what it showed. Not reachable from the app: execute is granted to nobody, and the grant belongs to the migration of whichever screen first offers the correction. See ADR 0061 and ADR 0072.';
