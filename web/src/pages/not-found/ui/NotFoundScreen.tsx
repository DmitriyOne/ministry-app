import { getTranslations } from "next-intl/server";

import { routes } from "@/shared/config";
import { ActionStack } from "@/shared/ui/action-stack";
import { CenteredState } from "@/shared/ui/centered-state";
import { LinkButton } from "@/shared/ui/button";
import { StatusGlyph } from "@/shared/ui/status-glyph";
import { TextBlock } from "@/shared/ui/text-block";

// app/not-found.tsx — rendered by Next.js for any non-existent route
// (ADR 0018). Blocked devices never reach it: web/proxy.ts rewrites ANY
// path to /access/* before Next.js gets a chance to look for a matching
// route — this page is reachable only by iPhone Safari (and any device
// when DEV_MODE=true).
export const NotFoundScreen = async () => {
  const t = await getTranslations("screens.notFound");

  return (
    <CenteredState glyph={<StatusGlyph code={t("code")} tone="neutral" />}>
      <TextBlock align="center" title={t("title")} text={t("text")} />
      <ActionStack>
        <LinkButton href={routes.day} variant="deep" size="role">
          {t("homeButton")}
        </LinkButton>
      </ActionStack>
    </CenteredState>
  );
};
