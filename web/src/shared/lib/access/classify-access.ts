export type AccessClass = "desktop" | "android" | "ios-not-safari" | "ios-safari";

// The exact shape of a real iPhone Safari UA (verified against live
// devices, iOS 18/26, both regular and "Request Desktop Site"-off
// builds — see the samples in classify-access.test.ts):
//
//   Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X)
//   AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.6.1
//   Mobile/15E148 Safari/604.1
//
// This is the ONLY check that decides "Safari or not" on iPhone — there
// used to be a blacklist of known non-Safari/in-app-browser tokens here
// too (CriOS, FxiOS, FBAN, MicroMessenger, ...), checked before this
// pattern as a documented fast path. It's gone: a blacklist can only
// ever enumerate browsers someone already looked up — Brave and
// DuckDuckGo weren't on it and sailed straight through as "Safari" on a
// real device, and the next browser to ship an unlisted token would have
// done the same. What we actually need is a single question — "is this
// exactly Safari" — and this pattern answers it without needing to know
// what else exists. Nothing downstream cares *which* other browser it
// is, only that it isn't Safari, so there's nothing a token list could
// usefully add.
//
// The three things that give a non-Safari UA away, in order:
//
// 1. "Version/" must appear directly after the WebKit/KHTML clause. Every
//    third-party browser that still renders through WebKit (Chrome,
//    Edge, Opera, Yandex, Brave, DuckDuckGo, ...) inserts its own
//    "XxxiOS/1.2.3" or "Ddg/1.2" token somewhere in the string — Chrome
//    drops "Version/" outright, Edge/Opera/Yandex insert their token
//    *before* "Version/", breaking the adjacency this pattern requires.
// 2. The string must END at "Safari/604.1" — nothing appended after it.
//    Brave and DuckDuckGo pass every other test (their UA is otherwise
//    byte-for-byte identical to real Safari) and out themselves only by
//    tacking their own token onto the tail (" Brave", " Ddg/26.6"). A
//    "does the string contain forbidden words" check misses this by
//    construction; requiring an exact end anchor does not — and needs no
//    updating when the next browser picks its own new token.
// 3. The trailing build must read "Safari/604.1", not any other WebKit
//    build number — Firefox on iOS (FxiOS) uses "Safari/605.1.15" for
//    that final token, which also fails the end-anchor above. In-app
//    WebViews (Instagram, WeChat, VK, Viber, an unlisted one — see the
//    tests) typically drop "Safari/" entirely, which fails the same way.
//
// A UA can dodge any single one of these on its own; dodging all three
// at once means being byte-identical to real Safari, at which point it's
// functionally indistinguishable (see the SFSafariViewController note in
// classify-access.test.ts) and treating it as Safari is correct, not a
// false positive — Telegram/Slack/Discord/Reddit open links this way,
// which is why /install carries a "make sure this is Safari" hint (ADR
// 0016) rather than trying to detect that case here.
const IOS_SAFARI_UA_PATTERN
  = /^Mozilla\/5\.0 \(iPhone; CPU iPhone OS \d+_\d+(?:_\d+)? like Mac OS X\) AppleWebKit\/\d+\.\d+(?:\.\d+)? \(KHTML, like Gecko\) Version\/\d+(?:\.\d+)* Mobile\/[A-Za-z0-9]+ Safari\/604\.1$/;

// Classifies the User-Agent for the v1 "iPhone Safari only" gate (ADR
// 0016). A pure function with no side effects — used in web/proxy.ts and
// covered by tests (classify-access.test.ts).
//
// The order of checks matters:
// 1. Android — checked before iPhone, since the "iPhone" token never
//    appears in an Android UA, but the top-down order reads more clearly
//    as descending confidence.
// 2. iPad — including one disguised as Macintosh (iPadOS 13+ doesn't
//    write "iPad" into the UA by default at all; such UAs end up in
//    "desktop" anyway through the default branch at the end — the
//    explicit check here is for UAs that do still carry the "iPad"
//    token).
// 3. iPhone — matched against IOS_SAFARI_UA_PATTERN byte-for-byte. A
//    match is "ios-safari"; anything else — a known competing browser, an
//    in-app WebView, one that doesn't exist yet — is "ios-not-safari"
//    without asking which browser it actually is, because nothing
//    downstream needs to know.
// 4. Everything else (desktop browsers, an iPhone with "Request Desktop
//    Site" turned on — such a UA doesn't contain "iPhone" at all, bots,
//    an empty string) — "desktop".
export const classifyAccess = (userAgent: string): AccessClass => {
  const ua = userAgent;

  if (ua.includes("Android")) return "android";
  if (ua.includes("iPad")) return "desktop";

  if (ua.includes("iPhone")) {
    return IOS_SAFARI_UA_PATTERN.test(ua) ? "ios-safari" : "ios-not-safari";
  }

  return "desktop";
};
