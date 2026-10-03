export const urlBase64ToUint8Array = (base64String: string): Uint8Array<ArrayBuffer> => {
  const padding = "=".repeat(
    (4 - (base64String.length % 4)) % 4,
  );

  const base64 = (
    base64String + padding
  )
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);

  const buffer = new ArrayBuffer(
    rawData.length,
  );

  const outputArray
    = new Uint8Array(buffer);

  for (
    let index = 0;
    index < rawData.length;
    index += 1
  ) {
    outputArray[index]
      = rawData.charCodeAt(index);
  }

  return outputArray;
};
