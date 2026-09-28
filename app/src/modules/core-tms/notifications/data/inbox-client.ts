import type { TmsHttpClient } from "../../../../core/tms/transport/http";
import type { components } from "../../../../core/tms/generated/tms-api";
import type { NotificationInboxClient } from "../domain/inbox";

export function notificationInboxClient(http: TmsHttpClient, workspaceId: string, locale: "ru" | "en"): NotificationInboxClient {
  const path = (suffix = "") => `/notifications${suffix}?${new URLSearchParams({ workspaceId })}`;
  const command = async (suffix: string, signal: AbortSignal) => { await http.mutate(path(suffix), "POST", undefined, signal); };
  return {
    async list(cursor, signal) {
      const page = await http.get<components["schemas"]["NotificationPage"]>(
        path() + `&locale=${locale}` + (cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""), signal);
      return { items: page.data, next: page.meta.nextCursor, unreadCount: page.meta.unreadCount };
    },
    read: (id, signal) => command(`/${encodeURIComponent(id)}/read`, signal),
    readAll: signal => command("/read-all", signal),
    archiveRead: signal => command("/archive-read", signal),
  };
}
