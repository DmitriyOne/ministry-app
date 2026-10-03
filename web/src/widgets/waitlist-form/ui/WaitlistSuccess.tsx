"use client";

import { useTranslations } from "next-intl";

import { EnableWaitlistNotifications } from "@/features/push-notifications";

import { WaitlistSuccessCard } from "./WaitlistSuccessCard";

type WaitlistSuccessProps = {
  position?: number;
  alreadyJoined?: boolean;
  pushEnrollmentToken?: string;
};

export const WaitlistSuccess = ({
  position,
  alreadyJoined = false,
  pushEnrollmentToken,
}: WaitlistSuccessProps) => {
  const t = useTranslations("screens.comingSoon");

  const title
    = position === undefined
      ? t("successTitle")
      : alreadyJoined
        ? t("alreadyJoinedTitle", { position })
        : t("successTitleNumbered", { position });

  return (
    <WaitlistSuccessCard
      title={title}
      text={t("successText")}
      action={
        pushEnrollmentToken
          ? (
              <EnableWaitlistNotifications
                enrollmentToken={pushEnrollmentToken}
              />
            )
          : undefined
      }
    />
  );
};
