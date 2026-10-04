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
      const response = await fetch(WEB_API_ROUTES.health, {
        method: "GET",
        cache: "no-store",
        credentials: "omit",
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
