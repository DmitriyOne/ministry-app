import { describe, expect, it } from "vitest";

import { getInitials } from "./get-initials";

describe("getInitials", () => {
  it("takes one letter from a single word", () => {
    expect(getInitials("Ruth")).toBe("R");
  });

  it("takes the first letter of each of the first two words", () => {
    expect(getInitials("Ruth Fenko")).toBe("RF");
  });

  it("ignores words after the second", () => {
    expect(getInitials("Ruth Anne Fenko")).toBe("RA");
  });

  it("ignores stray whitespace", () => {
    expect(getInitials("  ruth   fenko ")).toBe("RF");
  });

  it("uppercases what it finds", () => {
    expect(getInitials("ruth")).toBe("R");
  });

  it("returns nothing for a name that is only whitespace", () => {
    // The caller decides what to draw instead; returning " " would put a
    // blank badge on the screen and look like a bug.
    expect(getInitials("   ")).toBe("");
  });

  it("keeps a character outside the basic plane whole", () => {
    // Indexing a string would return half a surrogate pair and render as
    // a broken glyph. Spelled as code points so this file stays ASCII.
    expect(getInitials("\u{1D49E}aesar")).toBe("\u{1D49E}");
  });
});
