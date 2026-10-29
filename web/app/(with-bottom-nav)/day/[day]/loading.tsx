// The route's loading boundary. Next renders it the instant the
// navigation starts and keeps it until the server answers — and, just as
// importantly, its presence is what lets a <Link> prefetch this route at
// all: for a dynamic route the prefetch reaches the nearest such
// boundary (ADR 0059). /day became dynamic when the hours card started
// reading what it holds (ADR 0062).
export { DayScreenSkeleton as default } from "@/pages/day";
