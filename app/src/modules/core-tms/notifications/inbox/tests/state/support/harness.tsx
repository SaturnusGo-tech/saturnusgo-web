import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { useNotificationInbox } from "../../../application/useNotificationInbox";
import type { NotificationInboxClient, InboxPage } from "../../../../domain/inbox";
import type { NotificationItem } from "../../../../domain/notifications";

Object.assign(globalThis, { React });
export const flush = () => new Promise(resolve => setTimeout(resolve, 0));
export const item = (id: string, read = false): NotificationItem => ({ id, read, title: id, body: "", category: "runs",
  action: "run.created", createdAt: "2026-09-28T12:00:00Z", url: "/testcases/umbrella-home/work/?workspaceId=w&view=runs" } as NotificationItem);
export const page = (ids: string[], next: string | null = null, unreadCount = ids.length): InboxPage => ({ items: ids.map(id => item(id)), next, unreadCount });
export function inboxFixture() {
  const lists: { cursor: string | null; signal: AbortSignal; resolve(page: InboxPage): void; reject(error: Error): void }[] = [];
  const commands: { kind: string; id?: string; signal: AbortSignal; resolve(): void; reject(error: Error): void }[] = [];
  const command = (kind: string, signal: AbortSignal, id?: string) => new Promise<void>((resolve, reject) => commands.push({ kind, id, signal, resolve, reject }));
  const client: NotificationInboxClient = {
    list: (cursor, signal) => new Promise((resolve, reject) => lists.push({ cursor, signal, resolve, reject })),
    read: (id, signal) => command("read", signal, id), readAll: signal => command("readAll", signal), archiveRead: signal => command("archiveRead", signal),
  };
  return { client, lists, commands };
}
export function inboxHarness(fixture = inboxFixture()) {
  let client = fixture.client, enabled = true, state!: ReturnType<typeof useNotificationInbox>, tree!: ReactTestRenderer;
  function Hook() { state = useNotificationInbox(client, enabled); return null; }
  act(() => { tree = create(<Hook />); });
  return { fixture, get: () => state,
    run: (fn: () => void) => act(async () => { fn(); await flush(); }),
    update: (next: NotificationInboxClient, connected = true) => act(async () => { client = next; enabled = connected; tree.update(<Hook />); await flush(); }),
    resolve: (index: number, value: InboxPage) => act(async () => { fixture.lists[index].resolve(value); await flush(); }),
    unmount: () => act(() => tree.unmount()) };
}
