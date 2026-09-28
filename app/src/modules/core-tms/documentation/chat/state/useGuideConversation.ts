import { useEffect, useMemo, useRef, useState } from "react";
import type { TmsHttpClient } from "../../../../../core/tms/transport/http";
import { guideHistoryApi } from "../history/data/history-api";
import { useChatResource } from "../history/state/useChatResource";
import { useChatTurn } from "../history/application/useChatTurn";
import { turnMessages } from "../history/model/history";
import type { GuideChatRoute } from "../navigation/chat-link";
import type { GuideMessage } from "../model/conversation";

type Scope = { http: TmsHttpClient | null; workspaceId: string; subject: string; locale: "ru" | "en"; enabled: boolean;
  route?: GuideChatRoute; routeReady?: boolean; onOpen?(route: Partial<GuideChatRoute>, replace?: boolean): void };
const blank: GuideChatRoute = { chatId: null, turnId: null, shareId: null };
export function useGuideConversation(scope: Scope) {
  const owner = JSON.stringify([scope.workspaceId, scope.subject]);
  const api = useMemo(() => scope.http && scope.workspaceId ? guideHistoryApi(scope.http, scope.workspaceId) : null, [scope.http, scope.workspaceId]);
  const [localRoute, setLocalRoute] = useState(blank), [draftVersion, setDraftVersion] = useState(0);
  const [drafts, setDrafts] = useState<Record<string, string>>({}), [historyRevision, setHistoryRevision] = useState(0);
  const route = scope.route ?? localRoute, selection = route.shareId ?? route.chatId ?? `draft-${draftVersion}`;
  const scopeKey = `${owner}:${scope.locale}`, draftKey = `${owner}:${selection}`;
  const draft = drafts[draftKey] ?? "", draftRef = useRef(draft); draftRef.current = draft;
  const resource = useChatResource(api, owner, route, scope.routeReady !== false && scope.enabled);
  const changed = () => setHistoryRevision(value => value + 1);
  function setDraft(value: string) { draftRef.current = value; setDrafts(old => ({ ...old, [draftKey]: value })); }
  function open(next: Partial<GuideChatRoute>, replace = false) {
    if (scope.onOpen) scope.onOpen(next, replace); else setLocalRoute({ ...blank, ...next });
  }
  const turn = useChatTurn({ api, owner, enabled: scope.enabled && !route.shareId,
    locale: resource.chat?.locale ?? scope.locale, chat: resource.chat, apply: resource.apply, changed,
    created(chat) { resource.apply(chat); open({ chatId: chat.id }, true); changed(); },
    restoreDraft(value) { if (!draftRef.current) setDraft(value); } });
  const restored = useRef(new Set<string>());
  useEffect(() => {
    const last = resource.turns[resource.turns.length - 1];
    if (!last || turn.busy || resource.loading || !["failed", "cancelled"].includes(last.state)) return;
    const key = `${owner}:${resource.chat?.id}:${last.id}`;
    if (restored.current.has(key)) return;
    restored.current.add(key);
    if (!draftRef.current) setDraft(last.question);
  }, [owner, resource.chat?.id, resource.turns, resource.loading, turn.busy]);
  const previous = useRef(selection);
  useEffect(() => {
    if (previous.current === selection) return;
    previous.current = selection;
    if (turn.activeChatId() !== route.chatId) { void turn.cancel(); turn.reset(); }
  }, [selection]);
  useEffect(() => { restored.current.clear(); setDrafts({}); setLocalRoute(blank); setDraftVersion(value => value + 1); }, [owner]);
  function newChat(prefill = "") {
    void turn.cancel(); turn.reset();
    const version = draftVersion + 1; setDraftVersion(version);
    setDrafts(old => ({ ...old, [`${owner}:draft-${version}`]: prefill }));
    open({});
  }
  async function send(override?: string) {
    const content = (override ?? draftRef.current).trim();
    if (!scope.enabled || !api || !content || content.length > 8000 || turn.busy || resource.chat?.pendingTurnId || resource.loading || resource.error || route.shareId) return;
    setDraft(""); await turn.send(content);
  }
  async function cancel() {
    if (turn.busy) { await turn.cancel(); return; }
    const chat = resource.chat, id = chat?.pendingTurnId;
    if (!api || !chat || !id) return;
    try {
      const stopped = await api.cancel(chat.id, id), updated = await api.chat(chat.id);
      resource.apply(updated, stopped); changed();
      if (stopped.state !== "completed" && !draftRef.current) setDraft(stopped.question);
    } catch { resource.refresh(); }
  }
  const locale = resource.chat?.locale ?? resource.shared?.locale ?? scope.locale;
  const messages: GuideMessage[] = resource.shared ? [
    { role: "user", content: resource.shared.question, id: `${resource.shared.id}:question`, locale },
    { role: "assistant", content: resource.shared.answer.answer, citations: resource.shared.answer.citations,
      visuals: resource.shared.answer.visuals, id: resource.shared.id, locale },
  ] : turnMessages(resource.turns, locale);
  if (turn.question && !resource.turns.some(value => value.id === turn.question!.id)) {
    messages.push({ role: "user", content: turn.question.content, id: `${turn.question.id}:question`, locale });
  }
  return { draft, setDraft, messages, partialText: turn.partialText, busy: turn.busy || Boolean(resource.chat?.pendingTurnId),
    error: turn.error, dismissError: turn.dismissError, notice: turn.notice, send, cancel, newChat: () => newChat(),
    conversationId: draftKey, scopeKey, enabled: scope.enabled && Boolean(api), locale: scope.locale, contentLocale: locale,
    workspaceId: scope.workspaceId, retry: () => void send(), api, owner, historyRevision, refreshHistory: changed,
    chatId: resource.chat?.id ?? route.chatId, title: resource.chat?.title ?? "", readonly: Boolean(route.shareId),
    loading: resource.loading, loadError: resource.error, refresh: resource.refresh, cursor: resource.cursor, loadEarlier: resource.loadEarlier,
    targetTurnId: route.turnId, selectChat: (id: string) => open({ chatId: id }), startOwn: () => newChat(resource.shared?.question ?? "") };
}
