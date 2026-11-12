import type { NotificationClient, NotificationSettings } from "../../notifications/domain/notifications";
import events from "./sample-events.json";
export function createNotificationPreviewClient(): NotificationClient {
  let value = { identityId: "preview", version: 1, locale: "en", categories: ["runs", "defects", "cases", "suites", "assignments", "access"],
    excludedEventTypes: [], availableEvents: events, browsers: [], telegramConnected: true, telegramUsername: "falcon_preview_bot", vapidPublicKey: null, pendingTelegram: null } as unknown as NotificationSettings;
  return { settings: async () => structuredClone(value),
    preferences: async (patch, version) => { if (version !== value.version) throw new Error("preview conflict"); value = { ...value, ...patch, version: value.version + 1 }; },
    browser: async () => "preview", disconnect: async channel => { if (channel === "telegram") value = { ...value, telegramConnected: false }; },
    telegramLink: async () => "https://t.me/falcon_preview_bot", confirmTelegram: async () => { value = { ...value, telegramConnected: true, pendingTelegram: null }; },
  };
}
