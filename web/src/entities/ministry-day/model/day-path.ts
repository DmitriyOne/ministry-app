import { routes } from "@/shared/config";

import type { DayKey } from "./day-key";

// The address of one day's screen: /day/2026-06-02.
//
// Every /day carries its date, today's included (the owner, 2026-10-27),
// so this is the only way the screen is linked to and the bare /day
// exists to redirect to it.
//
// Here rather than beside the route constants, although FSD v2.1 allows
// path builders in `shared`: this one takes a DayKey, and the brand is
// the point. `shared` may not import `entities`, so a builder living
// there would have to accept a plain string — and then a link to
// /day/garbage, which renders a 404, would be one typo away. The prefix
// it is built on IS a plain constant, and that one does live in
// shared/config, where route-policy.ts reads it to shield the whole
// family.
export const dayPath = (day: DayKey): string => `${routes.day}/${day}`;
