// Minimal health-check Edge Function.
// Used to verify the local (and later production) Supabase Functions runtime is reachable.
Deno.serve(() => {
  return new Response(JSON.stringify({ status: "ok" }), {
    headers: { "content-type": "application/json" },
  });
});
