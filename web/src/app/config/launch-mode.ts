// The single place that switches v1 to the real app (ADR 0016/0017).
// Read by web/proxy.ts: "coming-soon" sends an installed app to /soon
// instead of /day; "app" sends it to /day. DEV_MODE=true bypasses proxy
// entirely and always shows /day directly, whatever's set here.
export const LAUNCH_MODE: "coming-soon" | "app" = "coming-soon";
