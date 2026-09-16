import { env } from "@/shared/config";

// Scaffold-stage signal that the two projects are wired together, not business logic.
async function getSupabaseStatus(): Promise<"ok" | "unreachable"> {
  try {
    const response = await fetch(
      `${env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/health`,
      {
        cache: "no-store",
        headers: {
          apikey: env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY}`,
        },
      },
    );

    if (!response.ok) {
      return "unreachable";
    }

    const body: unknown = await response.json();
    const status =
      typeof body === "object" && body !== null && "status" in body
        ? (body as { status?: unknown }).status
        : undefined;

    return status === "ok" ? "ok" : "unreachable";
  } catch {
    return "unreachable";
  }
}

export async function DayPage() {
  const supabaseStatus = await getSupabaseStatus();

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-2xl font-semibold">Day</h1>
      <p className="text-sm text-muted-foreground">
        Supabase:{" "}
        <span
          data-testid="supabase-status"
          className={
            supabaseStatus === "ok" ? "text-green-600" : "text-red-600"
          }
        >
          {supabaseStatus}
        </span>
      </p>
    </main>
  );
}
