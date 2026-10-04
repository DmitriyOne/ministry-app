"use client";

import { useTranslations } from "next-intl";

import { ActionStack } from "@/shared/ui/action-stack";
import { Button } from "@/shared/ui/button";
import { CenteredState } from "@/shared/ui/centered-state";
import { WifiOffIcon } from "@/shared/ui/icons";
import { Spinner } from "@/shared/ui/spinner";
import { TextBlock } from "@/shared/ui/text-block";

type OfflineScreenProps = {
  retrying: boolean;
  onRetry: () => void;
};

export const OfflineScreen = ({
  retrying,
  onRetry,
}: OfflineScreenProps) => {
  const t = useTranslations("screens.offline");

  return (
    <CenteredState
      glyph={(
        <div
          className="
            flex size-14 items-center justify-center
            rounded-md bg-hero text-hero-foreground
          "
        >
          <WifiOffIcon size={28} />
        </div>
      )}
      actions={(
        <ActionStack>
          <Button
            variant="deep"
            size="role"
            isDisabled={retrying}
            onPress={onRetry}
          >
            {retrying
              ? (
                  <Spinner className="size-4" />
                )
              : null}

            {retrying
              ? t("retryingButton")
              : t("retryButton")}
          </Button>
        </ActionStack>
      )}
    >
      <TextBlock
        align="center"
        title={t("title")}
        text={t("text")}
      />
    </CenteredState>
  );
};
