// Client-safe, and that is a property to keep: the hours card is a
// client component and imports this barrel, so nothing here may reach a
// module marked `server-only` (ADR 0034's trap, met from the other
// side). The day's minutes are READ at the call site, with the client the
// screen already holds.
export {
  addDays,
  currentDayKey,
  type DayKey,
  deviceDayKey,
  parseDayKey,
  toDayKey,
} from "./model/day-key";
