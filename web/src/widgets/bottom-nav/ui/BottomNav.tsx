import { getTranslations } from "next-intl/server";

// Empty scaffold until the screens it links to exist.
export const BottomNav = async () => {
  const t = await getTranslations("a11y.bottomNav");

  return <nav className="border-t p-2" aria-label={t("primary")} />;
};
