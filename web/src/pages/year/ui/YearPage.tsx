import { getTranslations } from "next-intl/server";

export const YearPage = async () => {
  const t = await getTranslations("screens.year");

  return (
    <main className="flex flex-1 items-center justify-center p-8">
      <h1 className="text-2xl font-semibold">{t("title")}</h1>
    </main>
  );
};
