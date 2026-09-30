import { describe, expect, it } from "vitest";

import { classifyAccess } from "./classify-access";

const UA = {
  desktopChromeMac:
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
  desktopSafariMac:
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15",
  desktopFirefoxWindows: "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:129.0) Gecko/20100101 Firefox/129.0",
  // iPadOS 13+ doesn't write "iPad" into the UA by default at all — indistinguishable from desktopSafariMac by construction.
  ipadAsMac:
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15",
  ipadExplicit:
    "Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
  androidChrome:
    "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36",
  androidTabletChrome:
    "Mozilla/5.0 (Linux; Android 14; SM-X710) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
  androidSamsungInternet:
    "Mozilla/5.0 (Linux; Android 14; SM-S928B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/26.0 Chrome/122.0.0.0 Mobile Safari/537.36",
  iphoneSafari:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
  iphoneSafariOld:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 12_5_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.1.2 Mobile/15E148 Safari/604.1",
  iphoneChrome:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/128.0.6613.113 Mobile/15E148 Safari/604.1",
  iphoneFirefox:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/127.0 Mobile/15E148 Safari/605.1.15",
  iphoneEdge:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) EdgiOS/128.0.0.0 Mobile/15E148 Safari/605.1.15",
  iphoneOpera:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) OPiOS/8.5.2.99991 Mobile/15E148 Safari/605.1.15",
  iphoneYandex:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) YaBrowser/24.7.0.1234.10 Mobile/15E148 Safari/605.1.15",
  iphoneGoogleApp:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 GSA/300.0.640021317",
  iphoneFacebook:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [FBAN/FBIOS;FBAV/470.0.0.0;]",
  iphoneInstagram:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 312.0.0.34.111",
  iphoneWeChat:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.47(0x18002f30) NetType/WIFI Language/en",
  iphoneVK:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 VKClient/916 (iPhone, iOS 17.5, Scale/3.00)",
  // Telegram: some visits (mini-apps/bots, certain versions) go through
  // its own WKWebView with an " Telegram X.Y.Z" marker at the end of the UA.
  // Source: github.com/TelegramMessenger/Telegram-iOS/issues/736.
  iphoneTelegramWebview:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 15_3_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.3 Mobile/15E148 Safari/604.1 Telegram 3.6.1123",
  // Viber: a WKWebView browser that strips "Version/", "Mobile/" and
  // "Safari/" from the UA entirely — doesn't match the Safari shape at
  // all, no special case needed.
  iphoneViber:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko)",
  // Telegram/Slack/Discord/Reddit most often open a link through
  // SFSafariViewController — Safari's system component, whose UA is
  // byte-identical to real Safari's, no exception possible. The
  // classifier correctly files such visits under "ios-safari" — a
  // documented limitation (SFSafariViewController really is close to
  // Safari in terms of cookies/session), not a bug; the /install screen
  // carries a hint for this exact case (ADR 0016) rather than trying to
  // detect it here. One example stands in for all four — the UA is
  // identical.
  iphoneSfSafariViewController:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.3 Mobile/15E148 Safari/604.1",
  // An in-app browser with no known name at all — doesn't matter which
  // one, it simply doesn't match the Safari shape (no "Safari/" token,
  // as most WKWebView wrappers omit it).
  iphoneUnknownWebview: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148",
  // "Request Desktop Site" in Safari on iPhone — the UA is indistinguishable
  // from desktopSafariMac by construction, falls into "desktop" — an expected trade-off.
  iphoneRequestDesktopSite:
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15",
  empty: "",

  // Real-device measurements (iPhone, iOS 18.7/26.6.x — 2026-09) — the UA
  // strings that motivated the switch from an enumerated browser list to
  // a single "is this exactly Safari" shape match (ADR 0016). Brave and
  // DuckDuckGo are otherwise byte-identical to Safari and used to pass
  // the old token-list check (neither token was listed); the shape check
  // rejects them by the exact-end-anchor rule without needing to know
  // their names at all (see the comment above IOS_SAFARI_UA_PATTERN in
  // classify-access.ts).
  liveSafari:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.6.1 Mobile/23G83 Safari/604.1",
  liveSafari2:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.6.1 Mobile/15E148 Safari/604.1",
  liveBrave:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.6.1 Mobile/15E148 Safari/604.1 Brave",
  liveDuckDuckGo:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.6 Mobile/15E148 Safari/604.1 Ddg/26.6",
  liveChrome:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 26_6_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/152.0.7977.64 Mobile/15E148 Safari/604.1",
  liveFirefox:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 26_6_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/120.3  Mobile/15E148 Safari/605.1.15",
  liveEdge:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 26_6_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) EdgiOS/153.0.4234.46 Version/26.0 Mobile/15E148 Safari/604.1",
} as const;

describe("classifyAccess", () => {
  it.each([
    ["desktopChromeMac", UA.desktopChromeMac, "desktop"],
    ["desktopSafariMac", UA.desktopSafariMac, "desktop"],
    ["desktopFirefoxWindows", UA.desktopFirefoxWindows, "desktop"],
    ["ipadAsMac", UA.ipadAsMac, "desktop"],
    ["ipadExplicit", UA.ipadExplicit, "desktop"],
    ["androidChrome", UA.androidChrome, "android"],
    ["androidTabletChrome", UA.androidTabletChrome, "android"],
    ["androidSamsungInternet", UA.androidSamsungInternet, "android"],
    ["iphoneSafari", UA.iphoneSafari, "ios-safari"],
    ["iphoneSafariOld", UA.iphoneSafariOld, "ios-safari"],
    ["iphoneChrome", UA.iphoneChrome, "ios-not-safari"],
    ["iphoneFirefox", UA.iphoneFirefox, "ios-not-safari"],
    ["iphoneEdge", UA.iphoneEdge, "ios-not-safari"],
    ["iphoneOpera", UA.iphoneOpera, "ios-not-safari"],
    ["iphoneYandex", UA.iphoneYandex, "ios-not-safari"],
    ["iphoneGoogleApp", UA.iphoneGoogleApp, "ios-not-safari"],
    ["iphoneFacebook", UA.iphoneFacebook, "ios-not-safari"],
    ["iphoneInstagram", UA.iphoneInstagram, "ios-not-safari"],
    ["iphoneWeChat", UA.iphoneWeChat, "ios-not-safari"],
    ["iphoneVK", UA.iphoneVK, "ios-not-safari"],
    ["iphoneTelegramWebview", UA.iphoneTelegramWebview, "ios-not-safari"],
    ["iphoneViber", UA.iphoneViber, "ios-not-safari"],
    ["iphoneSfSafariViewController", UA.iphoneSfSafariViewController, "ios-safari"],
    ["iphoneUnknownWebview", UA.iphoneUnknownWebview, "ios-not-safari"],
    ["iphoneRequestDesktopSite", UA.iphoneRequestDesktopSite, "desktop"],
    ["empty", UA.empty, "desktop"],
    ["liveSafari", UA.liveSafari, "ios-safari"],
    ["liveSafari2", UA.liveSafari2, "ios-safari"],
    ["liveBrave", UA.liveBrave, "ios-not-safari"],
    ["liveDuckDuckGo", UA.liveDuckDuckGo, "ios-not-safari"],
    ["liveChrome", UA.liveChrome, "ios-not-safari"],
    ["liveFirefox", UA.liveFirefox, "ios-not-safari"],
    ["liveEdge", UA.liveEdge, "ios-not-safari"],
  ] as const)("%s -> %s", (_name, ua, expected) => {
    expect(classifyAccess(ua)).toBe(expected);
  });
});
