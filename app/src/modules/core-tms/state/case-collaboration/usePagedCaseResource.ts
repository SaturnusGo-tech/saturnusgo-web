import { useCallback, useEffect, useRef, useState } from "react";
import { TmsApiError } from "../../../../core/tms/transport/http";
import {
  appendUniqueCasePage, CasePaginationContractError, loadCasePageWindow,
  nextCasePageCursor, type CaseCursorPage,
} from "../../test-cases/collaboration/model/case-pagination";
import type {
  CaseCollaborationFailure, CaseCollaborationResource, CaseLinkedDefect,
} from "../../test-cases/collaboration/model/test-case-collaboration";
import { hasPendingYouTrackWork } from "../../test-cases/collaboration/model/test-case-collaboration";

export const DEFECT_TRANSITION_POLL_DELAYS = [2_000, 5_000, 10_000] as const;
type TimerApi = {
  set: (callback: () => void, delay: number) => unknown;
  clear: (timer: unknown) => void;
};
const defaultTimers: TimerApi = {
  set: (callback, delay) => setTimeout(callback, delay),
  clear: (timer) => clearTimeout(timer as ReturnType<typeof setTimeout>),
};

export function pendingDefectTransitionSignature(defects: readonly CaseLinkedDefect[]) {
  return defects.filter(hasPendingYouTrackWork)
    .map((defect) => `${defect.occurrence.id}:${!defect.youTrack
      ? `creation:${defect.youTrackCreation!.status}` : defect.youTrackTransition!.status}`)
    .join("|");
}

export function scheduleDefectTransitionPoll(
  attempt: number,
  refresh: () => void,
  timers: TimerApi = defaultTimers,
) {
  const delay = DEFECT_TRANSITION_POLL_DELAYS[attempt];
  if (delay === undefined) return () => {};
  const timer = timers.set(refresh, delay);
  return () => timers.clear(timer);
}

type ScopedResource<T> = CaseCollaborationResource<T> & { scope: string };
type Input<T> = {
  active: boolean;
  available: boolean;
  scopeKey: string;
  load: (cursor: string | null, signal: AbortSignal) => Promise<CaseCursorPage<T>>;
  keyOf: (item: T) => string;
};

const base = <T,>(scope: string, status: ScopedResource<T>["status"]): ScopedResource<T> => ({
  scope, status, items: [], hasMore: false, loadingMore: false, loadMoreFailed: false,
  refreshing: false, refreshFailed: false,
});

