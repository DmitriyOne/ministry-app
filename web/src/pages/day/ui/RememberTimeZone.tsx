"use client";

import { useEffect } from "react";

import { rememberTimeZone } from "@/shared/lib/time-zone";

type RememberTimeZoneProps = {
  // The zone this screen was rendered in, read from the person's own
  // profile by the server. Null when the profile holds none — the
  // server then serves the default calendar, and that is what gets
  // written down, so the menu and the server agree either way.
  timeZone: string | null;
};

// Writes the person's zone down on this device, so that the menu can
// link straight to today's date instead of going through the redirect at
// /day — the hop that makes the screen flicker when it is opened from
// the menu (shared/lib/time-zone/stored-time-zone.ts says why the menu
// cannot work the date out any other way).
//
// Here rather than in the menu's own slice because this is where the
// answer already is: the screen has the zone, so nobody has to ask the
// server a second time. It renders nothing, like RefreshOnDayChange
// beside it.
//
// An effect, not a write during render: localStorage is the browser's,
// and a server render has none.
export const RememberTimeZone = ({ timeZone }: RememberTimeZoneProps) => {
  useEffect(() => {
    rememberTimeZone(timeZone);
  }, [timeZone]);

  return null;
};
