import type { ReactNode } from "react";

import { CheckCircleIcon } from "@/shared/ui/icons";

type WaitlistSuccessCardProps = {
  title: string;
  text: string;
  action?: ReactNode;
};

export const WaitlistSuccessCard = ({
  title,
  text,
  action,
}: WaitlistSuccessCardProps) => (
  <div
    role="status"
    className="flex w-full max-w-100 flex-col gap-4 rounded-2xl border border-hero/8 bg-card px-5 py-5 text-left shadow-card"
  >
    <div className="flex items-start gap-3.5">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        <CheckCircleIcon size={20} />
      </span>

      <div className="min-w-0">
        <p className="text-list-row font-600 text-hero">
          {title}
        </p>

        <p className="mt-1 text-body text-ink-muted">
          {text}
        </p>
      </div>
    </div>

    {action}
  </div>
);
