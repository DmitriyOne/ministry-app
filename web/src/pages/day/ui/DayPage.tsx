import { getTranslations } from "next-intl/server";

import { WelcomeToast } from "@/features/welcome-toast";
import { CenteredState } from "@/shared/ui/centered-state";
import { Title } from "@/shared/ui/title";

// A placeholder, like /calendar, /month and /year: v2 lays out the
// navigation and the routes, the day's own entry form arrives with the
// ministry tables.
//
// What stood here was a scaffold probe that called the Supabase Edge
// Function `health` and printed "ok" / "unreachable" — a wiring check
// from the first days of the project, never a screen. Whether the
// backend answers is now the job of features/network-status, on every
// screen rather than this one, and whether the database answers shows up
// where a person actually asks something of it.
//
// WelcomeToast stays: it is what greets someone by name right after they
// sign in (ADR 0046), and /day is where the gate sends them.
export const DayPage = async () => {
  const t = await getTranslations("screens.day");

  return (
    <CenteredState fill>
      <WelcomeToast />
      <Title>{t("title")}</Title>
    </CenteredState>
  );
};
