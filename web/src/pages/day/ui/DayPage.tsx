import { getTranslations } from "next-intl/server";

import { HoursCard } from "@/features/hours-entry";
import { WelcomeToast } from "@/features/welcome-toast";
import { CenteredState } from "@/shared/ui/centered-state";
import { Title } from "@/shared/ui/title";

// The day screen, now with the first thing a person can actually touch:
// the hours card (features/hours-entry). It keeps nothing — the number is
// React state and a reload clears it (ADR 0060) — so the rest of the
// screen, the studies and the totals, still arrives with the ministry
// tables.
//
// The screen itself stays a server component. The card is the only client
// island on it, the same arrangement the forms use.
//
// What stood here before the card was a scaffold probe that called the
// Supabase Edge Function `health` and printed "ok" / "unreachable" — a
// wiring check from the first days of the project, never a screen.
// Whether the backend answers is now the job of features/network-status,
// on every screen rather than this one.
//
// WelcomeToast stays: it is what greets someone by name right after they
// sign in (ADR 0046), and /day is where the gate sends them.
export const DayPage = async () => {
  const t = await getTranslations("screens.day");

  return (
    // Not centred like the state screens: this one grows downwards as the
    // day gets its remaining sections, so it starts at the top and the
    // children stretch to the full width.
    <CenteredState fill className="items-stretch justify-start gap-5 px-5 pt-6 text-left">
      <WelcomeToast />
      <Title>{t("title")}</Title>
      <HoursCard />
    </CenteredState>
  );
};
