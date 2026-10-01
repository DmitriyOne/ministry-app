import { describe, expect, it } from "vitest";

import { buildRobots } from "./build-robots";

describe("buildRobots", () => {
  it("disallows everything and omits the sitemap reference under DEV_MODE, even with a known site URL", () => {
    expect(buildRobots({ devMode: true, siteUrl: "https://example.com" })).toEqual({
      rules: { userAgent: "*", disallow: "/" },
    });
  });

  it("disallows everything without a site URL under DEV_MODE", () => {
    expect(buildRobots({ devMode: true, siteUrl: undefined })).toEqual({
      rules: { userAgent: "*", disallow: "/" },
    });
  });

  it("allows only /about and /privacy, disallows the gated and device-placeholder routes, and points at the sitemap when a site URL is known", () => {
    expect(buildRobots({ devMode: false, siteUrl: "https://example.com" })).toEqual({
      rules: {
        userAgent: "*",
        allow: ["/about", "/privacy"],
        disallow: ["/day", "/soon", "/install", "/access/desktop", "/access/android", "/access/ios-browser"],
      },
      sitemap: "https://example.com/sitemap.xml",
    });
  });

  it("omits the sitemap reference when no site URL is known yet", () => {
    const result = buildRobots({ devMode: false, siteUrl: undefined });

    expect(result.sitemap).toBeUndefined();
    expect(result.rules).toEqual({
      userAgent: "*",
      allow: ["/about", "/privacy"],
      disallow: ["/day", "/soon", "/install", "/access/desktop", "/access/android", "/access/ios-browser"],
    });
  });
});
