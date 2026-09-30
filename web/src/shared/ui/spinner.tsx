import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/shared/lib/cn";

// A custom component, not the shadcn registry one — their @shadcn/spinner
// wraps a lucide/tabler icon, and this project doesn't pull in third-party
// icons (ADR 0011). motion-safe:animate-spin disables itself under
// prefers-reduced-motion.
export const Spinner = ({ className, ...props }: ComponentPropsWithoutRef<"svg">) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
    className={cn("size-6 motion-safe:animate-spin", className)}
    {...props}
  >
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.15" strokeWidth="3" />
    <path
      d="M21 12a9 9 0 0 0-9-9"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
    />
  </svg>
);
