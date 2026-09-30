import { getRequestConfig } from "next-intl/server";

import { locale } from "./locale";

import messages from "./messages/en-GB.json";

// One language, no URL segment/cookie/browser detection (user's decision,
// see ADR 0014) — locale is always "en-GB". The structure (locale in its
// own module, messages loaded by file name) leaves room to later read
// locale from a cookie/URL and load messages/<locale>.json without
// rewriting the rest of the code.
export default getRequestConfig(async () => ({
  locale,
  messages,
}));
