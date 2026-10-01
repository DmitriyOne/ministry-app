import { describe, expect, it } from "vitest";

import { mapJoinWaitlistRow } from "./map-join-waitlist-row";

const SUBMIT_ERROR = "Couldn't join the waitlist. Please try again.";

describe("mapJoinWaitlistRow", () => {
  it("reports a fresh signup with its place in the list", () => {
    expect(mapJoinWaitlistRow({ already_joined: false, list_position: 12 }, SUBMIT_ERROR)).toEqual({
      status: "success",
      position: 12,
      alreadyJoined: false,
    });
  });

  it("reports an address that was already there, at the position it already has", () => {
    expect(mapJoinWaitlistRow({ already_joined: true, list_position: 12 }, SUBMIT_ERROR)).toEqual({
      status: "success",
      position: 12,
      alreadyJoined: true,
    });
  });

  it("falls back to the submit error when nothing came back", () => {
    expect(mapJoinWaitlistRow(null, SUBMIT_ERROR)).toEqual({
      status: "error",
      formError: SUBMIT_ERROR,
    });

    expect(mapJoinWaitlistRow(undefined, SUBMIT_ERROR)).toEqual({
      status: "error",
      formError: SUBMIT_ERROR,
    });
  });

  // A counted position always includes the row the function just found or
  // inserted, so the smallest honest value is 1. Anything else means the
  // contract broke, and showing a wrong number is worse than asking the
  // person to try again.
  it.each([0, -1, 1.5, Number.NaN])("falls back to the submit error for position %s", (position) => {
    expect(mapJoinWaitlistRow({ already_joined: false, list_position: position }, SUBMIT_ERROR)).toEqual(
      {
        status: "error",
        formError: SUBMIT_ERROR,
      },
    );
  });
});
