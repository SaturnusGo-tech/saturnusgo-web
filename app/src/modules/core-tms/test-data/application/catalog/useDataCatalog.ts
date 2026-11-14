import { useCallback, useEffect, useRef, useState } from "react";
import type { ResourcePage } from "../../model/resources/resource";
type Loader<T> = (search: string, cursor: string | null, signal: AbortSignal) => Promise<ResourcePage<T>>;
export function useDataCatalog<T extends { readonly id: string }>(load: Loader<T> | null) {
  const [search, setSearch] = useState(""), [revision, setRevision] = useState(0);
  const [state, setState] = useState({ items: [] as readonly T[], cursor: null as string | null, loading: Boolean(load), pending: false, error: false });
  const owner = useRef<AbortController | null>(null), busy = useRef(false);
  const query = useRef({ load, search, revision });
  const current = query.current.load === load && query.current.search === search && query.current.revision === revision;
  useEffect(() => {
    query.current = { load, search, revision };
    const controller = new AbortController(); owner.current?.abort(); owner.current = controller; busy.current = false;
    setState({ items: [], cursor: null, loading: Boolean(load), pending: false, error: false });
    const timer = load && setTimeout(() => {
      load(search.trim(), null, controller.signal).then(page => {
        if (!controller.signal.aborted) setState({ items: page.items, cursor: page.cursor, loading: false, pending: false, error: false });
      }).catch(() => { if (!controller.signal.aborted) setState({ items: [], cursor: null, loading: false, pending: false, error: true }); });
    }, search ? 180 : 0);
    return () => { if (timer) clearTimeout(timer); controller.abort(); };
  }, [load, search, revision]);
  async function more() {
    if (!current || !load || !state.cursor || state.loading || busy.current) return;
    busy.current = true;
    const controller = owner.current;
    if (!controller) return;
    setState(previous => ({ ...previous, pending: true, error: false }));
    try {
      const page = await load(search.trim(), state.cursor, controller.signal);
      if (!controller.signal.aborted) setState(previous => ({ ...previous, pending: false, cursor: page.cursor,
        items: [...new Map([...previous.items, ...page.items].map(item => [item.id, item])).values()] }));
    } catch { if (!controller.signal.aborted) setState(previous => ({ ...previous, pending: false, error: true })); }
    finally { if (!controller.signal.aborted) busy.current = false; }
  }
  const visible = current ? state : { items: [] as readonly T[], cursor: null, loading: Boolean(load), pending: false, error: false };
  return { ...visible, search, setSearch, more, refresh: useCallback(() => setRevision(value => value + 1), []) };
}
