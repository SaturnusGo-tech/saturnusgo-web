import { useCallback, useEffect, useRef, useState } from "react";
import type { CustomFieldPage } from "../../model/custom-field";
type Loader<T> = (query: string, cursor: string | null, signal: AbortSignal) => Promise<CustomFieldPage<T>>;
export function useFieldPage<T extends { id: string }>(load: Loader<T>, enabled = true) {
  const [search, setSearch] = useState(""); const [revision, setRevision] = useState(0);
  const [state, setState] = useState({ items: [] as readonly T[], cursor: null as string | null, loading: enabled, pending: false, failure: null as unknown });
  const current = useRef<AbortController | null>(null); const busy = useRef(false);
  useEffect(() => {
    current.current?.abort(); const controller = new AbortController(); current.current = controller; busy.current = false;
    setState({ items: [], cursor: null, loading: enabled, pending: false, failure: null });
    if (!enabled) return () => controller.abort();
    const timer = setTimeout(() => {
      load(search.trim(), null, controller.signal).then(page => {
        if (!controller.signal.aborted) setState({ items: page.items, cursor: page.nextCursor, loading: false, pending: false, failure: null });
      }).catch(failure => { if (!controller.signal.aborted) setState({ items: [], cursor: null, loading: false, pending: false, failure }); });
    }, search ? 180 : 0);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [load, enabled, search, revision]);
  async function more() {
    if (!enabled || state.loading || state.pending || busy.current || !state.cursor) return;
    busy.current = true; const controller = new AbortController(); current.current?.abort(); current.current = controller;
    setState(value => ({ ...value, pending: true, failure: null }));
    try {
      const page = await load(search.trim(), state.cursor, controller.signal);
      if (!controller.signal.aborted) setState(value => ({ ...value, pending: false, cursor: page.nextCursor,
        items: [...new Map([...value.items, ...page.items].map(item => [item.id, item])).values()] }));
    } catch (failure) { if (!controller.signal.aborted) setState(value => ({ ...value, pending: false, failure })); }
    finally { if (!controller.signal.aborted) busy.current = false; }
  }
  useEffect(() => () => current.current?.abort(), []);
  return { ...state, search, setSearch, more, refresh: useCallback(() => setRevision(value => value + 1), []) };
}
