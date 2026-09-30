"use client";

import { useState } from "react";

export type CopyLinkState = "idle" | "copied" | "error";

type UseCopyLinkResult = {
  state: CopyLinkState;
  copy: () => void;
};

// A scenario with data (Clipboard API, "copied"/error state) — not
// markup, so it lives in features, not shared/ui (boundary described in
// CLAUDE.md, "Forms, accessibility, the shared/ui boundary" section).

// `navigator.clipboard` only exists in a secure context — HTTPS, or
// localhost (MDN, "Secure contexts") — nowhere else, not even behind a
// try/catch. Over plain http:// on a LAN IP (the real bug this fixes:
// opening the app from a phone at http://192.168.x.x:3000) the property
// is `undefined`, so calling `.writeText` on it throws a TypeError
// before any catch block runs. Checking availability first, instead of
// only reacting to the throw, is what lets the call site choose a
// working fallback instead of just reporting failure.
const canUseClipboardApi = () =>
  typeof window !== "undefined" &&
  window.isSecureContext &&
  typeof navigator !== "undefined" &&
  typeof navigator.clipboard?.writeText === "function";

// `document.execCommand("copy")` is deprecated (MDN: "avoid using this
// feature in new projects") and inconsistently implemented — some
// in-app browsers (the exact audience of this screen, ADR 0016) block it
// outright regardless of protocol. It's still worth attempting: on plain
// http://, it's the only thing that can work at all, and on real iOS
// Safari it does. Safari requires the copy to run synchronously inside
// the click handler and needs a real, visible selection — a
// `display:none`/zero-size element won't select on iOS, hence
// `opacity: 0` (still laid out) rather than hiding it outright, and an
// explicit `setSelectionRange` in addition to `select()`.
const copyWithExecCommand = (text: string): boolean => {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.top = "0";
  textarea.style.left = "0";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  try {
    textarea.focus();
    textarea.select();
    textarea.setSelectionRange(0, text.length);
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    document.body.removeChild(textarea);
  }
};

export const useCopyLink = (value: () => string): UseCopyLinkResult => {
  const [state, setState] = useState<CopyLinkState>("idle");

  const copy = () => {
    const text = value();

    if (canUseClipboardApi()) {
      void (async () => {
        try {
          await navigator.clipboard.writeText(text);
          setState("copied");
        } catch (error) {
          console.error("[copy-link] Failed to copy the link", error);
          setState("error");
        }
      })();
      return;
    }

    setState(copyWithExecCommand(text) ? "copied" : "error");
  };

  return { state, copy };
};
