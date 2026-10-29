// The window events one part of the app raises for another to hear,
// where the two may not import each other.
//
// There is one, and it exists because of a gap ADR 0055 left open on
// purpose: the connectivity probe does not poll while it believes the
// app is online, so an outage that leaves the Wi-Fi connected — the
// router loses its uplink, DNS stops answering, the backend goes down —
// is not noticed until something else triggers a probe. The owner found
// it on 2026-10-27: the network went, the screen carried on as if
// nothing had happened, and the offline screen arrived only much later.
//
// A failed request is the evidence that was missing. Whatever makes one
// and does not get an answer raises this, and features/network-status
// probes on it — once, in response to a real event, rather than on a
// timer burning a request every ten seconds for the ninety-nine percent
// of the time nothing is wrong.
//
// A window event rather than a call, because the two sides are both in
// `features` and FSD forbids them to know about each other. The NAME is
// what they have to agree on, and a name has no runtime — which is why
// it sits beside the route and endpoint constants rather than in
// `shared/lib` (the same reasoning as api-routes.ts, ADR 0034).
//
// Prefixed, because the window is shared with the browser, the service
// worker's client messages and anything an extension injects.
export const APP_EVENTS = {
  connectivitySuspect: "ministry:connectivity-suspect",
} as const;
