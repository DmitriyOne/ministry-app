import { getTranslations } from "next-intl/server";

import { WhatsNewUnreadDot } from "@/features/whats-new";
import { routes } from "@/shared/config";
import { ChevronRightIcon } from "@/shared/ui/icons";
import { ListCard } from "@/shared/ui/list-card";
import { ListRow } from "@/shared/ui/list-row";

type ProfileLinksProps = {
  hasUnreadWhatsNew: boolean;
};

// The three places /profile leads to. One <nav>, so the block is a
// landmark a screen reader can jump to, and the screen above does not
// have to know which rows are in it.
export const ProfileLinks = async ({ hasUnreadWhatsNew }: ProfileLinksProps) => {
  const t = await getTranslations("screens.profile");

  return (
    <nav aria-label={t("linksLabel")}>
      <ListCard>
        <ListRow
          href={routes.whatsNew}
          title={t("whatsNew")}
          trailing={(
            <span className="flex shrink-0 items-center gap-2.5">
              {/* A client island, not a span, because it has to be able
                  to disagree with the server: this screen comes back
                  from the router's cache on a back navigation without
                  being re-rendered, so the dot has to check locally
                  whether this device has already been shown the release
                  (features/whats-new). */}
              <WhatsNewUnreadDot unread={hasUnreadWhatsNew} label={t("whatsNewUnread")} />
              <ChevronRightIcon size={20} className="shrink-0 text-ink-faint" />
            </span>
          )}
        />
        <ListRow
          href={routes.about}
          title={t("about")}
          trailing={<ChevronRightIcon size={20} className="shrink-0 text-ink-faint" />}
        />
        <ListRow
          href={routes.privacy}
          title={t("privacy")}
          divided={false}
          trailing={<ChevronRightIcon size={20} className="shrink-0 text-ink-faint" />}
        />
      </ListCard>
    </nav>
  );
};
