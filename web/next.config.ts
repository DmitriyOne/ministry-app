import type { NextConfig } from "next";
import { withSerwist } from "@serwist/turbopack";
import createNextIntlPlugin from "next-intl/plugin";

// Validates env vars at build time (throws before the build proceeds if
// something required is missing/invalid) — see src/shared/config/env.ts.
// Relative import: next.config.ts is loaded outside of the
// webpack/turbopack module graph, so the "@/*" tsconfig path alias isn't
// resolved here.
import "./src/shared/config/env";

const nextConfig: NextConfig = {
  /* config options here */
};

// Путь к конфигу next-intl — тоже относительный, по той же причине, что и
// у env.ts выше (next.config.ts вне графа модулей бандлера).
const withNextIntl = createNextIntlPlugin("./src/shared/config/i18n/request.ts");

export default withNextIntl(withSerwist(nextConfig));
