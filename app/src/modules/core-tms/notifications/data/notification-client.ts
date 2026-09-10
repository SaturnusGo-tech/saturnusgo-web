import type { TmsHttpClient } from "../../../../core/tms/transport/http";
import type { components } from "../../../../core/tms/generated/tms-api";
import type { NotificationClient } from "../domain/notifications";
type Schemas = components["schemas"];
export function notificationClient(http: TmsHttpClient, workspaceId: string): NotificationClient {
  const path = (suffix = "") => `/notifications${suffix}?${new URLSearchParams({ workspaceId })}`;
  return {
    settings: async (signal) =>
      (await http.get<Schemas["NotificationSettingsResponse"]>(path("/settings"), signal)).data,
    inbox: async (cursor, signal) => {
      const p = await http.get<Schemas["NotificationPage"]>(
        path() + (cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""),
        signal,
      );
      return { items: p.data, next: p.meta.nextCursor };
    },
    preferences: async (categories, locale, version, signal) => {
      await http.mutateResource(
        path("/settings"),
        "PATCH",
        { categories, locale },
        { ifMatch: `"notification-v${version}"`, signal },
      );
    },
    browser: async (subscription, signal) =>
      (
        await http.mutate<{ id: string }>(
          path("/browser"),
          "POST",
          { endpoint: subscription.endpoint, keys: subscription.keys },
          signal,
        )
      ).id,
    telegramLink: async (signal) =>
      (await http.mutate<{ url: string }>(path("/telegram/link"), "POST", undefined, signal)).url,
    confirmTelegram: async (signal) => {
      await http.mutate(path("/telegram/confirm"), "POST", undefined, signal);
    },
    disconnect: async (channel, signal, destinationId) => {
      await http.mutate(path("/disconnect"), "POST", { channel, destinationId }, signal);
    },
    read: async (id, signal) => {
      await http.mutate(path(`/${encodeURIComponent(id)}/read`), "POST", undefined, signal);
    },
  };
}
