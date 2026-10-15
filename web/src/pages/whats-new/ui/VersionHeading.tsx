import { Caption } from "@/shared/ui/caption";

type VersionHeadingProps = {
  name: string;
  date: string;
  pill: string;
};

// The line above each card: version name and date on the left, a pill on
// the right.
//
// The pill is written here rather than taken from shared/ui because the
// shape already exists in exactly one other place — the role badge on
// /profile — and two uses is not yet a component. The tone differs by
// necessity: the badge sits on deep green and is mint, which the palette
// permits only there (ADR 0011), so on this warm background it is the
// muted green instead.
export const VersionHeading = ({ name, date, pill }: VersionHeadingProps) => (
  <div className="flex items-center justify-between gap-2.5 px-1 pt-1.5">
    <div className="flex min-w-0 flex-col">
      <p className="text-list-row font-600 tracking-list-row text-ink">{name}</p>
      <Caption>{date}</Caption>
    </div>
    <span className="shrink-0 rounded-sm bg-primary/10 px-3 py-1.5 text-caption font-600 text-primary">
      {pill}
    </span>
  </div>
);
