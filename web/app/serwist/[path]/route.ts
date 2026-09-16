// `createSerwistRoute`'s generated `GET`/`generateStaticParams` are typed
// for a single dynamic segment named `path`, so this MUST live under a
// `[path]` folder — a flat `app/serwist/sw.js/route.ts` fails to type-check.
import { spawnSync } from "node:child_process";
import { createSerwistRoute } from "@serwist/turbopack";

const revision =
  spawnSync("git", ["rev-parse", "HEAD"], { encoding: "utf-8" }).stdout?.trim() ||
  crypto.randomUUID();

export const { dynamic, dynamicParams, revalidate, generateStaticParams, GET } =
  createSerwistRoute({
    swSrc: "src/app/sw.ts",
    additionalPrecacheEntries: [{ url: "/manifest.webmanifest", revision }],
    useNativeEsbuild: true,
  });
