// The server POSTs a confirmation to the subscription endpoint, so whatever
// host the endpoint names is a host our server will call. Without a check, an
// enrolled stranger could point it at any server. Only the hosts that browsers
// really use for Web Push are accepted.
//
// This is the one place to change when a browser vendor adds a push host.
// The check lives here, in the application, and not in a database constraint:
// the outbound request is made by the Node process, which a `check` cannot
// stop, and a vendor adding a host must not need a migration. The existing
// `endpoint like 'https://%'` constraint on the table stays as a sanity check,
// not as the gate.

const EXACT_PUSH_SERVICE_HOSTS: ReadonlySet<string> = new Set([
  "web.push.apple.com",
  "fcm.googleapis.com",
  // Legacy FCM endpoint.
  "android.googleapis.com",
  "updates.push.services.mozilla.com",
]);

// Microsoft and Mozilla use per-region subdomains.
const PUSH_SERVICE_DOMAIN_SUFFIXES: readonly string[] = [
  "notify.windows.com",
  "push.services.mozilla.com",
];

const isSubdomainOf = (hostname: string, domain: string): boolean =>
  hostname.endsWith(`.${domain}`);

export const isPushServiceEndpoint = (endpoint: string): boolean => {
  let url: URL;

  try {
    url = new URL(endpoint);
  } catch {
    return false;
  }

  if (url.protocol !== "https:") {
    return false;
  }

  const hostname = url.hostname.toLowerCase();

  return (
    EXACT_PUSH_SERVICE_HOSTS.has(hostname)
    || PUSH_SERVICE_DOMAIN_SUFFIXES.some((domain) =>
      isSubdomainOf(hostname, domain),
    )
  );
};
