"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/shared/ui/button";
import { Spinner } from "@/shared/ui/spinner";
import { cn } from "@/shared/lib/cn";

type ScreenRetryButtonProps = {
  label: string;
  retryingLabel: string;
  className?: string;
};

// "Try again" for a screen whose own read came back empty — the one
// island inside a FailureCard, which the server component around it
// renders as children.
//
// router.refresh() rather than a reload of the document: the screen is a
// server component, so asking the server again is the whole of the
// retry, and a full reload would run the launch gate and its splash
// over an app that is already open (ADR 0024). The transition is what
// makes the wait visible — refresh() resolves when the new render
// arrives, so the spinner lasts exactly as long as the attempt.
export const ScreenRetryButton = ({ label, retryingLabel, className }: ScreenRetryButtonProps) => {
  const router = useRouter();
  const [isRetrying, startRetry] = useTransition();

  return (
    <Button
      variant="heroGhost"
      size="role"
      className={cn("w-full", className)}
      isDisabled={isRetrying}
      onPress={() => {
        startRetry(() => {
          router.refresh();
        });
      }}
    >
      {isRetrying ? <Spinner className="size-4" /> : null}
      {isRetrying ? retryingLabel : label}
    </Button>
  );
};