export function usePagedCaseResource<T>(input: Input<T>) {
  const [resource, setResource] = useState(() => base<T>("", "unavailable"));
  const [retryVersion, setRetryVersion] = useState(0);
  const currentScope = useRef(input.scopeKey);
  const epoch = useRef(0);
  const paging = useRef({
    scope: input.scopeKey, nextCursor: null as string | null,
    requested: new Set<string>(), loading: false, loadedPageCount: 0,
  });
  const moreController = useRef<AbortController | null>(null);
  const silentRefresh = useRef(false);
  const resourceRef = useRef(resource);
  resourceRef.current = resource;
  if (currentScope.current !== input.scopeKey) {
    currentScope.current = input.scopeKey;
    epoch.current += 1;
    paging.current = {
      scope: input.scopeKey, nextCursor: null, requested: new Set(), loading: false,
      loadedPageCount: 0,
    };
  }

  useEffect(() => () => moreController.current?.abort(), [input.scopeKey]);
  useEffect(() => {
    if (!input.available) { setResource(base(input.scopeKey, "unavailable")); return; }
    if (!input.active) return;
    const controller = new AbortController();
    const requestEpoch = epoch.current;
    const preserve = silentRefresh.current
      && resourceRef.current.scope === input.scopeKey
      && resourceRef.current.status === "ready";
    silentRefresh.current = false;
    const pageCount = preserve ? Math.max(1, paging.current.loadedPageCount) : 1;
    if (!preserve) paging.current = {
      scope: input.scopeKey, nextCursor: null, requested: new Set(),
      loading: false, loadedPageCount: 0,
    };
    setResource((current) => preserve
      ? { ...current, refreshing: true, refreshFailed: false }
      : base(input.scopeKey, "loading"));
    loadCasePageWindow(
      input.load, pageCount, input.keyOf, controller.signal,
    ).then((window) => {
      if (controller.signal.aborted || currentScope.current !== input.scopeKey
        || epoch.current !== requestEpoch) return;
      paging.current = {
        scope: input.scopeKey, nextCursor: window.nextCursor,
        requested: window.requestedCursors, loading: false,
        loadedPageCount: window.loadedPageCount,
      };
      setResource(() => ({
        ...base(input.scopeKey, "ready"),
        items: window.items,
        hasMore: window.nextCursor !== null,
      }));
    }).catch(() => {
      if (!controller.signal.aborted && currentScope.current === input.scopeKey
        && epoch.current === requestEpoch) setResource((current) => preserve
        ? { ...current, refreshing: false, refreshFailed: true }
        : base(input.scopeKey, "error"));
    });
    return () => controller.abort();
  }, [input.active, input.available, input.load, input.scopeKey, retryVersion]);

  const loadMore = useCallback(async () => {
    const pageState = paging.current;
    const cursor = pageState.nextCursor;
    if (!input.available || pageState.scope !== input.scopeKey || !cursor || pageState.loading) return;
    const requestEpoch = epoch.current;
    const controller = new AbortController();
    moreController.current?.abort();
    moreController.current = controller;
    pageState.loading = true;
    pageState.requested.add(cursor);
    setResource((current) => current.scope === input.scopeKey
      ? { ...current, loadingMore: true, loadMoreFailed: false } : current);
    try {
      const page = await input.load(cursor, controller.signal);
      if (controller.signal.aborted || currentScope.current !== input.scopeKey
        || epoch.current !== requestEpoch) return;
      const nextCursor = nextCasePageCursor(page.meta, pageState.requested);
      pageState.nextCursor = nextCursor;
      pageState.loadedPageCount += 1;
      setResource((current) => current.scope === input.scopeKey ? {
        ...current,
        items: appendUniqueCasePage(current.items, page.items, input.keyOf),
        hasMore: nextCursor !== null,
        loadingMore: false,
        loadMoreFailed: false,
      } : current);
    } catch (error) {
      if (!controller.signal.aborted && currentScope.current === input.scopeKey
        && epoch.current === requestEpoch) {
        const contractFailure = error instanceof CasePaginationContractError;
        if (contractFailure) pageState.nextCursor = null;
        setResource((current) => current.scope === input.scopeKey ? {
          ...current, hasMore: contractFailure ? false : current.hasMore,
          loadingMore: false, loadMoreFailed: true,
        } : current);
      }
    } finally {
      if (paging.current === pageState) pageState.loading = false;
    }
  }, [input.available, input.keyOf, input.load, input.scopeKey]);

  const updateItems = useCallback((update: (items: readonly T[]) => T[]) => {
    setResource((current) => current.scope === input.scopeKey
      ? { ...current, items: update(current.items) } : current);
  }, [input.scopeKey]);
  const retry = useCallback(() => {
    moreController.current?.abort();
    silentRefresh.current = false;
    setRetryVersion((value) => value + 1);
  }, []);
  const refresh = useCallback(() => {
    moreController.current?.abort();
    silentRefresh.current = true;
    setResource((current) => current.scope === input.scopeKey && current.status === "ready"
      ? { ...current, refreshing: true, refreshFailed: false } : current);
    setRetryVersion((value) => value + 1);
  }, [input.scopeKey]);
  const visible = resource.scope === input.scopeKey ? resource
    : input.available && input.active ? base<T>(input.scopeKey, "loading")
    : base<T>(input.scopeKey, "unavailable");
  return {
    resource: visible,
    loadMore,
    updateItems,
    retry,
    refresh,
  };
}

export function classifyCollaborationFailure(error: unknown): CaseCollaborationFailure {
  if (!(error instanceof TmsApiError)) return "unknown";
  if (error.status === 403) return "forbidden";
  if (error.status === 412) return "stale";
  if (error.code.startsWith("RETEST_")) return "retest_required";
  if (error.code === "YOUTRACK_LINK_REQUIRED") return "youtrack_required";
  if (error.code === "YOUTRACK_WORKFLOW_GUARD_REQUIRED") return "youtrack_workflow_guard";
  if (error.code === "YOUTRACK_NOT_READY_FOR_TEST") return "youtrack_not_ready";
  if (error.code === "INVALID_TRANSITION") return "invalid_transition";
  return "unknown";
}
