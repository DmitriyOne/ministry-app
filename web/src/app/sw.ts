/// <reference lib="webworker" />

import { defaultCache } from "@serwist/turbopack/worker";

import type { PrecacheEntry, RuntimeCaching, SerwistGlobalConfig } from "serwist";
import { NetworkOnly, Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

// `sw.ts` is bundled by Serwist/esbuild separately from the normal Next.js
// module graph. Keep this path local instead of importing the app's route
// constants: that import has already proved unreliable in the worker build.
const HEALTH_PATH = "/api/v1/health";

// Sentry's tunnel route (next.config.ts, ADR 0041). Serwist only caches GET
// and the tunnel accepts POST, so this entry is mostly declarative, but it
// makes the intent explicit: error reports must never be served from cache.
const SENTRY_TUNNEL_PATH = "/monitoring";

// The query parameter Next.js adds to static asset URLs when a deployment
// id is set. Named here so the two places that have to ignore it below
// cannot drift apart.
const DEPLOYMENT_ID_PARAM = "dpl";

// Removed from the raw href rather than through URLSearchParams, because
// some of these URLs cannot be parsed as search parameters at all. Next.js
// already cache-busts the generated icons with a query of their own, so
// the deployment id lands behind a SECOND question mark:
//
//   /apple-icon.png?apple-icon.3gn0h7d0gm6a9.png?dpl=<id>
//
// Everything after the first "?" is one parameter name there, so
// `searchParams.has("dpl")` is false and deleting it does nothing — while
// the href still ends in the deployment id and still fails to match the
// image rule it matched before. Trimming the text handles both shapes.
const DEPLOYMENT_ID_PATTERN = new RegExp(`[?&]${DEPLOYMENT_ID_PARAM}=[^&]*`, "g");

const stripDeploymentId = (href: string): string =>
  href
    .replace(DEPLOYMENT_ID_PATTERN, (match) => (match.startsWith("?") ? "?" : ""))
    .replace(/\?&/, "?")
    .replace(/\?$/, "");

type PushPayload = {
  title?: string;
  body?: string;
  url?: string;
};

// Next.js appends `?dpl=<deploymentId>` to every static asset URL once a
// deployment id is configured (next.config.ts, ADR 0036). Serwist matches a
// RegExp rule against the FULL href — `RegExpRoute` runs
// `regExp.exec(url.href)` — so every default rule anchored on a file
// extension with `$` stops matching the moment that query appears.
// Measured against the real patterns: the `_next/static` JavaScript rule,
// the image rule, the font rule and the generic `.js` rule all fail, and
// no precached entry is found either. Left alone, switching the deployment
// id on would quietly strip the app of nearly all of its caching — the
// precache would still be downloaded on install and then never read.
//
// So the parameter is removed before matching, and only that parameter:
// every rule then behaves exactly as it did before the deployment id
// existed. The handler still receives the original request, so what gets
// fetched and stored is unchanged.
const ignoringDeploymentId = (entry: RuntimeCaching): RuntimeCaching => {
  const { matcher } = entry;

  if (!(matcher instanceof RegExp)) return entry;

  // A fresh RegExp without the `g` flag: `test` on a global pattern
  // carries `lastIndex` between calls and would skip matches.
  const pattern = new RegExp(matcher.source, matcher.flags.replace("g", ""));

  return {
    ...entry,
    matcher: ({ url }) => pattern.test(stripDeploymentId(url.href)),
  };
};

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  // The manifest is built from file paths with no query string, so the
  // same `?dpl=` has to be ignored here too or not one entry is ever
  // matched. The first two are Serwist's own defaults, repeated because
  // supplying this option replaces them.
  precacheOptions: {
    ignoreURLParametersMatching: [/^utm_/, /^fbclid$/, new RegExp(`^${DEPLOYMENT_ID_PARAM}$`)],
  },
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    {
      matcher: ({ sameOrigin, url }) =>
        sameOrigin && (url.pathname === HEALTH_PATH || url.pathname === SENTRY_TUNNEL_PATH),
      handler: new NetworkOnly(),
    },
    ...defaultCache.map(ignoringDeploymentId),
  ],
  fallbacks: {
    entries: [
      {
        url: "/offline.html",
        matcher: ({ request }) => request.destination === "document",
      },
    ],
  },
});

self.addEventListener("push", (event: PushEvent) => {
  let payload: PushPayload = {};

  // `catch` alone is not enough: with no data at all, `event.data?.json()`
  // does not throw, the optional chain just yields `undefined` — and
  // reading `payload.title` below would then throw outside the try. With
  // `userVisibleOnly: true` the browser would show its own generic notice.
  try {
    payload = (event.data?.json() as PushPayload | undefined) ?? {};
  } catch {
    payload = {};
  }

  event.waitUntil(
    self.registration.showNotification(payload.title ?? "MinistryApp", {
      body: payload.body,
      data: {
        url: payload.url ?? "/",
      },
    }),
  );
});

self.addEventListener("notificationclick", (event: NotificationEvent) => {
  event.notification.close();

  const destination = new URL(
    event.notification.data?.url ?? "/",
    self.location.origin,
  ).href;

  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });

      for (const client of windows) {
        if (client.url === destination) {
          await client.focus();
          return;
        }
      }

      await self.clients.openWindow(destination);
    })(),
  );
});

serwist.addEventListeners();
