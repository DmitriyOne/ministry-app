import { describe, expect, it } from "vitest";

import { buildSitemap } from "./build-sitemap";

describe("buildSitemap", () => {
  it("is empty under DEV_MODE, even with a known site URL", () => {
    expect(buildSitemap({ devMode: true, siteUrl: "https://example.com" })).toEqual([]);
  });

  it("is empty without a known site URL", () => {
    expect(buildSitemap({ devMode: false, siteUrl: undefined })).toEqual([]);
  });

  it("lists only /about and /privacy as absolute URLs when a site URL is known", () => {
    expect(buildSitemap({ devMode: false, siteUrl: "https://example.com" })).toEqual([
      { url: "https://example.com/about", changeFrequency: "monthly", priority: 0.8 },
      { url: "https://example.com/privacy", changeFrequency: "monthly", priority: 0.5 },
    ]);
  });
});
