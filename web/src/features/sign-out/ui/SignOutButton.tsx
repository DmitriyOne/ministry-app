import { Button } from "@/shared/ui/button";

import { signOut } from "../api/sign-out-action";

type SignOutButtonProps = {
  label: string;
};

// A plain form whose action is the Server Action — so this needs no
// "use client" at all, and signing out works before (or without) any
// JavaScript. The label comes in as a prop: the screen owns the copy,
// this feature owns the scenario.
export const SignOutButton = ({ label }: SignOutButtonProps) => (
  <form action={signOut}>
    <Button type="submit" variant="plain" size="role-lg" className="w-full text-negative">
      {label}
    </Button>
  </form>
);
