"use client";

import { useEffect, useRef } from "react";

import { markWhatsNewSeen } from "../api/mark-whats-new-seen-action";

// Renders nothing. Its only job is to call the action once, after the
// screen has been shown.
//
// Why an island and not the page itself: the screen is a server
// component, and a server component that writes while it renders is a
// mutation in a render pass — it runs again on a refresh, on a
// back-navigation that re-renders, and in whatever React does next.
// Marking something read is a side effect of having shown it, so it
// belongs after the render, which on the client means an effect.
//
// The ref guards React 19's development double-invoke: the write is
// idempotent, so a second call is harmless, but a wasted round trip on
// every visit is not nothing.
export const MarkWhatsNewSeen = () => {
  const sent = useRef(false);

  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    void markWhatsNewSeen();
  }, []);

  return null;
};
