// The letters shown in place of an avatar: two from a name of two words
// or more, one from a single word. There are no uploaded pictures in this
// app and no plan for them, so the name is all there is to draw with.
//
// Deliberately simple about what a "word" is — whitespace separates them.
// A hyphenated surname counts as one word and gives one letter, which is
// the right answer for a two-letter badge anyway.
export const getInitials = (displayName: string): string => {
  const words = displayName.trim().split(/\s+/).filter(Boolean);

  if (words.length === 0) return "";

  // Array.from, not [0]: a string index returns half of a surrogate pair,
  // so a name starting with an emoji or a character outside the basic
  // plane would render as a broken glyph.
  const firstLetter = (word: string): string => Array.from(word)[0] ?? "";

  const letters = words.length === 1
    ? firstLetter(words[0]!)
    : `${firstLetter(words[0]!)}${firstLetter(words[1]!)}`;

  return letters.toLocaleUpperCase("en-GB");
};
