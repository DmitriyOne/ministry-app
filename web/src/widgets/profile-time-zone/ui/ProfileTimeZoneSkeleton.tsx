import { getTranslations } from "next-intl/server";

import { ListRow } from "@/shared/ui/list-row";
import { Skeleton } from "@/shared/ui/skeleton";

type ProfileTimeZoneSkeletonProps = {
  divided?: boolean;
};

// The same row with one plate in it. Only the zone comes from the
// database; the title and the sentence under it are dictionary text and
// are drawn for real, so nothing moves when the value lands.
//
// The plate stands where the pill will, and is as wide as
// "Europe/London" renders in it — the value everybody has today. A
// longer name shifts nothing: the pill is in the trailing slot and the
// title block absorbs the difference.
export const ProfileTimeZoneSkeleton = async ({
  divided = true,
}: ProfileTimeZoneSkeletonProps) => {
  const t = await getTranslations("screens.profile.timeZone");

  return (
    <ListRow
      title={t("title")}
      text={t("text")}
      divided={divided}
      trailing={<Skeleton className="h-7 w-28 shrink-0 rounded-xs bg-ink-a09" />}
    />
  );
};
