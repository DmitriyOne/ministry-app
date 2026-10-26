import { getTranslations } from "next-intl/server";

import { HoursCard } from "@/features/hours-entry";
import { ScreenLoadFailure } from "@/features/screen-retry";
import { WelcomeToast } from "@/features/welcome-toast";
import { CenteredState } from "@/shared/ui/centered-state";
import { Title } from "@/shared/ui/title";

import { readDayPage } from "../api/read-day-page";

// The day screen. The hours card on it now keeps what it is given (ADR
// 0062) — until 2.3 it kept nothing and a reload cleared it (ADR 0060) —
// so this screen has a read of its own, and with it a loading boundary
// (DayScreenSkeleton).
//
// The screen itself stays a server component; the card is the only
// client island on it, the same arrangement the forms use.
//
// WelcomeToast stays: it is what greets someone by name right after they
// sign in (ADR 0046), and /day is where the gate sends them.
export const DayPage = async () => {
  const t = await getTranslations("screens.day");
  const page = await readDayPage();

  return (
    // Not centred like the state screens: this one grows downwards as the
    // day gets its remaining sections, so it starts at the top and the
    // children stretch to the full width.
    <CenteredState fill className="items-stretch justify-start gap-5 px-5 pt-6 text-left">
      <WelcomeToast />
      <Title>{t("title")}</Title>

      {/* A card is drawn only when we know what the day holds. The read
          having failed is not the same as a day with nothing on it: a
          card opened at zero would let one tap overwrite hours somebody
          really served, and this is the one place on the screen where
          guessing would cost data rather than looks. */}
      {page.status === "unavailable"
        ? (
            // The failure wears the card's own shape and sits where the
            // card would be, so the screen does not change outline once
            // the hours arrive (the owner, 2026-10-26).
            <ScreenLoadFailure
              eyebrow={t("hours.label")}
              title={t("loadFailure.title")}
              text={t("loadFailure.text")}
            />
          )
        : (
            // Keyed by the day: the card reads what the database holds
            // once, at mount, and from then on the taps are the truth
            // about the number. Another day has to be another mount, or
            // the card would open on Tuesday showing Monday's total.
            <HoursCard
              key={page.day}
              day={page.day}
              savedMinutes={page.savedMinutes}
              timeZone={page.timeZone}
            />
          )}
    </CenteredState>
  );
};
