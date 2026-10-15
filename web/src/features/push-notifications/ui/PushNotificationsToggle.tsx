"use client";

import { useTranslations } from "next-intl";

import { ListRow } from "@/shared/ui/list-row";
import { Switch } from "@/shared/ui/switch";

import { usePushToggle } from "../model/use-push-toggle";

// The row in the profile card. The copy lives here rather than coming in
// as props, unlike SignOutButton's: there are several states and each
// needs its own line, and threading them all through the screen would
// say nothing except that they exist. It sits under notifications.* in
// the dictionary, beside the waitlist copy this same feature owns, not
// under screens.profile — the screen only places the row.
export const PushNotificationsToggle = () => {
  const t = useTranslations("notifications.push");
  const { state, isBusy, toggle } = usePushToggle();

  // Nothing to offer: this is a browser tab, or a device without Web
  // Push. The row is left out entirely rather than shown dead — a switch
  // that cannot move is a question with no answer.
  if (state === "unsupported") return null;

  const description
    = state === "denied" ? t("deniedDescription") : t("description");

  return (
    <ListRow
      title={t("title")}
      text={description}
      trailing={(
        <Switch
          isSelected={state === "on"}
          // "unknown" is the moment before the browser has answered, and
          // "denied" is a state only iOS Settings can leave.
          isDisabled={isBusy || state === "unknown" || state === "denied"}
          onChange={(isSelected) => void toggle(isSelected)}
          aria-label={t("title")}
          className="shrink-0"
        />
      )}
    />
  );
};
