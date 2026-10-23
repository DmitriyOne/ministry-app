import { getTranslations } from "next-intl/server";

import { Eyebrow } from "@/shared/ui/eyebrow";
import { Skeleton } from "@/shared/ui/skeleton";

// The same block with its three unknowns greyed out. Deliberately the
// same classes as ProfileHero: the two are one thing in two states, and
// any difference shows up as a jump when the data lands.
//
// The plates are lighter than the ground they sit on, not darker —
// everywhere else on this screen they are the grey of the card dividers.
const BONE = "bg-white/15";

export const ProfileHeroSkeleton = async () => {
  const t = await getTranslations("screens.profile");

  return (
    <div className="mx-3 flex flex-col gap-3.5 rounded-4xl bg-hero px-5 pt-6 pb-5.5 text-hero-foreground">
      {/* The eyebrow is dictionary text and depends on nobody, so it is
          drawn for real and never moves. */}
      <Eyebrow as="span" className="text-positive-hero">{t("title")}</Eyebrow>

      <Skeleton className={`size-18 rounded-full ${BONE}`} />

      <div className="flex flex-col gap-2">
        <Skeleton className={`h-8 w-2/3 rounded-lg ${BONE}`} />
        {/* Two plates for the two pills. The status plate is the wider
            one because its labels are longer, and both are sized to let
            the real pills GROW into them rather than shrink: a pill that
            gets smaller when the data lands reads as a glitch. */}
        <div className="flex gap-2">
          <Skeleton className={`h-8 w-18 rounded-sm ${BONE}`} />
          <Skeleton className={`h-8 w-28 rounded-sm ${BONE}`} />
        </div>
      </div>
    </div>
  );
};
