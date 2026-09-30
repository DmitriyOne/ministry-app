import type { ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

type ActionStackProps = {
  children: ReactNode;
  maxWidth?: "260" | "full";
  className?: string;
};

export const ActionStack = ({ children, maxWidth = "260", className }: ActionStackProps) => (
  <div
    className={cn("flex w-full flex-col gap-2.5", maxWidth === "260" && "max-w-65", className)}
  >
    {children}
  </div>
);
