// Единственная поддерживаемая локаль (ADR 0014). Отдельный модуль, а не
// строка прямо в request.ts/types.ts — оба места читают одно и то же
// значение, при добавлении языка правится в одной точке.
export const locale = "ru";
export type AppLocale = typeof locale;
