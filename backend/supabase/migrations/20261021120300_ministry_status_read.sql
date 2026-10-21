-- The carry-forward rule, in one place (ADR 0061).
--
-- Returns the row in force for p_month, or nothing at all — and nothing
-- is a legitimate answer, meaning "publisher, no goal". That default
-- lives in the read rule rather than in the data, so nobody needs a
-- backfill and handle_new_user stays untouched: a person who has never
-- chosen has no row, and the absence is what says "publisher".
--
-- security invoker: it runs under the caller's own rights, so the select
-- policy applies and somebody else's month cannot come back from here
-- whatever is passed in. The user_id predicate repeats what the policy
-- already does; belt and braces, and it is what lets the planner use the
-- primary key.
create or replace function public.ministry_status_for_month(p_month date)
returns setof public.ministry_status_months
language sql
stable
security invoker
set search_path = ''
rows 1
as $$
  select *
    from public.ministry_status_months
   where user_id = (select auth.uid())
     and deleted_at is null
     and month <= p_month
     and (month = p_month or duration = 'until_changed')
   order by month desc
   limit 1;
$$;

comment on function public.ministry_status_for_month(date) is
  'The ministry status in force for the given month: that month''s own row, or the most recent earlier row that is still running. No rows means publisher with no goal. See ADR 0061.';

revoke all on function public.ministry_status_for_month(date) from public, anon;
grant execute on function public.ministry_status_for_month(date) to authenticated;
