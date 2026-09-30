import { redirect } from "next/navigation";

// /day is the single entry point, routed further on by web/proxy.ts
// (ADR 0017): an installed app goes to /day or /soon depending on
// LAUNCH_MODE, a plain browser on iPhone Safari goes to /install.
const RootPage = () => {
  redirect("/day");
};

export default RootPage;
