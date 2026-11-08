import "server-only";

import {
  createServerSupabaseClient,
  queryDeadline,
  SCREEN_UNAVAILABLE,
  type ScreenRead,
} from "@/shared/api";
import { reportReadFailure } from "@/shared/lib/action-failure";

// Every day this person has ever recorded, for the export (ADR 0071).
//
// Read under their own session: ministry_days grants select to
// `authenticated` and its policy scopes the rows to the caller, so there
// is no id filter here and no function to go through — the same reasoning
// the calendar's read is built on (ADR 0069).
export type ExportDaysRead = ScreenRead<{ rows: { day: string; minutes: number }[] }>;

const SCOPE = "read-export-days";

// PostgREST truncates a response at `db.max_rows`, which this project
// sets to 1000 (backend/supabase/config.toml). It does so SILENTLY: the
// thousand-and-first row simply is not there, and nothing in the answer
// says a row was dropped. So this read pages by key, the way
// `push:version` does for subscriptions (ADR 0058) — the trap is the same
// one ADR 0038 named for the launch push.
const PAGE_SIZE = 1000;

// Twenty pages is twenty thousand days, or fifty-four years of recording
// something every single day. The cap exists so a bug in the cursor
// cannot spin forever, not because anybody is expected to reach it.
const MAX_PAGES = 20;

export const readExportDays = async (): Promise<ExportDaysRead> => {
  const supabase = await createServerSupabaseClient();
  const started = Date.now();
  const rows: { day: string; minutes: number }[] = [];

  // The cursor is the last day seen. Ordering by the primary key's second
  // column means every page continues exactly where the previous stopped,
  // and a row written while this runs cannot shift the window the way an
  // offset would.
  let cursor: string | null = null;

  for (let page = 0; page < MAX_PAGES; page += 1) {
    let query = supabase
      .from("ministry_days")
      .select("day, minutes")
      .is("deleted_at", null)
      .order("day", { ascending: true })
      .limit(PAGE_SIZE);

    if (cursor !== null) query = query.gt("day", cursor);

    const { data, error } = await query.abortSignal(queryDeadline(started));

    if (error) {
      reportReadFailure({ scope: SCOPE, step: "days", error });

      return SCREEN_UNAVAILABLE;
    }

    rows.push(...(data ?? []));

    // A short page is the last page. Exactly PAGE_SIZE rows may or may not
    // be the end, so it costs one more request to find out — which is the
    // cheaper mistake.
    if ((data?.length ?? 0) < PAGE_SIZE) return { status: "ready", rows };

    cursor = data?.at(-1)?.day ?? null;

    // No cursor to continue from, with a full page behind us: the column
    // came back empty or unparseable. Refusing here rather than looping
    // on the same page forever.
    if (cursor === null) {
      reportReadFailure({
        scope: SCOPE,
        step: "cursor",
        error: new Error("a full page came back with no day to continue from"),
      });

      return SCREEN_UNAVAILABLE;
    }
  }

  // The cap was reached, which means there is more data than this read
  // will fetch. It REFUSES rather than handing over what it has: an
  // export is a file somebody keeps and may later restore from, and one
  // that is quietly missing the most recent years is worse than no file
  // at all.
  reportReadFailure({
    scope: SCOPE,
    step: "page-cap",
    error: new Error(`more than ${MAX_PAGES * PAGE_SIZE} days to export`),
  });

  return SCREEN_UNAVAILABLE;
};
