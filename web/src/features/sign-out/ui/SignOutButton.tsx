"use client";

import { useState } from "react";

import { Button } from "@/shared/ui/button";
import { Dialog, DialogDescription, DialogFooter, DialogTitle } from "@/shared/ui/dialog";

import { signOut } from "../api/sign-out-action";

type SignOutButtonProps = {
  label: string;
  // The copy for the confirmation. Passed in, like `label`: the screen owns
  // the words, this feature owns the scenario.
  confirm: { title: string; body: string; confirm: string; cancel: string };
};

// Asking before signing out, because getting back in costs an email and a
// password — there is no "undo" and nobody can reset their own (ADR 0043:
// the owner issues the accounts).
//
// This is why the component is now a client one. It used to be a plain
// <form action={signOut}> with no "use client" at all, which meant signing
// out worked before — and without — JavaScript. That property is gone, and
// it is a real loss: on the one screen where someone might be trying to get
// out of a session gone wrong, the way out now needs JS to run. Accepted
// because the rest of the app needs JS regardless — LaunchGate decides
// whether the app may render at all (ADR 0019) — so a session that can be
// signed out of is a session that was usable in the first place.
//
// The confirming button stays a submit inside its own <form>, so the Server
// Action is invoked the ordinary way, with its redirect and its cache
// invalidation, rather than through a handler.
export const SignOutButton = ({ label, confirm }: SignOutButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        variant="plain"
        size="role-lg"
        className="w-full text-negative"
        onPress={() => setIsOpen(true)}
      >
        {label}
      </Button>

      <Dialog isOpen={isOpen} onOpenChange={setIsOpen}>
        <DialogTitle>{confirm.title}</DialogTitle>
        <DialogDescription>{confirm.body}</DialogDescription>
        <DialogFooter>
          {/* Staying is the quiet option and the one a stray tap should
              land on, so it sits on the left, away from the thumb. */}
          <Button variant="plain" size="role" onPress={() => setIsOpen(false)}>
            {confirm.cancel}
          </Button>
          <form action={signOut}>
            <Button type="submit" variant="alert" size="role" className="w-full">
              {confirm.confirm}
            </Button>
          </form>
        </DialogFooter>
      </Dialog>
    </>
  );
};
