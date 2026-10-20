// The route's loading boundary. Next renders it the instant the
// navigation starts and keeps it until the server answers — and, just as
// importantly, its presence is what lets a <Link> prefetch this route at
// all: for a dynamic route the prefetch reaches the nearest such
// boundary, and /profile had none (ADR 0059).
export { ProfileScreenSkeleton as default } from "@/pages/profile";
