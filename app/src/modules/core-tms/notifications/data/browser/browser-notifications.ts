export type BrowserPermission = NotificationPermission | "unsupported";
export const browserPermission = (): BrowserPermission =>
  typeof window !== "undefined" &&
  window.isSecureContext &&
  "Notification" in window &&
  "serviceWorker" in navigator &&
  "PushManager" in window
    ? Notification.permission
    : "unsupported";
export async function enableBrowserNotifications(publicKey: string): Promise<PushSubscription> {
  if (browserPermission() === "unsupported") throw new Error("PUSH_UNSUPPORTED");
  // Permission is requested before any asynchronous work, from the explicit click.
  const permission = await Notification.requestPermission();
  if (permission !== "granted") throw new Error("PUSH_DENIED");
  const registration = await navigator.serviceWorker.register("/falcon/notifications/worker.js");
  if (!registration.active)
    await new Promise<void>((resolve, reject) => {
      const worker = registration.installing ?? registration.waiting;
      if (!worker) {
        reject(new Error("PUSH_UNAVAILABLE"));
        return;
      }
      const timer = setTimeout(() => reject(new Error("PUSH_UNAVAILABLE")), 15000);
      worker.addEventListener(
        "statechange",
        () => {
          if (worker.state === "activated") {
            clearTimeout(timer);
            resolve();
          }
        },
        { once: false },
      );
    });
  const existing = await registration.pushManager.getSubscription();
  if (existing) return existing;
  const bytes = Uint8Array.from(atob(publicKey.replace(/-/g, "+").replace(/_/g, "/")), (c) =>
    c.charCodeAt(0),
  );
  return registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: bytes });
}
export async function disableBrowserNotifications(): Promise<void> {
  if (!("serviceWorker" in navigator)) return;
  const registration = await navigator.serviceWorker.getRegistration("/falcon/notifications/");
  await (await registration?.pushManager.getSubscription())?.unsubscribe();
}
export async function currentBrowserSubscription(): Promise<PushSubscription | null> {
  if (browserPermission() === "unsupported") return null;
  return (
    (
      await navigator.serviceWorker.getRegistration("/falcon/notifications/")
    )?.pushManager.getSubscription() ?? null
  );
}

export const browserNotifications = {
  permission: browserPermission,
  enable: enableBrowserNotifications,
  disable: disableBrowserNotifications,
  async fingerprint(): Promise<string | null> {
    const sub = await currentBrowserSubscription();
    if (!sub) return null;
    return Array.from(
      new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(sub.endpoint))),
      (v) => v.toString(16).padStart(2, "0"),
    ).join("");
  },
};
