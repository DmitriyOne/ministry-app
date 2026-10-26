// Client-safe, and that is a property to keep: the sheet is a client
// component and imports this barrel, so nothing here may reach a module
// marked `server-only` (ADR 0034's trap, met from the other side). That
// is why the status is READ at the call site, with the client the screen
// already holds, and only the answer is turned into something renderable
// here.
export { toEffectiveMinistryStatus } from "./api/to-effective-ministry-status";
export {
  isMinistryStatus,
  MAX_MONTHLY_GOAL_HOURS,
  MINISTRY_STATUS_CATALOGUE,
  MINISTRY_STATUSES,
  type MinistryGoalRule,
  type MinistryStatus,
  type MinistryStatusDuration,
} from "./model/catalogue";
export {
  findMinistryStatusChoice,
  MINISTRY_STATUS_CHOICES,
  type MinistryStatusChoice,
  ministryStatusChoiceFor,
} from "./model/choices";
export { addMonths, type MonthKey, parseMonthKey, toMonthKey } from "./model/month-key";
export {
  DEFAULT_MINISTRY_STATUS,
  type EffectiveMinistryStatus,
} from "./model/resolve-status";
export {
  SERVICE_YEAR_FIRST_MONTH,
  type ServiceYear,
  serviceYearOf,
} from "./model/service-year";
// The zone itself is not this entity's — it lives in shared/lib/time-zone,
// because ministry-day asks the same clock the same question.
export { currentMonthKey, deviceMonthKey } from "./model/time-zone";
