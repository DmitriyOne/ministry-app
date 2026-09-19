// Из каталога компонентов (components.html, вне репозитория) — см. ADR 0012.
// 1 = основной, 2 = второстепенный, 0 = не используется. Ключи экранов —
// техническая часть (совпадают с ключами showcase.components.matrix.screens
// в словаре), сами подписи берутся из словаря в usage-matrix.tsx.
export const SCREEN_KEYS = [
  "404",
  "500",
  "comingSoon",
  "login",
  "desktopBlock",
  "about",
] as const;

export const USAGE_MATRIX: Array<[string, ...number[]]> = [
  ["CenteredState", 1, 1, 1, 0, 1, 0],
  ["TopAndBottomState", 0, 0, 0, 1, 0, 0],
  ["ScrollState", 0, 0, 0, 0, 0, 1],
  ["ScreenHeader", 0, 0, 0, 0, 0, 1],
  ["AppMark", 0, 0, 2, 1, 1, 1],
  ["StatusGlyph", 1, 1, 0, 0, 0, 0],
  ["Eyebrow", 0, 0, 2, 0, 0, 1],
  ["Title", 1, 1, 2, 1, 2, 1],
  ["BodyText", 1, 1, 2, 1, 1, 1],
  ["Caption", 0, 1, 2, 1, 0, 0],
  ["InlineError", 0, 0, 0, 1, 0, 0],
  ["Button", 1, 1, 2, 1, 0, 0],
  ["ActionStack", 1, 1, 0, 1, 0, 0],
  ["FieldCard + FieldRow", 0, 0, 0, 1, 0, 0],
  ["PillForm", 0, 0, 1, 0, 0, 0],
  ["HeroCard", 0, 0, 0, 0, 0, 1],
  ["SectionLabel", 0, 0, 0, 0, 0, 1],
  ["ListCard + ListRow", 0, 0, 0, 0, 0, 1],
];
