import { useEffect, useRef, useState } from "react";
import { getKlipyPage, registerKlipyShare } from "../data/klipy-api";
import { KlipyError, type KlipyItem } from "../model/klipy-types";

type State = { scope: string; items: KlipyItem[]; next: string; loading: boolean; error: KlipyError | null;
  failedCursor: string; blockedUntil: number };
export function useKlipyGallery(key: string, query: string, locale: "ru" | "en") {
  const configured = Boolean(key.trim()), scope = JSON.stringify([key, query, locale]);
  const empty = (): State => ({ scope, items: [], next: "", loading: configured, error: null, failedCursor: "", blockedUntil: 0 });
  const [state, setState] = useState<State>(empty);
  const current = useRef(scope); current.current = scope;
  const request = useRef<AbortController | null>(null);
  const visible = state.scope === scope ? state : empty();
  function load(cursor: string) {
    if (!configured || request.current || current.current !== scope || visible.blockedUntil > Date.now()) return;
    const controller = new AbortController(); request.current = controller;
    setState(previous => ({ ...previous, scope, items: cursor && previous.scope === scope ? previous.items : [],
      next: cursor ? previous.next : "", loading: true, error: null, blockedUntil: 0 }));
    void getKlipyPage({ key, query, locale, cursor, signal: controller.signal }).then(page => {
      if (controller.signal.aborted || current.current !== scope) return;
      if (cursor && page.next === cursor) throw new KlipyError("response");
      setState(previous => ({ ...previous, items: cursor ? [...previous.items, ...page.items] : page.items,
        next: page.next, loading: false, error: null, failedCursor: "" }));
    }).catch(error => {
      if (controller.signal.aborted || current.current !== scope) return;
      const failure = error instanceof KlipyError ? error : new KlipyError("network");
      setState(previous => ({ ...previous, loading: false, error: failure, failedCursor: cursor,
        blockedUntil: failure.kind === "rate" ? Date.now() + failure.retryAfter * 1000 : 0 }));
    }).finally(() => { if (request.current === controller) request.current = null; });
  }
  useEffect(() => {
    setState(empty());
    const timer = query.trim() ? setTimeout(() => load(""), 300) : undefined;
    if (!query.trim() && configured) load("");
    return () => {
      clearTimeout(timer); request.current?.abort(); request.current = null;
    };
  }, [scope]);
  useEffect(() => {
    if (!visible.blockedUntil) return;
    const timer = setTimeout(() => setState(previous => previous.scope === scope ? { ...previous, blockedUntil: 0 } : previous),
      Math.max(0, visible.blockedUntil - Date.now()));
    return () => clearTimeout(timer);
  }, [scope, visible.blockedUntil]);
  function share(item: KlipyItem) {
    if (!configured || current.current !== scope) return;
    // A selection outlives the picker; the API's request deadline bounds reporting.
    const controller = new AbortController();
    void registerKlipyShare({ key, query, id: item.appearance.id, signal: controller.signal })
      .catch(() => { /* Reporting failure does not undo the user's selected GIF. */ });
  }
  return { ...visible, configured, more: () => { if (!visible.loading && visible.next) load(visible.next); },
    retry: () => { if (!visible.loading) load(visible.failedCursor); }, share };
}
