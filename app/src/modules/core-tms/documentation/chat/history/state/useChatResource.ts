import { useEffect, useRef, useState } from "react";
import { TmsApiError } from "../../../../../../core/tms/transport/http";
import type { GuideHistoryApi } from "../model/api";
import { mergeTurns, type GuideChatSummary, type GuideChatTurn, type GuideSharedAnswer } from "../model/history";
import type { GuideChatRoute } from "../../navigation/chat-link";

type State = { key: string; chat: GuideChatSummary | null; turns: GuideChatTurn[]; shared: GuideSharedAnswer | null;
  loading: boolean; error: "missing" | "unavailable" | ""; cursor: string | null };
const empty = (key: string, loading = false): State => ({ key, chat: null, turns: [], shared: null, loading, error: "", cursor: null });
export function useChatResource(api: GuideHistoryApi | null, owner: string, route: GuideChatRoute, ready: boolean) {
  const key = `${owner}:${route.shareId ?? route.chatId ?? "new"}`;
  const [state, setState] = useState<State>(() => empty(key));
  const [revision, setRevision] = useState(0);
  const active = useRef<AbortController | null>(null), latest = useRef({ key, api, route }); latest.current = { key, api, route };
  async function load(cursor: string | null = null) {
    if (!api || !ready) { setState(previous => previous.key === key ? { ...previous, loading: false } : empty(key)); return; }
    if (!route.chatId && !route.shareId) { setState(empty(key)); return; }
    active.current?.abort(); const controller = new AbortController(); active.current = controller;
    setState(previous => ({ ...(previous.key === key ? previous : empty(key)), loading: true, error: "" }));
    try {
      if (route.shareId) {
        const shared = await api.shared(route.shareId, controller.signal);
        if (!controller.signal.aborted && latest.current.key === key) setState({ ...empty(key), shared });
        return;
      }
      const [chat, page] = await Promise.all([api.chat(route.chatId!, controller.signal), api.turns(route.chatId!, cursor, controller.signal)]);
      const target = route.turnId && !page.items.some(turn => turn.id === route.turnId)
        ? await api.turn(route.chatId!, route.turnId, controller.signal) : null;
      if (!controller.signal.aborted && latest.current.key === key) setState(previous => {
        const existing = previous.key === key ? previous.turns : [];
        const stale = previous.key === key && previous.chat && previous.chat.version > chat.version;
        const incoming = [...page.items, ...(target ? [target] : [])];
        return { ...empty(key), chat: stale ? previous.chat : chat,
          turns: mergeTurns(existing, stale ? incoming.filter(turn => !existing.some(saved => saved.id === turn.id)) : incoming),
          cursor: page.nextCursor };
      });
    } catch (problem) {
      if (!controller.signal.aborted && latest.current.key === key) setState(previous => ({ ...(previous.key === key ? previous : empty(key)),
        loading: false, error: problem instanceof TmsApiError && [403, 404].includes(problem.status) ? "missing" : "unavailable" }));
    }
  }
  useEffect(() => { void load(); return () => active.current?.abort(); }, [api, key, ready, revision, route.turnId]);
  useEffect(() => {
    if (!state.chat?.pendingTurnId || state.key !== key) return;
    const timer = setTimeout(() => setRevision(value => value + 1), 2500);
    return () => clearTimeout(timer);
  }, [state.chat?.pendingTurnId, state.loading, key, revision]);
  function apply(chat: GuideChatSummary, turn?: GuideChatTurn) {
    const nextKey = `${owner}:${chat.id}`;
    setState(previous => ({ ...(previous.key === nextKey ? previous : empty(nextKey)), chat,
      turns: turn ? mergeTurns(previous.key === nextKey ? previous.turns : [], [turn]) : previous.key === nextKey ? previous.turns : [], error: "" }));
  }
  const visible = state.key === key ? state : empty(key, Boolean(route.chatId || route.shareId));
  return { ...visible, apply, refresh: () => setRevision(value => value + 1),
    loadEarlier: () => { if (visible.cursor && !visible.loading) void load(visible.cursor); } };
}
