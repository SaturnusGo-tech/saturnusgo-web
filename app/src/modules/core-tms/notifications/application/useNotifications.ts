import { useCallback, useEffect, useRef, useState } from "react";
import { TmsApiError } from "../../../../core/tms/transport/http";
import type { NotificationClient, NotificationSettings, NotificationCategory, NotificationEventType,
  BrowserNotificationPort } from "../domain/notifications";

export function useNotifications(client: NotificationClient, locale: "ru" | "en", browser: BrowserNotificationPort) {
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permission, setPermission] = useState(browser.permission);
  const [connected, setConnected] = useState<string | null>(null);
  const [telegramUrl, setTelegramUrl] = useState<string | null>(null);
  const controller = useRef(new AbortController());
  const pending = useRef(false);
  const current = useRef({ client, browser, locale });
  current.current = { client, browser, locale };
  const owner = useRef({ client, browser });
  const loaded = useRef<{ client: NotificationClient; value: NotificationSettings } | null>(null);
  const owns = () => current.current.client === client && current.current.browser === browser;
  const load = useCallback(async (signal: AbortSignal) => {
    const value = await client.settings(signal);
    signal.throwIfAborted();
    if (current.current.client !== client || current.current.browser !== browser) return;
    const fingerprint = await browser.fingerprint();
    signal.throwIfAborted();
    if (current.current.client !== client || current.current.browser !== browser) return;
    loaded.current = { client, value };
    setSettings(value);
    setPermission(browser.permission());
    setConnected(value.browsers.find(item => item.fingerprint === fingerprint)?.id ?? null);
  }, [client, browser]);
  useEffect(() => {
    const c = new AbortController();
    controller.current = c;
    owner.current = { client, browser };
    loaded.current = null;
    pending.current = false;
    setBusy(false); setConnected(null); setLoading(true); setError(null); setSettings(null); setTelegramUrl(null);
    void load(c.signal).catch(() => {
      if (!c.signal.aborted) setError("load");
    }).finally(() => {
      if (!c.signal.aborted) setLoading(false);
    });
    return () => c.abort();
  }, [load, client, browser]);
  const action = async (operation: (signal: AbortSignal) => Promise<void>, requireSettings = true): Promise<boolean> => {
    if (!owns() || controller.current.signal.aborted || pending.current || requireSettings && loaded.current?.client !== client) return false;
    pending.current = true;
    setBusy(true); setError(null);
    const signal = controller.current.signal;
    try {
      await operation(signal);
      signal.throwIfAborted();
      if (owns()) await load(signal);
      return !signal.aborted && owns();
    } catch (cause) {
      if (!signal.aborted && owns()) {
        if (cause instanceof TmsApiError && cause.status === 412) {
          try {
            await load(signal);
            if (!signal.aborted && owns()) setError("conflict");
          } catch {
            if (!signal.aborted && owns()) { loaded.current = null; setSettings(null); setError("load"); }
          }
        } else setError(cause instanceof Error && cause.message === "PUSH_DENIED" ? "denied" : requireSettings ? "save" : "load");
      }
      return false;
    } finally {
      if (controller.current.signal === signal) pending.current = false;
      if (!signal.aborted && owns()) { setBusy(false); setPermission(browser.permission()); }
    }
  };
  const preferences = (patch: { categories?: NotificationCategory[]; excludedEventTypes?: NotificationEventType[] }, expectedVersion?: number) =>
    action(signal => {
      const value = loaded.current!.value;
      if (expectedVersion !== undefined && value.version !== expectedVersion) throw new TmsApiError("Preferences changed", 412, null, "NOTIFICATION_CONFLICT");
      return client.preferences({ categories: value.categories, excludedEventTypes: value.excludedEventTypes,
        ...patch, locale: current.current.locale }, value.version, signal);
    });
  const refresh = () => action(async () => {}, false);
  const visible = owner.current.client === client && owner.current.browser === browser;
  return {
    settings: visible ? settings : null,
    loading: !visible || loading,
    busy: visible && busy,
    error: visible ? error : null,
    permission,
    connected: visible ? connected : null,
    telegramUrl: visible ? telegramUrl : null,
    retry: refresh,
    refresh,
    enableBrowser: () => action(async signal => {
      const key = loaded.current!.value.vapidPublicKey;
      if (!key) return;
      const sub = await browser.enable(key);
      try { signal.throwIfAborted(); await client.browser(sub.toJSON(), signal); }
      catch (cause) { await sub.unsubscribe(); throw cause; }
    }),
    disableBrowser: () => action(async signal => {
      if (connected) await client.disconnect("browser", signal, connected);
      signal.throwIfAborted();
      await browser.disable();
    }),
    linkTelegram: () => action(async signal => {
      const url = await client.telegramLink(signal);
      signal.throwIfAborted();
      if (owns()) setTelegramUrl(url);
    }),
    refreshTelegram: () => action(async () => {}),
    confirmTelegram: () => action(async signal => {
      await client.confirmTelegram(signal);
      signal.throwIfAborted();
      if (owns()) setTelegramUrl(null);
    }),
    disconnectTelegram: () => action(async signal => {
      await client.disconnect("telegram", signal);
      signal.throwIfAborted();
      if (owns()) setTelegramUrl(null);
    }),
    changeCategories: (categories: NotificationCategory[]) => preferences({ categories }),
    changeExcludedEvents: (excludedEventTypes: NotificationEventType[], expectedVersion?: number) => preferences({ excludedEventTypes }, expectedVersion),
  };
}
export type NotificationsState = ReturnType<typeof useNotifications>;
