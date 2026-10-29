import type { MinistryStatus } from "./catalogue";

// Whether the year's figure is this person's at all, and so whether a
// screen may show it.
//
// The database answers the arithmetic — how many hours the twelve months
// from a given September come to, counting only the months spent as a
// regular pioneer — and that sum stands on its own: somebody appointed
// in November sees 500 rather than the 600 from the leaflet, because 600
// would have shown them behind from their first day (ADR 0061, decision
// 5).
//
// What the sum cannot say is whether the figure still belongs to them.
// A person who served as a pioneer in September and then took a month of
// auxiliary pioneering is no longer under a yearly norm, yet the months
// already served keep their hours and the sum stays above zero. The
// owner's rule for that (2026-10-29): "I stopped being a regular
// pioneer, so I do not need that figure at all". So the goal for the
// year is shown to a regular pioneer and to nobody else — the status in
// force for the month the screen is about, not for some other month.
//
// Zero is the other absence: nobody has ever pioneered, so there is no
// year to aim at. Both answer null, because a screen draws the same
// dash for either.
export const visibleYearGoalHours = (
  status: MinistryStatus | null | undefined,
  hours: number | null,
): number | null => (
  status === "regular_pioneer" && hours !== null && hours > 0 ? hours : null
);
