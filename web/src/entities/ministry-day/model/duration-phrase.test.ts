import { describe, expect, it } from "vitest";

import { durationPhrase, type TranslateDuration } from "./duration-phrase";

// The real strings from en-GB.json, so a failure reads the way the
// screen reads.
const PHRASES = {
  hours: "{hours} h",
  minutes: "{minutes} min",
  hoursMinutes: "{hours} h {minutes} min",
} as const;

const translate: TranslateDuration = (key, values) =>
  Object.entries(values ?? {}).reduce<string>(
    (text, [name, value]) => text.replace(`{${name}}`, String(value)),
    PHRASES[key],
  );

describe("durationPhrase", () => {
  it("drops the minutes from a whole number of hours", () => {
    expect(durationPhrase(translate, 134 * 60)).toBe("134 h");
  });

  it("drops the hours from a bare remainder", () => {
    expect(durationPhrase(translate, 15)).toBe("15 min");
    expect(durationPhrase(translate, 0)).toBe("0 min");
  });

  it("says both where there are both", () => {
    expect(durationPhrase(translate, 1690)).toBe("28 h 10 min");
    expect(durationPhrase(translate, 90)).toBe("1 h 30 min");
  });
});
