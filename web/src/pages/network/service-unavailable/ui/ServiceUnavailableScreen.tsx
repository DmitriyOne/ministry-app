"use client";

import { useTranslations } from "next-intl";

import { ActionStack } from "@/shared/ui/action-stack";
import { Button } from "@/shared/ui/button";
import { CenteredState } from "@/shared/ui/centered-state";
import { AlertCircleIcon } from "@/shared/ui/icons";
import { Spinner } from "@/shared/ui/spinner";
import { TextBlock } from "@/shared/ui/text-block";

type ServiceUnavailableScreenProps = {
  retrying: boolean;
  onRetry: () => void;
};

// Shown when the origin answers and the answer is not a 2xx — our
// problem, not the person's. The twin of OfflineScreen in every respect
// but the glyph's tone and the sentence: same frame, same button, same
// place in NetworkGate, because the two cases are told apart by the
// probe and not by the screen (ADR 0055, update).
//
// No "go to the home screen" link, unlike the 500 screen: every screen
// in the app sits behind this gate, so the link would lead straight back
// here and read as if the app were taunting you. The only honest action
// is to ask again.
export const ServiceUnavailableScreen = ({
  retrying,
  onRetry,
}: ServiceUnavailableScreenProps) => {
  const t = useTranslations("screens.serviceUnavailable");

  return (
    <CenteredState
      glyph={(
        <div
          className="
            flex size-14 items-center justify-center
            rounded-md bg-negative/10 text-negative
          "
        >
          <AlertCircleIcon size={28} />
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
