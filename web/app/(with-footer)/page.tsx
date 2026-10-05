import { redirect } from "next/navigation";

import { routes } from "@/shared/config";

// /day is the single entry point, routed further on by web/proxy.ts
// (ADR 0017/0045): without a session the proxy never lets this render and
// sends the visitor to /login; with one it passes, and this redirect
// hands over to /day. A plain browser on iPhone Safari is sent to
// /install by LaunchGate before any of that.
const RootPage = () => {
  redirect(routes.day);
};

export default RootPage;
