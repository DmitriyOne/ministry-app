// The four statuses a person can serve under, and what each one means in
// hours (ADR 0061).
//
// These numbers also exist in SQL, in public.ministry_status_shape, and
// that is deliberate rather than an oversight. The database is the
// AUTHORITY — it derives what it stores and refuses anything else, so a
// client cannot write itself a pioneer's goal — while this copy is for
// DISPLAY: the sheet has to say "50 h a month" before anything is
// written, and a round trip to ask the database what it would store
// would be a request to render a label. The cost of the duplication is
// bounded by that asymmetry: if the two ever disagree, the write is
// rejected, loudly, rather than silently stored wrong.

// In the order the sheet lists them: the gentlest commitment first.
export const MINISTRY_STATUSES = [
  "publisher",
  "auxiliary_pioneer",
  "regular_auxiliary_pioneer",
  "regular_pioneer",
] as const;

export type MinistryStatus = (typeof MINISTRY_STATUSES)[number];

// until_changed holds every following month; single_month is this month
// and no further. Only the one-off auxiliary pioneer is single_month —
// it is taken for one month at a time, which is what makes it different
// from the regular auxiliary pioneer doing 30 hours every month.
export type MinistryStatusDuration = "single_month" | "until_changed";

// How a status gets its hours, as three cases that cannot be mixed up.
// Written as a union rather than as three optional fields because the
// three fields allowed states that mean nothing — a fixed status that
// also offers a choice — and a screen then has to decide which field to
// believe.
// The three cases, in order below: "fixed" — the status sets the hours
// and nobody may change them; "choice" — the status offers a few and one
// has to be picked; "freeform" — the person types their own, or none at
// all.
export type MinistryGoalRule
  = { kind: "fixed"; hours: number }
    | { kind: "choice"; hours: readonly number[] }
    | { kind: "freeform" };

type CatalogueEntry = {
  duration: MinistryStatusDuration;
  goal: MinistryGoalRule;
};

export const MINISTRY_STATUS_CATALOGUE: Record<MinistryStatus, CatalogueEntry> = {
  publisher: {
    duration: "until_changed",
    goal: { kind: "freeform" },
  },
  auxiliary_pioneer: {
    duration: "single_month",
    goal: { kind: "choice", hours: [15, 30] },
  },
  regular_auxiliary_pioneer: {
    duration: "until_changed",
    goal: { kind: "fixed", hours: 30 },
  },
  regular_pioneer: {
    duration: "until_changed",
    goal: { kind: "fixed", hours: 50 },
  },
};

// The ceiling a month physically has: 31 × 24. The same number guards the
// column in the database.
export const MAX_MONTHLY_GOAL_HOURS = 744;

export const isMinistryStatus = (value: unknown): value is MinistryStatus =>
  typeof value === "string" && (MINISTRY_STATUSES as readonly string[]).includes(value);

// Beside isMinistryStatus for the same reason: `duration` is a text
// column, so it arrives as a string however narrow the check constraint
// on it is, and a value outside these two means this build is older than
// the database.
export const isMinistryStatusDuration = (value: unknown): value is MinistryStatusDuration =>
  value === "single_month" || value === "until_changed";
