export const NETWORK_CONFIG = {
  connectivityTimeoutMs: 5_000,
  offlineRetryIntervalMs: 10_000,
  // How long "try again" keeps showing that it is working, however fast the
  // answer comes back. With the radio off checkConnectivity returns at once
  // without touching the network, so without a floor the button's busy state
  // begins and ends inside one frame and the press looks like it did nothing.
  retryFeedbackMinMs: 600,
  // The connection has to hold for this long before the toast is shown at
  // all. It is not decoration: a flapping connection used to produce a toast
  // per flap, so waiting serves as the debounce as well as reading calmer.
  reconnectToastDelayMs: 1_000,
  reconnectToastDurationMs: 3_000,
  // How long the toast's enter/exit animation runs. Kept here because the
  // hook's failsafe timer has to outlast it — see use-reconnect-feedback.
  reconnectToastAnimationMs: 300,
} as const;
