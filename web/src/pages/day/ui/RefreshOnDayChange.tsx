"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

import { type DayKey, deviceDayKey } from "@/entities/ministry-day";

// Asks the server for this screen again once the date has turned over.
//
// It replaces a check that used to live in the hours card, and the move
// is the point. The card refused to SAVE when the day had changed —
// correct while /day silently meant "today", because a page opened in
// the evening would otherwise overwrite yesterday. Now the day is in the
// address: /day/2026-06-02 means that day whenever it is read, and
// writing to it after midnight is right, not wrong (ADR 0063).
//
// What does go stale is the HEADING. "Today" is relative, and a screen
// left open past midnight would keep saying it — so the thing to fix is
// the label, by re-rendering, rather than the write, by refusing it.
//
// The DEVICE's calendar is what is compared, not the person's own from
// their profile, and that is safe here precisely because it was not safe
// there: a wrong guess costs one re-render that changes nothing, where
// in the card it would have cost a day's hours. The profile's zone
// still decides what the heading then SAYS — the server reads it.
//
// Honest limit: `visibilitychange` is the event that fires on a phone,
// so a screen watched continuously through midnight keeps its label
// until it is hidden and shown again. The number under it stays correct
// either way, because the card is keyed by the day in the address.
export const RefreshOnDayChange = () => {
  const router = useRouter();
  // Filled on mount rather than during render: deviceDayKey reads the
  // live environment, and on the server it would answer with the
  // server's zone.
  const renderedOn = useRef<DayKey | null>(null);

  useEffect(() => {
    renderedOn.current = deviceDayKey();

    const check = () => {
      if (document.visibilityState !== "visible") return;

      const now = deviceDayKey();

      if (now === renderedOn.current) return;

      renderedOn.current = now;
      // Keeps client state, which matters here: the card holds taps
      // that have not been confirmed yet, and it is keyed by the day in
      // the address — which has not changed — so it is not remounted.
      router.refresh();
    };

    document.addEventListener("visibilitychange", check);

    return () => document.removeEventListener("visibilitychange", check);
  }, [router]);

  return null;
};
