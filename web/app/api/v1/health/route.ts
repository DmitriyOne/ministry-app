// A deliberately shallow same-origin connectivity probe.
//
// It does not touch Supabase, auth, or any other dependency: this endpoint
// answers only whether the browser can reach the MinistryApp origin. Next.js
// 15+ Route Handlers are dynamic (not cached) by default; Cache-Control is
// still explicit here so browsers/CDNs do not reuse an old probe response.
export const GET = () =>
  new Response(null, {
    status: 204,
    headers: {
      "Cache-Control": "no-store",
    },
  });
