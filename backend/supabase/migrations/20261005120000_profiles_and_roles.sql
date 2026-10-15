-- Profiles and roles for v2 (ADR 0043). This is the first table in this
-- project with real RLS policies: the v1 rule — close the table
-- completely and expose one RPC (ADR 0033/0037) — was derived from a
-- case where an anonymous visitor writes rows it must never read. Here
-- a row belongs to the person reading it, under their own JWT, so a
-- policy is the direct tool and an RPC wrapper would be a layer to
-- write and test for no gain in safety.
--
-- user_roles is the exception to the exception: it keeps the v1 model
-- with no policy at all. A person learns their role from their own JWT
-- (public.custom_access_token_hook, the next migration), never by
-- reading this table.

create type public.app_role as enum ('user', 'admin');

create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text not null check (length(trim(display_name)) > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_roles (
  user_id uuid primary key references auth.users on delete cascade,
  role public.app_role not null default 'user'
);

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;

-- Grants are issued to a new table in public automatically and policies
-- do not take them back, so they are revoked explicitly — the same
-- reasoning as the v1 migrations.
revoke all on table public.profiles from anon, authenticated;
revoke all on table public.user_roles from anon, authenticated;

-- A column grant, not a table grant. A policy restricts which ROWS may
-- be changed and says nothing about which COLUMNS: with `grant update on
-- table`, a client could run `update profiles set created_at = ...` and
-- rewrite its own timestamps. display_name is the only field a person
-- may change, so it is the only one granted.
grant select on table public.profiles to authenticated;
grant update (display_name) on table public.profiles to authenticated;
grant select, insert, update, delete on table public.profiles to service_role;
grant select, insert, update, delete on table public.user_roles to service_role;

-- (select auth.uid()), not auth.uid(): wrapped in a subquery the planner
-- evaluates it once per statement instead of once per row.
create policy "read own profile" on public.profiles
  for select to authenticated using ((select auth.uid()) = id);

create policy "update own profile" on public.profiles
  for update to authenticated using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- No insert and no delete policy on purpose: accounts are issued by the
-- owner, so a person can neither create a profile for themselves nor
-- remove one.

-- Table-agnostic on purpose: every table that gets an updated_at column
-- reuses this one trigger function. security invoker, unlike
-- handle_new_user below — it only assigns to NEW and needs no rights the
-- caller has not got. now() resolves under an empty search_path because
-- pg_catalog is always searched implicitly; anything outside it would
-- have to be written out in full.
--
-- profiles is the first table here a client updates directly rather than
-- through an RPC, which is what makes the trigger necessary: there is no
-- single write path that could set updated_at itself, and the column
-- grant above deliberately denies the client any way to set it by hand.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- security definer with an empty search_path: the function needs rights
-- on public tables that the caller (the auth schema's insert) has not
-- got, and an empty search_path means every name below is written out
-- in full.
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
      nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''),
      split_part(new.email, '@', 1)
    )
  );

  insert into public.user_roles (user_id, role) values (new.id, 'user');

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
