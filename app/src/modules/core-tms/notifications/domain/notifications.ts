import type { components } from "../../../../core/tms/generated/tms-api";
type Schemas = components["schemas"];
export type NotificationItem = Schemas["Notification"];
export type NotificationSettings = Schemas["NotificationSettings"];
export type NotificationCategory = Schemas["NotificationCategory"];
export interface NotificationClient {
  settings(signal: AbortSignal): Promise<NotificationSettings>;
  inbox(
    cursor: string | null,
    signal: AbortSignal,
  ): Promise<{ items: NotificationItem[]; next: string | null }>;
  preferences(
    categories: NotificationCategory[],
    locale: "ru" | "en",
    version: number,
    signal: AbortSignal,
  ): Promise<void>;
  browser(subscription: PushSubscriptionJSON, signal: AbortSignal): Promise<string>;
  telegramLink(signal: AbortSignal): Promise<string>;
  confirmTelegram(signal: AbortSignal): Promise<void>;
  disconnect(channel: "browser" | "telegram", signal: AbortSignal, id?: string): Promise<void>;
  read(id: string, signal: AbortSignal): Promise<void>;
}

export interface BrowserNotificationPort {
  permission(): NotificationPermission | "unsupported";
  enable(publicKey: string): Promise<{ toJSON(): PushSubscriptionJSON; unsubscribe(): Promise<boolean> }>;
  disable(): Promise<void>;
  fingerprint(): Promise<string | null>;
}
