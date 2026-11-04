import { useEffect, useRef } from "react";
import { useTmsSession } from "../../../auth/presentation/session/TmsSessionContext";
import { isFalconDesktop } from "../../../auth/sign-in/domain/desktop-mode";
import { visitWorkspace } from "../../../state/navigation/browser/workspace-history";
import type { NotificationItem } from "../../domain/notifications";
import { notificationHref } from "../model/presentation";
import { createAchievementDelivery } from "./achievement-delivery";

export function useNativeAchievements(workspaceId: string, items: readonly NotificationItem[], ready: boolean) {
  const { subject } = useTmsSession();
  const key = subject && workspaceId ? `falcon.achievement-notices:${encodeURIComponent(subject)}:${encodeURIComponent(workspaceId)}` : "";
  const scope = useRef<{ key: string; delivery: ReturnType<typeof createAchievementDelivery>; notices: Set<Notification> } | null>(null);
  useEffect(() => {
    if (!key || !isFalconDesktop() || !("Notification" in window)) return;
    let persisted: string[] = [];
    try {
      const parsed: unknown = JSON.parse(window.localStorage.getItem(key) ?? "[]");
      if (Array.isArray(parsed)) persisted = parsed.filter((value): value is string => typeof value === "string").slice(-300);
    } catch { /* Session-local deduplication still works when browser storage is unavailable. */ }
    const context = { key, delivery: createAchievementDelivery(Date.now(), persisted), notices: new Set<Notification>() };
    scope.current = context;
    return () => { for (const notice of context.notices) notice.close(); if (scope.current === context) scope.current = null; };
  }, [key]);
  useEffect(() => {
    const context = scope.current;
    if (!ready || !context || context.key !== key) return;
    const fresh = new Set(context.delivery.consume(items));
    try { window.localStorage.setItem(key, JSON.stringify(context.delivery.seen())); } catch { /* No storage is required to display notifications. */ }
    if (Notification.permission !== "granted") return;
    for (const item of items.filter(value => fresh.has(value.id))) {
      const href = notificationHref(item.url, window.location.href, workspaceId);
      if (!href) continue;
      try {
        const notice = new Notification(item.title, { body: item.body, tag: item.tag, icon: "/falcon/falcon-mark-light.png" });
        context.notices.add(notice);
        notice.onclose = () => context.notices.delete(notice);
        notice.onclick = () => {
          if (scope.current === context) { window.focus(); visitWorkspace(href); }
          notice.close();
        };
      } catch { /* The operating system may revoke permission while the application is open. */ }
    }
  }, [items, ready, key, workspaceId]);
}
