"use client";

import { useEffect } from "react";

// Renders nothing. Its job: when the browser brings a page back from its
// own cache, ask the server whether that page is still allowed.
//
// The problem it solves, reported on a real iPhone: sign in, then swipe
// back — and the login screen is there again, behind a session that
// already exists. Two different mechanisms can produce that, and only one
// of them is this component's:
//
//   * a CLIENT-side back inside the app. The document never unloaded, so
//     nothing fires here; the router simply re-renders /login from its
//     client cache. That one is fixed at the source — the sign-in action
//     invalidates the client cache (revalidatePath), exactly as signing
//     out does, so a back navigation has to ask the server, and the proxy
//     answers with a redirect to /day.
//   * a DOCUMENT restore from the back/forward cache (`pageshow` with
//     `persisted`). The whole page comes back as it was, including
//     markup rendered before the session changed, and the server is
//     never asked. That is this component.
//
// `location.reload()` rather than any client-side navigation: the point
// is to make a real request, which runs the proxy, which is the one place
// that decides where a person belongs (ADR 0050). Whatever the answer, it
// is correct by construction — this file knows nothing about sessions.
//
// Mounted on the screens whose answer depends on a session: /login and
// /forgot-password (where having one is disqualifying) and everything
// inside app/(with-bottom-nav) (where not having one is).
export const RecheckGateOnRestore = () => {
  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      // Only a restored page. A normal load has just asked the server by
      // definition, and reloading that would be an endless loop.
      if (event.persisted) window.location.reload();
    };

    window.addEventListener("pageshow", handlePageShow);

    return () => window.removeEventListener("pageshow", handlePageShow);
  }, []);

  return null;
};
