import { useCallback, useEffect, useRef, useState } from "react";
import type {
  NotificationClient,
  NotificationItem,
  NotificationSettings,
  NotificationCategory,
  BrowserNotificationPort,
} from "../domain/notifications";
export function useNotifications(
  client: NotificationClient,
  locale: "ru" | "en",
  browser: BrowserNotificationPort,
) {
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [next, setNext] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permission, setPermission] = useState(browser.permission);
  const [connected, setConnected] = useState<string | null>(null);
  const [telegramUrl, setTelegramUrl] = useState<string | null>(null);
  const controller = useRef(new AbortController());
  const pending = useRef(false);
  const load = useCallback(
    async (signal: AbortSignal) => {
      const [s, p] = await Promise.all([client.settings(signal), client.inbox(null, signal)]);
      signal.throwIfAborted();
      setSettings(s);
      setItems(p.items);
      setNext(p.next);
      setPermission(browser.permission());
      const fingerprint = await browser.fingerprint();
      signal.throwIfAborted();
      setConnected(s.browsers.find((item) => item.fingerprint === fingerprint)?.id ?? null);
    },
    [client, browser],
  );
  useEffect(() => {
    const c = new AbortController();
    controller.current = c;
    pending.current = false;
    setBusy(false);
    setConnected(null);
    setItems([]);
    setLoading(true);
    setError(null);
    setSettings(null);
    setTelegramUrl(null);
    void load(c.signal)
      .catch(() => {
        if (!c.signal.aborted) setError("load");
      })
      .finally(() => {
        if (!c.signal.aborted) setLoading(false);
      });
    return () => c.abort();
  }, [load]);
  const action = async (operation: (signal: AbortSignal) => Promise<void>, refresh = true) => {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    setError(null);
    const signal = controller.current.signal;
    try {
      await operation(signal);
      if (refresh) await load(signal);
    } catch (e) {
      if (!signal.aborted) setError(e instanceof Error && e.message === "PUSH_DENIED" ? "denied" : "save");
    } finally {
      if (controller.current.signal === signal) pending.current = false;
      if (!signal.aborted) {
        setBusy(false);
        setPermission(browser.permission());
      }
    }
  };
  return {
    settings,
    items,
    next,
    loading,
    busy,
    error,
    permission,
    connected,
    telegramUrl,
    retry: () => action(async () => {}),
    enableBrowser: () =>
      action(async (signal) => {
        if (!settings?.vapidPublicKey) return;
        const sub = await browser.enable(settings.vapidPublicKey);
        try {
          await client.browser(sub.toJSON(), signal);
        } catch (e) {
          await sub.unsubscribe();
          throw e;
        }
      }),
    disableBrowser: () =>
      action(async (signal) => {
        if (connected) await client.disconnect("browser", signal, connected);
        await browser.disable();
      }),
    linkTelegram: () =>
      action(async (signal) => {
        const url = await client.telegramLink(signal);
        signal.throwIfAborted();
        setTelegramUrl(url);
      }),
    refreshTelegram: () => action(async () => {}),
    confirmTelegram: () =>
      action(async (signal) => {
        await client.confirmTelegram(signal);
        signal.throwIfAborted();
        setTelegramUrl(null);
      }),
    disconnectTelegram: () =>
      action(async (signal) => {
        await client.disconnect("telegram", signal);
        signal.throwIfAborted();
        setTelegramUrl(null);
      }),
    changeCategories: (categories: NotificationCategory[]) =>
      action((signal) => client.preferences(categories, locale, settings?.version ?? 0, signal)),
    markRead: (id: string) => action((signal) => client.read(id, signal)),
    more: () =>
      action(async (signal) => {
        if (!next) return;
        const page = await client.inbox(next, signal);
        signal.throwIfAborted();
        setItems((current) => [
          ...current,
          ...page.items.filter((item) => !current.some((old) => old.id === item.id)),
        ]);
        setNext(page.next);
      }, false),
  };
}
export type NotificationsState = ReturnType<typeof useNotifications>;
