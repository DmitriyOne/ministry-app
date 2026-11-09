// The window events one part of the app raises for another to hear,
// where the two may not import each other.
//
// There are two.
//
// The first exists because of a gap ADR 0055 left open on purpose: the connectivity probe does not poll while it believes the
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
// The second is the bottom bar answering a tap on the screen the person
// is ALREADY on. Nothing navigates then — the address is the same one —
// so the screen never hears about it, and the owner asked for the one
// thing that tap plainly means: put this screen back where it starts
// (2026-11-09). The strip of days on /day listens and scrolls itself
// home; every other screen ignores it, which is why it says "the item
// was tapped again" rather than "scroll to today".
//
// Here rather than in a prop or a context, for the same reason as the
// first: the bar is a widget, the strip lives in a page, and a page may
// not hand anything down to the layout that renders the bar.
export const APP_EVENTS = {
  connectivitySuspect: "ministry:connectivity-suspect",
  navItemRepeated: "ministry:nav-item-repeated",
} as const;
