import { redirect } from "next/navigation";

// The bare root route always redirects to the default screen.
export default function RootPage() {
  redirect("/day");
}
