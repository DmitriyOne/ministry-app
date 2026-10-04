"use client";

import { ScreenHeader } from "@/shared/ui/screen-header";

import { useScreenBack } from "../model/use-screen-back";

// A ScreenHeader (shared/ui) wired to the "go back, or fall back to the
// app root" scenario (see model/use-screen-back.ts) — the scenario is
// what makes this a feature, not shared/ui: it decides where "back"
// goes, shared/ui only renders. Currently used by the about screen
// (pages/about), but the logic itself doesn't know about /about at all.
type ScreenBackHeaderProps = {
  eyebrow: string;
  className?: string;
};

export const ScreenBackHeader = ({ eyebrow, className }: ScreenBackHeaderProps) => {
  const handleBack = useScreenBack();

  return <ScreenHeader eyebrow={eyebrow} onBack={handleBack} className={className} />;
};
