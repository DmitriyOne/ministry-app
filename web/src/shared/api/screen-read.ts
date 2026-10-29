// What a screen's own read answers, in one shape for every screen.
//
// Both /day and /profile ask the database for the blocks they are made
// of, and both have to tell the difference between "nothing recorded"
// and "we could not find out" — a difference that costs data on /day,
// where a card opened at zero would let one tap overwrite real hours
// (ADR 0062). They used to say it in two different languages: a null
// field here, a discriminated union there, so a reader of one screen
// learned nothing about the other (the owner, 2026-10-26).
//
// A tag rather than a nullable field, because the ready case carries
// several values and "all of them are null" is not a state the type
// should allow. The ready members sit at the top level — `& TReady`,
// not `data: TReady` — so a screen reads `page.displayName` once the
// check has narrowed it, with no wrapper to unpack.
export type ScreenRead<TReady>
  = | { status: "unavailable" }
    | ({ status: "ready" } & TReady);

// The failed read, written once. `satisfies` rather than a bare `as
// const` so a typo in the tag is a compile error here instead of a
// branch that never matches at a call site.
export const SCREEN_UNAVAILABLE = { status: "unavailable" } as const satisfies ScreenRead<never>;
