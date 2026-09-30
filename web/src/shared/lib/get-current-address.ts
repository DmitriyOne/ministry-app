// Reads the current page's address. Guarded for `typeof window` so it's
// safe to import during SSR (returns "" there) without needing "use client".
//
// Defined at module scope rather than inline at the call site: callers
// pass it as a prop default that ends up in a `useEffect` dependency
// array (`CopyLinkButton`), and an inline arrow would be a new function
// on every render, re-running that effect for no reason.
export const getCurrentAddress = (): string =>
  typeof window === "undefined" ? "" : window.location.href;
