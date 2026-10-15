import { WEB_API_ROUTES } from "@/shared/config";

import { NETWORK_CONFIG } from "../config/network-config";

export const checkConnectivity
  = async (): Promise<boolean> => {
    if (
      typeof navigator !== "undefined"
      && navigator.onLine === false
    ) {
      return false;
    }

    const controller = new AbortController();

    const timeout = globalThis.setTimeout(
      () => controller.abort(),
      NETWORK_CONFIG.connectivityTimeoutMs,
    );

    try {
      // Cookies travel, which is fetch's own default and is stated here
      // rather than left implicit. The question this probe asks is "can
      // the browser reach our origin the way it reaches it for
      // everything else" — and everything else (navigations, Server
      // Actions, Supabase) carries cookies. Omitting them asked a
      // different question, one the app never asks anywhere.
      //
      // It cost a real hour: on a Vercel preview, which sits behind
      // Deployment Protection, a cookie-less request is answered with a
      // 302 to vercel.com/sso-api. The redirect is cross-origin and
      // carries no CORS headers, so fetch rejects, the catch below reads
      // it as "no connection", and the whole app is replaced by the
      // offline screen — on a deployment whose pages were loading
      // perfectly in the same tab, because the document request did
      // carry the cookie.
      const response = await fetch(WEB_API_ROUTES.health, {
        method: "GET",
        cache: "no-store",
        credentials: "same-origin",
        signal: controller.signal,
      });

      // `fetch` resolves for any HTTP response, so a resolved promise proves
      // nothing: a 500/502 from a broken origin, a 404, or a captive
      // portal's 200 login page all resolve. Only a 2xx from the health
      // endpoint (204 No Content) means the origin is really serving.
      return response.ok;
    } catch {
      return false;
    } finally {
      globalThis.clearTimeout(timeout);
    }
  };
