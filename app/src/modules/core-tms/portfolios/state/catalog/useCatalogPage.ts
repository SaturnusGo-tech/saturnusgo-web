import { useCallback, useEffect, useRef, useState } from "react";
import { toTmsMutationFailure } from "../../../../../core/tms/errors/mutation-failure";
import type { CatalogPage } from "../../model/portfolio";
import { appendPage, emptyPage, type PageState } from "./page-state";

export function useCatalogPage<T extends { id: string }>(scope: string, enabled: boolean, load: (cursor: string | null, signal: AbortSignal) => Promise<CatalogPage<T>>) {
  const [state, setState] = useState<PageState<T>>(() => emptyPage(scope));
  const [revision, setRevision] = useState(0);
  const active = useRef<AbortController | null>(null);
  const scopeRef = useRef(scope);
  scopeRef.current = scope;
  const loadRef = useRef(load);
  loadRef.current = load;

  const request = useCallback(async (cursor: string | null) => {
    if (!enabled) return;
    active.current?.abort();
    const controller = new AbortController();
    active.current = controller;
    setState((previous) => previous.scope === scope
      ? { ...previous, loading: true, error: null } : emptyPage(scope));
    try {
      const page = await loadRef.current(cursor, controller.signal);
      if (controller.signal.aborted || scopeRef.current !== scope) return;
      setState((previous) => ({ scope, loading: false, error: null,
        items: cursor ? appendPage(previous.items, page.items) : page.items, cursor: page.nextCursor }));
    } catch (error) {
      if (!controller.signal.aborted && scopeRef.current === scope) {
        setState((previous) => ({ ...previous, loading: false, error: toTmsMutationFailure(error) }));
      }
    }
  }, [enabled, scope]);

  useEffect(() => {
    if (enabled) void request(null);
    else setState(emptyPage(scope, false));
    return () => active.current?.abort();
  }, [enabled, scope, revision, request]);

  const visible = state.scope === scope ? state : emptyPage<T>(scope, enabled);
  return { ...visible, reload: () => setRevision((value) => value + 1),
    loadMore: () => { if (visible.cursor && !visible.loading) void request(visible.cursor); } };
}
