"use client";

import { useTranslations } from "next-intl";

import { Button } from "@/shared/ui/button";
import { Spinner } from "@/shared/ui/spinner";

import { useWaitlistNotifications } from "../model/use-waitlist-notifications";

type EnableWaitlistNotificationsProps = {
  enrollmentToken: string;
};

export const EnableWaitlistNotifications = ({
  enrollmentToken,
}: EnableWaitlistNotificationsProps) => {
  const t = useTranslations("notifications.waitlist");
  const { status, isPending, isStandalone, enable }
    = useWaitlistNotifications(enrollmentToken);

  // Push only works in the installed app (iOS), and the installed app is
  // the only place the surrounding screens expect to be used, so outside it
  // the control is simply not offered rather than explained.
  if (!isStandalone) {
    return null;
  }

  if (status === "enabled") {
    return <p className="text-caption text-ink-muted">{t("enabled")}</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      <Button
        variant="deep"
        size="role"
        className="w-full"
        isDisabled={isPending}
        onPress={() => void enable()}
      >
        {isPending ? <Spinner className="size-4" /> : null}
        {isPending ? t("enabling") : t("enable")}
      </Button>

      {status === "denied"
        ? (
            <p className="text-caption text-negative">{t("denied")}</p>
          )
        : null}

      {status === "unsupported"
        ? (
            <p className="text-caption text-ink-muted">{t("unsupported")}</p>
          )
        : null}

      {status === "error"
        ? (
            <p className="text-caption text-negative">{t("error")}</p>
          )
        : null}
    </div>
  );
};
