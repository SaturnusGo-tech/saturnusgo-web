import { documentationChatId, documentationLink } from "../../navigation/documentation-link";

export type GuideChatRoute = { chatId: string | null; turnId: string | null; shareId: string | null };
const uuid = (value: string | null | undefined) => value && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value) ? value : null;
export function readGuideChatRoute(href: string): GuideChatRoute {
  const query = new URL(href).searchParams;
  const empty = { chatId: null, turnId: null, shareId: null };
  if (query.get("view") !== "help" || query.get("article") !== documentationChatId) return empty;
  if (query.has("share") && query.has("chat")) return empty;
  const shareId = uuid(query.get("share")), chatId = uuid(query.get("chat"));
  return { chatId, turnId: chatId ? uuid(query.get("message")) : null, shareId };
}
export function guideChatLink(href: string, route: Partial<GuideChatRoute> = {}) {
  const url = new URL(documentationLink(href, documentationChatId), href);
  if (uuid(route.shareId)) { url.searchParams.set("share", route.shareId!); url.searchParams.delete("projectId"); }
  else if (uuid(route.chatId)) {
    url.searchParams.set("chat", route.chatId!);
    if (uuid(route.turnId)) url.searchParams.set("message", route.turnId!);
  }
  return `${url.pathname}${url.search}`;
}
export function preserveGuideChatRoute(href: string, next: URL) {
  if (next.searchParams.get("view") !== "help" || next.searchParams.get("article") !== documentationChatId) return;
  const route = readGuideChatRoute(href);
  if (route.shareId) { next.searchParams.set("share", route.shareId); next.searchParams.delete("projectId"); }
  else if (route.chatId) {
    next.searchParams.set("chat", route.chatId);
    if (route.turnId) next.searchParams.set("message", route.turnId);
  }
}
