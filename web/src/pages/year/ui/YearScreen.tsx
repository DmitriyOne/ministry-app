import { getTranslations } from "next-intl/server";

import { CenteredState } from "@/shared/ui/centered-state";
import { Title } from "@/shared/ui/title";

// A placeholder on purpose: v2 lays out the navigation and the routes,
// and the real year arrives with the ministry tables. `fill` because
// app/(app-shell)/layout.tsx already reserves the viewport height and the
// space under the navigation — a second min-h-dvh here would push the
// content down behind the bar (the same trap ADR 0029 describes for the
// footer group).
export const YearScreen = async () => {
  const t = await getTranslations("screens.year");

  return (
    <CenteredState fill>
      <Title>{t("title")}</Title>
    </CenteredState>
  );
};
