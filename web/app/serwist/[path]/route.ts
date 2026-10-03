// `createSerwistRoute`'s generated `GET`/`generateStaticParams` are typed
// for a single dynamic segment named `path`, so this MUST live under a
// `[path]` folder — a flat `app/serwist/sw.js/route.ts` fails to type-check.
import { createSerwistRoute } from "@serwist/turbopack";

// `public/manifest.webmanifest` is already picked up by the automatic
// public-folder scan (content-hash revision) — an `additionalPrecacheEntries`
// entry for the same URL used to be added here on top of it (git-HEAD as a
// synthetic revision). That produced TWO precache entries for the same
// `/manifest.webmanifest` with different revisions, which Workbox's
// PrecacheController rejects as a conflicting duplicate — the service worker
// failed at evaluation (`next start`, verified live for ADR 0015's PWA
// install flow). Found only now because `next dev` disables the SW
// (ADR 0015), so this had never actually run before.
export const { dynamic, dynamicParams, revalidate, generateStaticParams, GET }
  = createSerwistRoute({
    swSrc: "src/app/sw.ts",
    useNativeEsbuild: true,
  });
