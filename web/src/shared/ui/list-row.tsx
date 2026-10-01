import type { ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

// A row inside a white list card — icon tile, title, description. All
// text comes in as props, no domain logic — plain enough for shared/ui
// (used by the about screen's Screens/Features lists, ADR 0029/0030).
type ListRowProps = {
  icon: ReactNode;
  title: ReactNode;
  text: ReactNode;
  divided?: boolean;
};

export const ListRow = ({ icon, title, text, divided = true }: ListRowProps) => (
  <div className={cn("flex items-start gap-3.5 py-4", divided && "border-b border-ink-a07")}>
    <div
      aria-hidden="true"
      className="flex size-9.5 shrink-0 items-center justify-center rounded-xs bg-background text-ink"
    >
      {icon}
    </div>
    <div className="flex flex-col gap-0.5">
      <p className="text-list-row font-580 tracking-list-row text-ink">{title}</p>
      <p className="text-caption font-500 text-pretty text-ink-muted">{text}</p>
    </div>
  </div>
);
