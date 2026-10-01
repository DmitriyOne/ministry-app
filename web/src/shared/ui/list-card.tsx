import type { ReactNode } from "react";

// White rounded card holding a column of ListRow entries — used for the
// Screens and (non-pace) Features lists on the about screen, ADR
// 0029/0030.
type ListCardProps = {
  children: ReactNode;
};

export const ListCard = ({ children }: ListCardProps) => (
  <div className="flex flex-col rounded-xl bg-card px-4 shadow-card">{children}</div>
);
