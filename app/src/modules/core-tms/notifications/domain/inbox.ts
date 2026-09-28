import type { NotificationItem } from "./notifications";

export type InboxPage = { items: NotificationItem[]; next: string | null; unreadCount: number };
export interface NotificationInboxClient {
  list(cursor: string | null, signal: AbortSignal): Promise<InboxPage>;
  read(id: string, signal: AbortSignal): Promise<void>;
  readAll(signal: AbortSignal): Promise<void>;
  archiveRead(signal: AbortSignal): Promise<void>;
}
