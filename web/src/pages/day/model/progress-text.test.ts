import { readFileSync } from "node:fs";

import { describe, expect, it, vi } from "vitest";

// Same reason as progress-span.test.ts: the entity barrel reaches
// entities/ministry-day/model/day-path, which reads `routes` from
// `@/shared/config`, and that barrel also exports `env`, validated at
// import time — the real one fails in the runner before a single
// assertion.
vi.mock("@/shared/config", () => ({ routes: { day: "/day" } }));

import { progressAmount, progressStanding, type TranslateProgress } from "./progress-text";

// The dictionary, written out as the one thing these functions are
// allowed to see of it: the real strings from en-GB.json, so a test
// failure reads as the screen reads. The signs are the dictionary's
// U+2212, not a hyphen.
const PHRASES = {
  ahead: "(+{amount})",
  behind: "(−{amount})",
  level: "(+0)",
  hours: "{hours} h",
  minutes: "{minutes} min",
  hoursMinutes: "{hours} h {minutes} min",
} as const;

const translate: TranslateProgress = (key, values) =>
  Object.entries(values ?? {}).reduce<string>(
    (text, [name, value]) => text.replace(`{${name}}`, String(value)),
    PHRASES[key],
  );

describe("progressAmount", () => {
  it("drops the minutes from a whole number of hours", () => {
    expect(progressAmount(translate, 134 * 60)).toBe("134 h");
  });

  it("drops the hours from a bare remainder", () => {
    expect(progressAmount(translate, 15)).toBe("15 min");
    expect(progressAmount(translate, 0)).toBe("0 min");
  });

  it("says both where there are both", () => {
    expect(progressAmount(translate, 1690)).toBe("28 h 10 min");
    expect(progressAmount(translate, 90)).toBe("1 h 30 min");
  });
});

describe("progressStanding", () => {
  // The case the owner was looking at on 28 October: 1:50 served against
  // a goal of 30 hours. The bracket must owe the plain rest of the goal.
  it("owes the rest of the goal, in red", () => {
    expect(progressStanding(translate, 110, 30)).toEqual({
      text: "(−28 h 10 min)",
      tone: "short",
    });
  });

  it("says the state, not a measurement of nothing, when level", () => {
    expect(progressStanding(translate, 30 * 60, 30)).toEqual({ text: "(+0)", tone: "met" });
  });

  it("counts past the goal in green", () => {
    expect(progressStanding(translate, 31 * 60 + 30, 30)).toEqual({
      text: "(+1 h 30 min)",
      tone: "met",
    });
  });

  // A service year, with much bigger numbers: 277:15 of 360 hours.
  it("owes the rest of a service year", () => {
    expect(progressStanding(translate, 277 * 60 + 15, 360)).toEqual({
      text: "(−82 h 45 min)",
      tone: "short",
    });
  });
});

// The contract with the real dictionary.
//
// The fake above stays fake on purpose: what these functions decide is
// WHICH key to use, and a test driven by the real `t` would be checking
// next-intl's interpolation instead. But a fake is a copy, and a copy
// goes stale: rename `{amount}` in en-GB.json and every assertion above
// stays green while the screen prints the placeholder itself. The type
// cannot catch it either — TranslateProgress takes a plain
// `Record<string, string | number>`, which is the price paid for being
// callable from here at all (ADR 0064, decision 13).
//
// So this reads the dictionary off disk, drives the model through every
// branch with a translator that records what it was asked, and checks
// the two things nothing else does: that every key exists, and that the
// values handed over are exactly the placeholders that key contains.
const DICTIONARY = JSON.parse(
  readFileSync(
    new URL("../../../shared/config/i18n/messages/en-GB.json", import.meta.url),
    "utf8",
  ),
).screens.day.progress as Record<string, string>;

const placeholdersOf = (phrase: string): string[] =>
  [...phrase.matchAll(/\{(\w+)\}/g)].map(([, name]) => name).sort();

describe("the dictionary this model asks for", () => {
  const asked: { key: string; values: string[] }[] = [];

  const record: TranslateProgress = (key, values) => {
    asked.push({ key, values: Object.keys(values ?? {}).sort() });

    return key;
  };

  // Every branch of both functions: a bare remainder, whole hours, both,
  // and the three standings.
  progressAmount(record, 15);
  progressAmount(record, 134 * 60);
  progressAmount(record, 1690);
  progressStanding(record, 110, 30);
  progressStanding(record, 30 * 60, 30);
  progressStanding(record, 31 * 60 + 30, 30);

  it("asks for keys the dictionary has", () => {
    for (const { key } of asked) {
      expect(DICTIONARY, key).toHaveProperty(key);
    }
  });

  it("hands over exactly the placeholders each phrase carries", () => {
    for (const { key, values } of asked) {
      expect(values, key).toEqual(placeholdersOf(DICTIONARY[key]));
    }
  });

  // Guards the test itself: a branch added to the model and not driven
  // above would pass the two checks by never being looked at.
  it("covers every phrase the model can reach", () => {
    expect(new Set(asked.map(({ key }) => key))).toEqual(
      new Set(["minutes", "hours", "hoursMinutes", "behind", "level", "ahead"]),
    );
  });
});
