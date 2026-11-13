'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { TeamMember, TeamPort } from '../domain/team';
type State = { port: TeamPort; query: string; items: readonly TeamMember[]; nextCursor: string | null;
  loading: boolean; loadingMore: boolean; error: unknown };
export function useTeam(port: TeamPort, query: string) {
  const [reload, setReload] = useState(0);
  const [state, setState] = useState<State>({ port, query, items: [], nextCursor: null, loading: true, loadingMore: false, error: null });
  const request = useRef<{controller: AbortController; port: TeamPort; query: string; more: boolean} | null>(null);
  useEffect(() => {
    const run = {controller: new AbortController(), port, query, more: false}; request.current = run;
    setState({port, query, items: [], nextCursor: null, loading: true, loadingMore: false, error: null});
    void port.list(query, null, run.controller.signal).then(page => {
      if (!run.controller.signal.aborted && request.current === run)
        setState({port, query, ...page, loading: false, loadingMore: false, error: null});
    }).catch(error => {
      if (!run.controller.signal.aborted && request.current === run) setState(value => ({...value, loading: false, error}));
    });
    return () => run.controller.abort();
  }, [port, query, reload]);
  const current = state.port === port && state.query === query ? state :
    {port, query, items: [], nextCursor: null, loading: true, loadingMore: false, error: null};
  const loadMore = useCallback(async () => {
    const run = request.current;
    if (!run || run.port !== port || run.query !== query || run.more || current.loading || !current.nextCursor) return;
    run.more = true; setState(value => ({...value, loadingMore: true, error: null}));
    try {
      const page = await port.list(query, current.nextCursor, run.controller.signal);
      if (!run.controller.signal.aborted && request.current === run) setState(value => ({...value,
        items: [...new Map([...value.items, ...page.items].map(item => [item.id, item])).values()], nextCursor: page.nextCursor, loadingMore: false}));
    } catch (error) {
      if (!run.controller.signal.aborted && request.current === run) setState(value => ({...value, loadingMore: false, error}));
    } finally { run.more = false; }
  }, [port, query, current.loading, current.nextCursor]);
  return {...current, loadMore, retry: () => setReload(value => value + 1)};
}
