"use client";

// import { useEffect, useState } from "react";

import { getCurrentAddress } from "@/shared/lib/get-current-address";
import { ActionStack } from "@/shared/ui/action-stack";
import { Button } from "@/shared/ui/button";
// import { Caption } from "@/shared/ui/caption";
import { InlineError } from "@/shared/ui/inline-error";

import { useCopyLink } from "../model/use-copy-link";

// Text is domain-specific and passed in by the caller (i18n keys from
// different screens), not hardcoded here — see CLAUDE.md, the shared/ui
// boundary and the "not a single string in markup" rule.
type CopyLinkButtonProps = {
  label: string;
  copiedLabel: string;
  errorLabel: string;
  addressLabel: string;
  // Copies the current page address by default — override when something
  // else needs copying.
  value?: () => string;
};

export const CopyLinkButton = ({
  label,
  copiedLabel,
  errorLabel,
  // addressLabel,
  value = getCurrentAddress,
}: CopyLinkButtonProps) => {
  const { state, copy } = useCopyLink(value);

  // The address as plain, selectable text — shown always, not only once
  // copying has already failed. This screen exists for someone stuck in
  // a messenger's in-app browser (ADR 0016); some of those browsers
  // report the Clipboard API as present and still silently refuse to
  // write to it, so a "just tap the button" affordance alone isn't
  // trustworthy for exactly the audience that needs it most. Reading and
  // selecting the text themselves is the one path that always works.
  //
  // Commented out on purpose, not removed: the button's onPress copy is
  // enough for every in-app browser seen so far (ADR 0025), so the
  // fallback text below is currently dead weight on this screen. Kept
  // here, not deleted, because it's the fallback path for the harder
  // case — an in-app browser that reports the Clipboard API as available
  // but silently refuses to write to it (see the comment on
  // CopyLinkButtonProps below) — and rewriting it from scratch later
  // would just reproduce this same effect-timing reasoning. Re-enable by
  // uncommenting this block and the matching JSX/import below and wiring
  // `addressLabel` back into the render.
  //
  // Starts empty and is filled in an effect, not read directly during
  // render, so the client's first render matches the server-rendered
  // markup (`window` doesn't exist during that render) — same reasoning
  // as LaunchGate (web/src/features/launch-gate/ui/launch-gate.tsx).
  // const [address, setAddress] = useState("");
  // useEffect(() => {
  //   // Wrapped in a microtask, not a bare setState in the effect body —
  //   // same reasoning as LaunchGate (web/src/features/launch-gate/ui/launch-gate.tsx):
  //   // satisfies eslint-plugin-react-hooks' set-state-in-effect rule
  //   // without changing timing in any way that matters here.
  //   queueMicrotask(() => setAddress(value()));
  // }, [value]);

  return (
    <ActionStack maxWidth="260">
      <Button variant="deep" size="role" onPress={copy}>
        {state === "copied" ? copiedLabel : label}
      </Button>
      {/* {address ? (
        <div className="flex flex-col items-center gap-1">
          <Caption>{addressLabel}</Caption>
          <p className="w-full text-center text-caption font-520 text-ink break-all select-all">
            {address}
          </p>
        </div>
      ) : null} */}
      {state === "error" ? <InlineError>{errorLabel}</InlineError> : null}
    </ActionStack>
  );
};
