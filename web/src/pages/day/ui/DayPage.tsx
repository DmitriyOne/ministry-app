import { getTranslations } from "next-intl/server";

import { env, SB_API_ROUTES } from "@/shared/config";
import { BodyText } from "@/shared/ui/body-text";
import { CenteredState } from "@/shared/ui/centered-state";
import { Title } from "@/shared/ui/title";

// Scaffold-stage signal that the two projects are wired together, not business logic.
const getSupabaseStatus = async (): Promise<"ok" | "unreachable"> => {
  try {
    const response = await fetch(
      `${env.NEXT_PUBLIC_SUPABASE_URL}${SB_API_ROUTES.functions.health}`,
      {
        cache: "no-store",
        headers: {
          apikey: env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY}`,
        },
      },
    );

    if (!response.ok) {
      return "unreachable";
    }

    const body: unknown = await response.json();
    const status
      = typeof body === "object" && body !== null && "status" in body
        ? (body as { status?: unknown }).status
        : undefined;

    return status === "ok" ? "ok" : "unreachable";
  } catch {
    return "unreachable";
  }
};

export const DayPage = async () => {
  const [supabaseStatus, t] = await Promise.all([
    getSupabaseStatus(),
    getTranslations("screens.day"),
  ]);

  return (
    <CenteredState fill>
      <Title size="compact">{t("title")}</Title>
      <BodyText>
        {t("supabaseStatusLabel")}
        {" "}
        {/* No dedicated "connected/disconnected" pair in the palette
            (ADR 0011) — --positive-hero (mint) is restricted to the
            --hero/deep-green background only, so it can't be reused here.
            --primary (muted green, already the app's general "go"/action
            colour) and --negative (terracotta, the general error colour)
            are the closest tokens that are valid on --background. */}
        <span
          data-testid="supabase-status"
          className={supabaseStatus === "ok" ? "font-600 text-primary" : "font-600 text-negative"}
        >
          {supabaseStatus}
        </span>
      </BodyText>
    </CenteredState>
  );
};
