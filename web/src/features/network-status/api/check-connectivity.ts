import { WEB_API_ROUTES } from "@/shared/config";

import { NETWORK_CONFIG } from "../config/network-config";

// Three answers, not two. "The origin did not answer" and "the origin
// answered that it is broken" are different facts about the world, and
// the person needs to be told different things: one is theirs to fix
// (Wi-Fi, a tunnel, a dead spot), the other is ours and no amount of
// walking towards a window will help. Collapsing them into a boolean is
// how a 502 from our own server came out as "You're offline" on a phone
// with four bars of signal.
//
// `reachable`  — 2xx from the health endpoint: the origin is serving.
// `unreachable` — the origin answered, and the answer was not a 2xx: a
//                 500 from a broken deployment, a 503 while Vercel has
//                 nothing to route to, a 404 if the route went missing.
// `offline`     — nothing answered: the radio is off, the request timed
//                 out, DNS failed, or the response was a cross-origin
//                 redirect fetch refuses to follow.
export type ConnectivityOutcome
  = "reachable" | "unreachable" | "offline";

export const checkConnectivity
  = async (): Promise<ConnectivityOutcome> => {
    if (
      typeof navigator !== "undefined"
      && navigator.onLine === false
    ) {
      return "offline";
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
      // nothing on its own: a 500/502 from a broken origin, a 404, or a
      // captive portal's 200 login page all resolve. Only a 2xx from the
      // health endpoint (204 No Content) means the origin is really serving.
      if (response.ok) return "reachable";

      // The status is the one thing worth keeping from a failed probe. It
      // is not shown to anyone — the screen says the same sentence for
      // every code — but it is the first question asked when somebody
      // reports the screen, and the console is where they can answer it
      // without a deployment.
      console.warn("[network] origin answered, but not with a 2xx", {
        status: response.status,
      });

      return "unreachable";
    } catch {
      return "offline";
    } finally {
      globalThis.clearTimeout(timeout);
    }
  };
