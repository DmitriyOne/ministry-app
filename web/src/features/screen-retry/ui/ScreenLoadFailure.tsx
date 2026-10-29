import { getTranslations } from "next-intl/server";

import { FailureCard } from "@/shared/ui/failure-card";
import { AlertCircleIcon } from "@/shared/ui/icons";

import { ScreenRetryButton } from "./ScreenRetryButton";

// The whole "this block did not load" answer, assembled once: the card,
// the sign, and the button that asks the server again.
//
// It exists because two screens had written it out identically — the
// same icon at the same size, the same button with the same two labels,
// duplicated in the dictionary as well — and the third (the day's
// progress block) was about to make it three. The project's own rule:
// copying a block is a sign of something missing from the shared code,
// not a reason to copy it better (CLAUDE.md).
//
// Server component, with a client island inside it. What belongs to the
// screen is the wording — only the screen knows what did not load —
// while the labels on the button are the same everywhere and come from
// `common`.
type ScreenLoadFailureProps = {
  title: string;
  text: string;
  // The label the replaced block carried, when it had one.
  eyebrow?: string;
  className?: string;
};

export const ScreenLoadFailure = async ({
  title,
  text,
  eyebrow,
  className,
}: ScreenLoadFailureProps) => {
  const t = await getTranslations("common");

  return (
    <FailureCard
      className={className}
      eyebrow={eyebrow}
      icon={<AlertCircleIcon size={22} />}
      title={title}
      text={text}
      action={(
        <ScreenRetryButton label={t("retry")} retryingLabel={t("retryChecking")} />
      )}
    />
  );
};
