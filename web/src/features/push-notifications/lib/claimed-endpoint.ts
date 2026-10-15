const CLAIMED_ENDPOINT_KEY = "push-claimed-endpoint";

// Remembers that this tab has already told the server which subscription
// this device holds, so opening the profile screen again does not repeat
// a call that would say exactly the same thing.
//
// sessionStorage, not localStorage: being wrong here costs one redundant
// upsert, and a flag that outlives the session would be the one that is
// wrong after signing in as someone else. Safari in private mode throws
// on access, and a failed claim must never be the reason a screen breaks,
// so both sides swallow it — the cost is the call being made again.
export const readClaimedEndpoint = (): string | null => {
  try {
    return sessionStorage.getItem(CLAIMED_ENDPOINT_KEY);
  } catch {
    return null;
  }
};

export const writeClaimedEndpoint = (endpoint: string): void => {
  try {
    sessionStorage.setItem(CLAIMED_ENDPOINT_KEY, endpoint);
  } catch {
    // Storage unavailable: the claim simply repeats next time.
  }
};
