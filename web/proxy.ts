import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { LAUNCH_MODE } from "@/app/config/launch-mode";
import { classifyAccess } from "@/shared/lib/access";
import { env } from "@/shared/config";

// redirect, not rewrite — the address bar DOES change (ADR 0017's
// "Обновление: redirect вместо rewrite для /access/*" explains why a
// silent rewrite broke ShellGate, which decides purely off
// window.location.pathname).
const BLOCKED_SCREEN_PATH: Record<"desktop" | "android" | "ios-not-safari", string> = {
  desktop: "/access/desktop",
  android: "/access/android",
  "ios-not-safari": "/access/ios-browser",
};

// Only these paths go through classification — otherwise non-existent
// addresses would get a device placeholder instead of a real 404.
const APP_ROUTES = ["/", "/day", "/soon", "/install"];

// The server can't see display-mode (standalone/fullscreen) — that check
// is done by ShellGate on the client (ADR 0017/0019). All that's left
// here is the server-side /day → /soon switch driven by LAUNCH_MODE.
export const proxy = (request: NextRequest) => {
  if (env.DEV_MODE) return NextResponse.next();

  const { pathname } = request.nextUrl;
  if (!APP_ROUTES.includes(pathname)) return NextResponse.next();

  const access = classifyAccess(request.headers.get("user-agent") ?? "");
  if (access !== "ios-safari") {
    const url = request.nextUrl.clone();
    url.pathname = BLOCKED_SCREEN_PATH[access];
    // 307 Temporary Redirect, not 308/permanent: the device class is
    // derived from the User-Agent header on THIS request, not a durable
    // property of the URL — the same person can open /day from a
    // computer today and an iPhone tomorrow. A permanent redirect
    // invites browsers/shared caches to remember "/day → /access/desktop"
    // and keep applying it regardless of who asks next, which would lock
    // that visitor out of the app on a phone too. 307 also preserves the
    // request method (unlike 302's historically inconsistent handling),
    // though every request through this proxy is a GET in practice.
    return NextResponse.redirect(url, 307);
  }

  if (pathname !== "/day" || LAUNCH_MODE === "app") return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = "/soon";
  return NextResponse.rewrite(url);
};

// Assets don't need classification — running them through proxy would
// only slow down serving them.
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|serwist|favicon.ico|manifest.webmanifest|icons|pwa).*)",
  ],
};
