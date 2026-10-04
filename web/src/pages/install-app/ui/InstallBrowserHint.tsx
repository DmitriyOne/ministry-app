import type { ReactNode } from "react";

import { AlertCircleIcon } from "@/shared/ui/icons";

type InstallBrowserHintProps = {
  children: ReactNode;
};

export const InstallBrowserHint = ({
  children,
}: InstallBrowserHintProps) => (
  <aside className="flex w-full max-w-80 items-start gap-3 rounded-2xl border border-hint/18 bg-card px-4 py-4 text-left shadow-card">
    <span
      className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-hint/10 text-hint"
    >
      <AlertCircleIcon size={18} />
    </span>

    <p className="text-body font-500 text-ink-muted">
      {children}
    </p>
  </aside>
);
