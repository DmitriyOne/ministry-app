import { getTranslations } from "next-intl/server";

export const StatusPage = async () => {
  const t = await getTranslations("screens.status");

  return (
    <main className="flex flex-1 items-center justify-center p-8">
      <h1 className="text-2xl font-semibold">{t("title")}</h1>
    </main>
  );
};
