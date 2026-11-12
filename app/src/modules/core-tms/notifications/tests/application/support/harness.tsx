import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { useNotifications } from "../../../application/useNotifications";
import type { BrowserNotificationPort, NotificationClient, NotificationSettings } from "../../../domain/notifications";
Object.assign(globalThis, { React });
export const flush = () => new Promise(resolve => setTimeout(resolve, 0));
export const browser: BrowserNotificationPort = {
  permission: () => "unsupported", fingerprint: async () => null,
  enable: async () => { throw new Error("unexpected browser enable"); }, disable: async () => {},
};
export function snapshot(changes: Record<string, unknown> = {}): NotificationSettings {
  return { identityId: "member-a", version: 4, locale: "en", categories: ["runs", "cases"],
    excludedEventTypes: ["test_case.created"], availableEvents: [
      { type: "test_case.created", category: "cases", labelRu: "Создан тест-кейс", labelEn: "Test case created" },
      { type: "run.complete", category: "runs", labelRu: "Прогон завершён", labelEn: "Run completed" },
    ], browsers: [], telegramConnected: false, telegramUsername: null, vapidPublicKey: null, pendingTelegram: null,
    ...changes } as NotificationSettings;
}
export function deferred<T>() {
  let resolve!: (value: T) => void, reject!: (reason: unknown) => void;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
export async function mount(client: NotificationClient, port = browser) {
  let state!: ReturnType<typeof useNotifications>, tree!: ReactTestRenderer;
  function Hook({ value, locale = "en" }: { value: NotificationClient; locale?: "ru" | "en" }) {
    state = useNotifications(value, locale, port); return null;
  }
  await act(async () => { tree = create(<Hook value={client} />); await flush(); });
  return { state: () => state, unmount: () => act(() => tree.unmount()),
    update: async (value: NotificationClient, locale: "ru" | "en" = "en") => {
      await act(async () => { tree.update(<Hook value={value} locale={locale} />); await flush(); });
    } };
}
export function fixture(initial = snapshot()) {
  let saved = initial;
  const writes: { value: unknown; version: unknown; signal: unknown }[] = [];
  const client = { settings: async () => saved,
    preferences: async (value: unknown, version: unknown, signal: unknown) => {
      writes.push({ value, version, signal });
      saved = { ...saved, ...(value as object), version: saved.version + 1 };
    } } as unknown as NotificationClient;
  return { client, writes, saved: () => saved };
}
