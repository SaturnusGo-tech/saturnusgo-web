"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AdministrationError } from "../../domain/administration";
import type { ResultPage } from "../../domain/administration";

export function useAdministrationList<T>(load: (search: string, cursor: string | null, signal: AbortSignal) => Promise<ResultPage<T>>) {
  const [search, setSearch] = useState("");
  const [version, setVersion] = useState(0);
  const [state, setState] = useState<{ loading: boolean; pending: boolean; items: readonly T[]; cursor: string | null; error: string | null }>(
    { loading: true, pending: false, items: [], cursor: null, error: null });
  const controller = useRef<AbortController | null>(null);
  const loadedSearch = useRef("");
  const loadedOwner = useRef<typeof load | null>(null);
  useEffect(() => {
    controller.current?.abort();
    const current = new AbortController(); controller.current = current;
    setState((currentState) => loadedOwner.current === load && loadedSearch.current === search && currentState.items.length
      ? { ...currentState, loading: false, pending: true, error: null }
      : { loading: true, pending: false, items: [], cursor: null, error: null });
    const timer = setTimeout(() => {
      load(search, null, current.signal).then((page) => {
        if (current.signal.aborted) return;
        loadedSearch.current = search; loadedOwner.current = load;
        setState({ loading: false, pending: false, items: page.items, cursor: page.nextCursor, error: null });
      }).catch((failure) => {
        if (!current.signal.aborted) setState((value) => {
          const error = failure instanceof AdministrationError ? failure.code : "SERVICE_UNAVAILABLE";
          const denied = ["SESSION_REQUIRED", "ACCESS_DENIED", "TENANT_UNAVAILABLE", "NOT_FOUND"].includes(error);
          return { ...value, loading: false, pending: false, items: denied ? [] : value.items, cursor: denied ? null : value.cursor, error };
        });
      });
    }, search ? 200 : 0);
    return () => { clearTimeout(timer); current.abort(); };
  }, [load, search, version]);
  async function more() {
    if (state.loading || state.pending || !state.cursor) return;
    const current = new AbortController(); controller.current?.abort(); controller.current = current;
    setState((value) => ({ ...value, pending: true, error: null }));
    try {
      const page = await load(loadedSearch.current, state.cursor, current.signal);
      if (!current.signal.aborted) setState((value) => ({ ...value, pending: false, items: [...value.items, ...page.items], cursor: page.nextCursor }));
    } catch (failure) {
      if (!current.signal.aborted) setState((value) => ({ ...value, pending: false,
        error: failure instanceof AdministrationError ? failure.code : "SERVICE_UNAVAILABLE" }));
    }
  }
  useEffect(() => () => controller.current?.abort(), []);
  return { ...state, search, setSearch, more, refresh: useCallback(() => setVersion((value) => value + 1), []) };
}
