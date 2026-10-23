import { describe, expect, it } from "vitest";

import {
  findMinistryStatusChoice,
  MINISTRY_STATUS_CHOICES,
  ministryStatusChoiceFor,
} from "./choices";

describe("MINISTRY_STATUS_CHOICES", () => {
  // The sheet shows these rows in this order, so both are asserted: the
  // list is derived from the catalogue, and a number added there must
  // show up here rather than silently nowhere.
  it("is the five things a person can pick, gentlest first", () => {
    expect(MINISTRY_STATUS_CHOICES.map((choice) => choice.id)).toEqual([
      "publisher",
      "auxiliary_pioneer:15",
      "auxiliary_pioneer:30",
      "regular_auxiliary_pioneer:30",
      "regular_pioneer:50",
    ]);
  });

  it("gives the one-off auxiliary pioneer both of its numbers", () => {
    const auxiliary = MINISTRY_STATUS_CHOICES.filter(
      (choice) => choice.status === "auxiliary_pioneer",
    );

    expect(auxiliary.map((choice) => choice.hours)).toEqual([15, 30]);
  });

  it("leaves the publisher without hours, because they choose their own", () => {
    expect(MINISTRY_STATUS_CHOICES[0]).toEqual({
      id: "publisher",
      status: "publisher",
      hours: null,
    });
  });
});

describe("findMinistryStatusChoice", () => {
  it("looks a choice up by its id", () => {
    expect(findMinistryStatusChoice("regular_pioneer:50")).toEqual({
      id: "regular_pioneer:50",
      status: "regular_pioneer",
      hours: 50,
    });
  });

  // The security property this list exists for: the hours come from here,
  // never from the request, so a status cannot arrive with hours that do
  // not belong to it.
  it("refuses a status with hours it does not have", () => {
    expect(findMinistryStatusChoice("publisher:50")).toBeNull();
    expect(findMinistryStatusChoice("regular_pioneer:30")).toBeNull();
  });

  it("refuses a status that does not exist", () => {
    expect(findMinistryStatusChoice("special_pioneer")).toBeNull();
    expect(findMinistryStatusChoice("")).toBeNull();
  });
});

describe("ministryStatusChoiceFor", () => {
  it("tells the two auxiliary rows apart by their hours", () => {
    expect(ministryStatusChoiceFor("auxiliary_pioneer", 15)?.id).toBe("auxiliary_pioneer:15");
    expect(ministryStatusChoiceFor("auxiliary_pioneer", 30)?.id).toBe("auxiliary_pioneer:30");
  });

  // The case that made this a function rather than a find() at the call
  // site: a publisher's hours are their own, so any number of them — or
  // none — still opens the sheet on the publisher row.
  it("keeps a publisher on the publisher row whatever goal they set", () => {
    expect(ministryStatusChoiceFor("publisher", null)?.id).toBe("publisher");
    expect(ministryStatusChoiceFor("publisher", 12)?.id).toBe("publisher");
  });

  it("ignores hours for a status whose hours are fixed", () => {
    expect(ministryStatusChoiceFor("regular_pioneer", null)?.id).toBe("regular_pioneer:50");
    expect(ministryStatusChoiceFor("regular_pioneer", 50)?.id).toBe("regular_pioneer:50");
  });

  it("has no row for an auxiliary pioneer on hours we do not offer", () => {
    expect(ministryStatusChoiceFor("auxiliary_pioneer", 20)).toBeNull();
  });
});
