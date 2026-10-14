import type { ReactNode } from "react";

import { cn } from "@/shared/lib/cn";
import { AppMark } from "@/shared/ui/app-mark";
import { TextBlock } from "@/shared/ui/text-block";

// The opening of an authentication screen: the app mark above a title and
// a line of explanation, on the deep background.
//
// It exists because /login and /forgot-password had this block written out
// twice, identically, down to the comment saying it was deliberately the
// same — which is the description of a component that had not been given a
// name yet. A mark of a different size or a changed gap would have had to
// be remembered in two files.
type ScreenIntroProps = {
  title: ReactNode;
  text?: ReactNode;
  className?: string;
};

export const ScreenIntro = ({ title, text, className }: ScreenIntroProps) => (
  <div className={cn("flex flex-col gap-3.5 px-2", className)}>
    <AppMark size={56} tone="translucent" />
    <TextBlock title={title} text={text} tone="hero" />
  </div>
);
