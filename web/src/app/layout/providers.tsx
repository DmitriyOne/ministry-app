import type { ReactNode } from "react";

type ProvidersProps = {
  children: ReactNode;
};

// Pass-through on purpose — add real providers here when one is actually needed.
export const Providers = ({ children }: ProvidersProps) => children;
