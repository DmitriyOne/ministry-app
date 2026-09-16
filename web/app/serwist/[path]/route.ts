// Thin Next.js Route Handler wrapper (Turbopack build of the service
// worker + any other files Serwist generates). The actual worker logic
// lives in the FSD `app` layer (src/app/sw.ts) — this file only wires it
// up as a route. `createSerwistRoute`'s generated `GET`/`generateStaticParams`
// are typed for a single dynamic segment named `path` (it can emit more
// than one file), so this MUST live under a `[path]` folder — a flat
// `app/serwist/sw.js/route.ts` fails to type-check.
// SerwistProvider (src/app/layout/root-layout.tsx) requests
// `/serwist/sw.js`, which resolves here with `path === "sw.js"`.
import { spawnSync } from "node:child_process";
import { createSerwistRoute } from "@serwist/turbopack";

const revision =
  spawnSync("git", ["rev-parse", "HEAD"], { encoding: "utf-8" }).stdout?.trim() ||
  crypto.randomUUID();

export const { dynamic, dynamicParams, revalidate, generateStaticParams, GET } =
  createSerwistRoute({
    swSrc: "src/app/sw.ts",
    additionalPrecacheEntries: [{ url: "/manifest.webmanifest", revision }],
    // Native esbuild binary (resolved per-platform via optionalDependencies).
    // This is also Serwist's own default on non-Windows platforms.
    useNativeEsbuild: true,
  });
