/**
 * App-wide providers (theme, query client, auth context, etc.) go here.
 * Kept as a single pass-through for now — wire up real providers as they
 * are needed instead of scaffolding empty ones speculatively.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return children;
}
