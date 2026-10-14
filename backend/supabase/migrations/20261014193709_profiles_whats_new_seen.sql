-- The What's New screen (ADR 0057): which version of the app this person
-- has already opened that screen for. The profile row shows a dot while
-- this differs from the running version.
--
-- Nullable with no default on purpose. `null` means "has opened none",
-- which is exactly right for everyone who exists before this migration:
-- the dot appears once, they read the history, it goes away. A backfill
-- would instead claim they had already seen a screen that did not exist.
alter table public.profiles
  add column whats_new_seen text;

comment on column public.profiles.whats_new_seen is
  'Version of the app whose What''s New screen this person has opened (root package.json version, e.g. "2.0.0"). Null means none. See ADR 0057.';

-- A COLUMN grant, not a table grant — the same reasoning that put
-- display_name on its own line (ADR 0043). An RLS policy restricts which
-- ROWS may be changed and says nothing about which COLUMNS: with
-- `grant update on table`, a person could run
-- `update profiles set created_at = ...` against their own row. The
-- existing "update own profile" policy covers the row; this covers the
-- column, and both are needed.
grant update (whats_new_seen) on table public.profiles to authenticated;
