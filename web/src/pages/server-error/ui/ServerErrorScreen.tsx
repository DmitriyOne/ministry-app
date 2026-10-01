"use client";

import { useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";

import { locale, routes } from "@/shared/config";
import { ActionStack } from "@/shared/ui/action-stack";
import { Button, LinkButton } from "@/shared/ui/button";
import { Caption } from "@/shared/ui/caption";
import { CenteredState } from "@/shared/ui/centered-state";
import { StatusGlyph } from "@/shared/ui/status-glyph";
import { TextBlock } from "@/shared/ui/text-block";

type ServerErrorScreenProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

// app/error.tsx — Next.js's contract requires a Client Component (ADR
// 0018), so text goes through useTranslations, not getTranslations. It
// only catches render errors inside the already-passed access gate (the
// gate and install/Coming soon are static pages — a render error there
// would mean a failure already on /day) — blocked devices never see this
// screen, they don't even reach rendering the pages behind the gate.
export const ServerErrorScreen = ({ error, reset }: ServerErrorScreenProps) => {
  const t = useTranslations("screens.serverError");

  useEffect(() => {
    console.error("[server-error]", error);
  }, [error]);

  const date = useMemo(() => new Intl.DateTimeFormat(locale).format(new Date()), []);
  const code = error.digest ?? t("code");

  return (
    <CenteredState glyph={<StatusGlyph code={t("code")} tone="alert" />}>
      <TextBlock align="center" title={t("title")} text={t("text")} />
      <ActionStack>
        <Button variant="alert" size="role" onPress={reset}>
          {t("retryButton")}
        </Button>
        <LinkButton href={routes.day} variant="plain" size="role">
          {t("homeButton")}
        </LinkButton>
      </ActionStack>
      <Caption>{t("errorCode", { code, date })}</Caption>
    </CenteredState>
  );
};
