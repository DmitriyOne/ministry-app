// Turning notifications off, on the browser's side.
//
// It really unsubscribes rather than leaving the subscription in place and
// remembering not to send: once the browser unsubscribes, the push service
// stops honouring that endpoint, so "off" is a fact about the device and
// not a promise about our server. The OS permission stays granted, which
// is why turning it back on later costs no prompt — just a new endpoint.
export const unsubscribeFromPush = async (): Promise<string | null> => {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (!subscription) return null;

    const { endpoint } = subscription;

    await subscription.unsubscribe();

    return endpoint;
  } catch {
    return null;
  }
};
