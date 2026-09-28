import { useCallback, useEffect, useRef, useState } from "react";
import type { InboxPage, NotificationInboxClient } from "../../domain/inbox";

type Resource = InboxPage & { owner: NotificationInboxClient; cursorAfter: string | null; loading: boolean; busy: boolean; error: boolean };
type LoadMode = "refresh" | "reset" | "more";
type Context = { client: NotificationInboxClient; life: AbortController; load?: AbortController; epoch: number;
  queue: Promise<void>; pending: number; retry: (() => Promise<void>) | null };
const empty = (owner: NotificationInboxClient): Resource => ({ owner, items: [], next: null, cursorAfter: null, unreadCount: 0, loading: true, busy: false, error: false });

export function useNotificationInbox(client: NotificationInboxClient, enabled: boolean) {
  const [resource, setResource] = useState(() => empty(client));
  const scope = useRef<Context | undefined>(undefined), state = useRef(resource), latest = useRef({ client, enabled });
  state.current = resource; latest.current = { client, enabled };
  const active = (context: Context) => scope.current === context && latest.current.client === context.client
    && latest.current.enabled && !context.life.signal.aborted;
  const load = useCallback(async (mode: LoadMode = "refresh") => {
    const context = scope.current;
    if (!context || !active(context) || context.pending) return;
    const previous = state.current.owner === client ? state.current : empty(client);
    const cursor = mode === "more" ? previous.next : null;
    if (mode === "more" && !cursor) return;
    context.load?.abort(); const request = new AbortController(); context.load = request;
    const epoch = ++context.epoch;
    setResource(current => current.owner === client ? { ...current, busy: true, error: false } : current);
    try {
      const page = await client.list(cursor, request.signal);
      if (!active(context) || request.signal.aborted || epoch !== context.epoch) return;
      context.retry = null;
      setResource(current => {
        if (current.owner !== client) return current;
        const ids = new Set(page.items.map(item => item.id));
        const overlap = current.items.some(item => ids.has(item.id));
        const replace = mode === "reset" || (mode === "refresh" && !page.next);
        const remaining = current.items.filter(item => !ids.has(item.id));
        const insertion = current.items.slice(0, current.items.findIndex(item => item.id === current.cursorAfter) + 1)
          .filter(item => !ids.has(item.id)).length;
        const items = replace ? page.items : mode === "more"
          ? [...remaining.slice(0, insertion), ...page.items, ...remaining.slice(insertion)]
          : [...page.items, ...remaining];
        // Retain the cursor behind already-loaded pages while the refreshed first page overlaps them.
        const retainCursor = mode === "refresh" && page.next && overlap;
        const next = retainCursor ? current.next : page.next;
        const cursorAfter = retainCursor ? current.cursorAfter : page.items.slice(-1)[0]?.id ?? null;
        return { ...current, items, next, cursorAfter, unreadCount: page.unreadCount, loading: false, busy: false, error: false };
      });
    } catch {
      if (active(context) && !request.signal.aborted && epoch === context.epoch) {
        context.retry = () => load(mode);
        setResource(current => current.owner === client ? { ...current, loading: false, busy: false, error: true } : current);
      }
    }
  }, [client]);
  useEffect(() => {
    const context: Context = { client, life: new AbortController(), epoch: 0, queue: Promise.resolve(), pending: 0, retry: null };
    scope.current = context; setResource(empty(client));
    if (enabled) void load("reset"); else setResource({ ...empty(client), loading: false });
    return () => { context.life.abort(); context.load?.abort(); };
  }, [client, enabled, load]);

  const command = (operation: (signal: AbortSignal) => Promise<void>, reconcile: (current: Resource) => Resource) => {
    const context = scope.current;
    if (!context || !active(context)) return Promise.resolve();
    context.load?.abort(); ++context.epoch; if (!context.pending) context.retry = null; context.pending++;
    setResource(current => current.owner === client ? { ...current, busy: true, error: false } : current);
    const queued = context.queue.then(async () => {
      if (!active(context)) return;
      try {
        await operation(context.life.signal);
        if (active(context)) setResource(current => current.owner === client ? reconcile(current) : current);
      } catch {
        if (active(context)) {
          context.retry = () => command(operation, reconcile);
          setResource(current => current.owner === client ? { ...current, error: true } : current);
        }
      }
    });
    context.queue = queued;
    return queued.finally(async () => {
      context.pending--;
      if (!active(context) || context.pending) return;
      setResource(current => current.owner === client ? { ...current, loading: false, busy: false } : current);
      if (!context.retry) await load("refresh");
    });
  };
  return {
    ...(enabled && resource.owner === client ? resource : { ...empty(client), loading: enabled }),
    refresh: (reset = false) => load(reset ? "reset" : "refresh"), more: () => load("more"),
    retry: () => { const context = scope.current; const task = context?.retry; if (context) context.retry = null; return task ? task() : load("refresh"); },
    read: (id: string) => command(signal => client.read(id, signal), current => ({ ...current,
      unreadCount: Math.max(0, current.unreadCount - (current.items.some(item => item.id === id && !item.read) ? 1 : 0)),
      items: current.items.map(item => item.id === id ? { ...item, read: true } : item) })),
    readAll: () => command(signal => client.readAll(signal), current => ({ ...current, unreadCount: 0, items: current.items.map(item => ({ ...item, read: true })) })),
    archiveRead: () => command(signal => client.archiveRead(signal), current => ({ ...current,
      cursorAfter: current.items.slice(0, current.items.findIndex(item => item.id === current.cursorAfter) + 1).filter(item => !item.read).slice(-1)[0]?.id ?? null,
      items: current.items.filter(item => !item.read) })),
  };
}
export type NotificationInboxState = ReturnType<typeof useNotificationInbox>;
