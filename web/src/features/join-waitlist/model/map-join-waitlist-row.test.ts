import { describe, expect, it } from "vitest";

import { mapJoinWaitlistRow } from "./map-join-waitlist-row";

const SUBMIT_ERROR = "Couldn't join the waitlist. Please try again.";
const TOKEN = "4a69fc14-3a48-4cee-bb43-1f6dffac9f5a";

describe("mapJoinWaitlistRow", () => {
  it("reports a fresh signup with its position and push enrollment token", () => {
    expect(
      mapJoinWaitlistRow(
        {
          already_joined: false,
          list_position: 12,
          push_enrollment_token: TOKEN,
        },
        SUBMIT_ERROR,
      ),
    ).toEqual({
      status: "success",
      position: 12,
      alreadyJoined: false,
      pushEnrollmentToken: TOKEN,
    });
  });

  it("never exposes a push enrollment token for an existing signup", () => {
    expect(
      mapJoinWaitlistRow(
        {
          already_joined: true,
          list_position: 12,
          push_enrollment_token: null,
        },
        SUBMIT_ERROR,
      ),
    ).toEqual({
      status: "success",
      position: 12,
      alreadyJoined: true,
      pushEnrollmentToken: undefined,
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

  it.each([0, -1, 1.5, Number.NaN])(
    "falls back to the submit error for position %s",
    (position) => {
      expect(
        mapJoinWaitlistRow(
          {
            already_joined: false,
            list_position: position,
            push_enrollment_token: TOKEN,
          },
          SUBMIT_ERROR,
        ),
      ).toEqual({
        status: "error",
        formError: SUBMIT_ERROR,
      });
    },
  );
});
