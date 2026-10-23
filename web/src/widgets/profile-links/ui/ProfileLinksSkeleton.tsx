import { getTranslations } from "next-intl/server";

import { ChevronRightIcon } from "@/shared/ui/icons";
import { ListCard } from "@/shared/ui/list-card";
import { ListRow } from "@/shared/ui/list-row";

// Rows without `href`: the destinations are known, but a screen that is
// still loading should not be navigable from a half-drawn list. They
// become links a moment later.
//
// The unread dot is deliberately absent rather than reserved. It is a
// signal, not a field: a grey disc of the same size would announce news
// that may not exist, and somebody would reach for a row that has
// nothing to show.
export const ProfileLinksSkeleton = async () => {
  const t = await getTranslations("screens.profile");

  return (
    <nav aria-label={t("linksLabel")}>
      <ListCard>
        <ListRow
          title={t("whatsNew")}
          trailing={<ChevronRightIcon size={20} className="shrink-0 text-ink-faint" />}
        />
        <ListRow
          title={t("about")}
          trailing={<ChevronRightIcon size={20} className="shrink-0 text-ink-faint" />}
        />
        <ListRow
          title={t("privacy")}
          divided={false}
          trailing={<ChevronRightIcon size={20} className="shrink-0 text-ink-faint" />}
        />
      </ListCard>
    </nav>
  );
};
