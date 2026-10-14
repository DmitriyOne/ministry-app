"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createServerSupabaseClient } from "@/shared/api";
import { routes } from "@/shared/config";
import { reportActionFailure } from "@/shared/lib/action-failure";

export const signOut = async (): Promise<void> => {
  try {
    const supabase = await createServerSupabaseClient();

    // Clears the session cookies through the same cookie adapter the rest
    // of the app reads them with; the proxy sees a request without a
    // session from the very next navigation.
    await supabase.auth.signOut();
  } catch (error) {
    // A failure here is not shown to anyone: the redirect below happens
    // either way. Leaving someone on the profile screen that looks signed
    // out, or with an error they cannot act on, is worse than sending
    // them to /login, where the session is checked again from scratch —
    // and if it survived, the gate sends them straight back to /day.
    reportActionFailure({ scope: "sign-out", error, outcome: "failed" });
  }

  // The client cache holds the RSC payload of every screen visited in
  // this session, and Next.js reuses it for browser back/forward without
  // asking the server — so without this, Back after signing out can show
  // the day screen as the person who just left it. Deleting a cookie
  // through cookies() already invalidates that cache, and signOut() does
  // delete the session cookies through the same adapter; this says it
  // outright instead of depending on a side effect of how the Supabase
  // client happens to write them. Signing out happens once a session, so
  // the cost does not matter. Before redirect(), which never returns.
  revalidatePath("/", "layout");

  // Outside the try on purpose: redirect() works by throwing a
  // NEXT_REDIRECT error that the framework catches, so a catch block
  // around it would swallow the navigation and leave the person where
  // they were.
  redirect(routes.login);
};
