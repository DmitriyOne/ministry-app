"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";

import { readWelcomeFlag } from "@/shared/lib/welcome-flag";
import { showToast } from "@/shared/ui/sonner";

// Not markup: wires the "greet once after sign-in" scenario to the shared
// toast region, so it renders nothing.
export const WelcomeToast = () => {
  const t = useTranslations("screens.day");

  useEffect(() => {
    const name = readWelcomeFlag();

    if (name) showToast({ message: t("welcomeBack", { name }), tone: "positive" });
  }, [t]);

  return null;
};
