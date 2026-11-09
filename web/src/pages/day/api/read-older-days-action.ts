"use server";

import { parseDayKey } from "@/entities/ministry-day";
import { getSessionClaims } from "@/entities/session";
import { createServerSupabaseClient, SUPABASE_QUERY_TIMEOUT_MS } from "@/shared/api";
import { reportReadFailure } from "@/shared/lib/action-failure";

import { olderDaysSpan, type StripDay, stripDays } from "../model/last-days";

// The next chunk back, asked for when the strip on /day reaches its left
// edge (ADR 0065, update 2026-11-09). The first chunk comes with the
// screen, in the same batch as everything else it reads; from there the
// strip walks backwards a month and a half at a time.
//
// An action rather than a route handler, and an action that only reads:
// the answer is data for a component that is already mounted, not a file
// for the browser to save — which is the one thing that made the export
// a route handler instead (ADR 0071).
//
// The caller names the oldest day it already has, NOT a range. That is
// deliberate: with a range, a request could ask for ten years in one
// go; this way the step is ours and the only thing the caller decides is
// where to continue from. It can still walk back as far as it likes, one
// chunk per round trip — which is exactly what scrolling does.
const SCOPE = "read-older-days";

export const readOlderDays = async (oldest: string): Promise<StripDay[] | null> => {
  // The screen is behind a session already (proxy.ts) and the rows are
  // scoped to the caller by the table's own policy, so this check adds
  // no protection to the DATA. It is here because a Server Action is a
  // public endpoint and the answer should be the same shape for a
  // request nobody made: null, the same as a read that failed.
  if (!await getSessionClaims()) return null;

  const day = parseDayKey(oldest);

  // Cheap and synchronous, so before the client is built: a malformed
  // day never reaches the database.
  if (!day) return null;

  const span = olderDaysSpan(day);
  const supabase = await createServerSupabaseClient();

  // The same read the screen makes, over an older span: straight at the
  // table, because `ministry_days` grants select to authenticated and
  // its policy scopes the rows to the caller — there is nothing a
  // function would add — and the primary key (user_id, day) is the index
  // for exactly this shape of question.
  //
  // One whole budget rather than a share of the screen's: this runs
  // long after the screen was drawn, and nothing is waiting on it except
  // the chips about to appear.
  const { data, error } = await supabase
    .from("ministry_days")
    .select("day, minutes")
    .gte("day", span.from)
    .lte("day", span.to)
    .is("deleted_at", null)
    .abortSignal(AbortSignal.timeout(SUPABASE_QUERY_TIMEOUT_MS));

  if (error) {
    reportReadFailure({ scope: SCOPE, step: "older-days", error });

    return null;
  }

  return stripDays(span, data ?? []);
};
