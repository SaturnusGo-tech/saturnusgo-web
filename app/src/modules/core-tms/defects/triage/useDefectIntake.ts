import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { resolvePendingOperation, type PendingOperation } from "../../../../core/tms/idempotency/pending-operation";
import { TmsApiError } from "../../../../core/tms/transport/http";
import { useTmsHttpClient } from "../../auth/http/TmsHttpClientContext";
import { scheduleVisibleDefectRefresh } from "../../state/defect-refresh/visible-defect-refresh";
import { notifyDefectsChanged, subscribeDefectsChanged } from "../application/defect-resource-events";
import { createDefectTriageSource, type DefectTriageDecision, type DefectTriagePage, type DefectTriageRow,
  type DefectTriageScope, type DefectTriageView } from "./defect-triage-source";

type ListFailure = "authentication" | "permission" | "unavailable" | "loadFailed";
type DecisionFailure = ListFailure | "manageDenied" | "stale" | "workflow" | "targetUnavailable" | "invalidSnooze" | "decisionFailed";
type ListState = DefectTriagePage & { loading: boolean; error: ListFailure | null; failedCursor?: string };
const initialList: ListState = { rows: [], nextCursor: null, loading: true, error: null };

function readFailure(error: unknown): ListFailure {
  if (error instanceof TmsApiError) {
    if (error.status === 401) return "authentication";
    if (error.status === 403) return "permission";
    if (error.status === 404 || error.status === 501 || error.status === 503) return "unavailable";
  }
  return "loadFailed";
}

function writeFailure(error: unknown, action: DefectTriageDecision["action"]): DecisionFailure {
  if (error instanceof TmsApiError) {
    if (error.status === 403) return "manageDenied";
    if (error.status === 412 || error.code === "INVALID_TRANSITION") return "stale";
    if (error.code === "RETEST_EVIDENCE_REQUIRED" || error.code === "YOUTRACK_WORKFLOW_GUARD_REQUIRED") return "workflow";
    if (action === "duplicate" && (error.validationField === "duplicateOfDefectId" || error.status === 404)) {
      return "targetUnavailable";
    }
    if (error.validationField === "snoozedUntil") return "invalidSnooze";
  }
  const access = readFailure(error);
  return access === "loadFailed" ? "decisionFailed" : access;
}

export function useDefectIntake({ workspaceId, projectId }: DefectTriageScope, view: DefectTriageView,
  onChange: () => void) {
  const http = useTmsHttpClient();
  const source = useMemo(() => createDefectTriageSource(http), [http]);
  const [list, setList] = useState(initialList);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<DecisionFailure | null>(null);
  const [completed, setCompleted] = useState<DefectTriageDecision["action"] | null>(null);
  const [canDecide, setCanDecide] = useState(true);
  const readRequest = useRef<AbortController | null>(null);
  const loadedPages = useRef(0);
  const refreshPending = useRef(false);
  const mutationRunning = useRef(false);
  const pendingOperation = useRef<PendingOperation | null>(null);
  const load = useCallback(async function readQueue(cursor?: string, background = false) {
    if (background && (mutationRunning.current || readRequest.current)) {
      refreshPending.current = true;
      return;
    }
    readRequest.current?.abort();
    const request = new AbortController();
    const scope = { workspaceId, projectId };
    readRequest.current = request;
    if (!background) setList(state => ({ ...state, loading: true, error: null }));
    try {
      let page = await source.read(scope, view, cursor, request.signal);
      let pages = 1;
      const rows = new Map(page.rows.map(row => [row.id, row]));
      while (background && !request.signal.aborted && pages < loadedPages.current && page.nextCursor) {
        page = await source.read(scope, view, page.nextCursor, request.signal);
        page.rows.forEach(row => rows.set(row.id, row));
        pages++;
      }
      if (request.signal.aborted) return;
      loadedPages.current = cursor ? loadedPages.current + 1 : pages;
      setList(current => {
        if (cursor) {
          const combined = new Map(current.rows.map(row => [row.id, row]));
          rows.forEach((row, id) => combined.set(id, row));
          return { rows: [...combined.values()], nextCursor: page.nextCursor, loading: false, error: null };
        }
        return { rows: [...rows.values()], nextCursor: page.nextCursor, loading: false, error: null };
      });
    } catch (error) {
      if (request.signal.aborted) return;
      const failure = readFailure(error);
      if (background && (failure === "loadFailed" || (failure === "unavailable" &&
        error instanceof TmsApiError && error.status !== 404))) return;
      setList(current => ({
        ...(failure === "loadFailed" ? current : initialList), loading: false, error: failure, failedCursor: cursor,
      }));
    } finally {
      if (readRequest.current === request) {
        readRequest.current = null;
        if (refreshPending.current && !mutationRunning.current && document.visibilityState === "visible") {
          refreshPending.current = false;
          void readQueue(undefined, true);
        }
      }
    }
  }, [projectId, source, view, workspaceId]);

  useEffect(() => {
    void load();
    let lastVisibleRefresh = 0;
    const refresh = () => { if (document.visibilityState === "visible") void load(undefined, true); };
    const refreshVisible = () => {
      const now = Date.now();
      if (document.visibilityState !== "visible" || now - lastVisibleRefresh < 1_000) return;
      lastVisibleRefresh = now;
      refresh();
    };
    const cancel = scheduleVisibleDefectRefresh(refreshVisible);
    const unsubscribe = subscribeDefectsChanged(changed => { if (changed === projectId) refresh(); });
    window.addEventListener("focus", refreshVisible);
    document.addEventListener("visibilitychange", refreshVisible);
    return () => {
      cancel();
      unsubscribe();
      window.removeEventListener("focus", refreshVisible);
      document.removeEventListener("visibilitychange", refreshVisible);
      readRequest.current?.abort();
      readRequest.current = null;
      loadedPages.current = 0;
      refreshPending.current = false;
    };
  }, [load, projectId]);

  async function decide(row: DefectTriageRow, decision: DefectTriageDecision) {
    if (!canDecide || mutationRunning.current || row.projectId !== projectId) return false;
    const operation = resolvePendingOperation(pendingOperation.current, JSON.stringify([row.id, row.rowVersion, decision]));
    pendingOperation.current = operation;
    mutationRunning.current = true;
    setSaving(true);
    setError(null);
    setCompleted(null);
    let succeeded = false;
    try {
      await source.decide({ workspaceId, projectId }, row.id, row.rowVersion, decision, operation.key);
      succeeded = true;
    } catch (error) {
      const failure = writeFailure(error, decision.action);
      setError(failure);
      if (failure === "stale") refreshPending.current = true;
      if (failure === "manageDenied") setCanDecide(false);
      return false;
    } finally {
      mutationRunning.current = false;
      setSaving(false);
      if (!succeeded && refreshPending.current && !readRequest.current && document.visibilityState === "visible") {
        refreshPending.current = false;
        void load(undefined, true);
      }
    }
    pendingOperation.current = null;
    readRequest.current?.abort();
    readRequest.current = null;
    refreshPending.current = false;
    setList(current => ({ ...current, loading: false, rows: current.rows.filter(item => item.id !== row.id) }));
    setCompleted(decision.action);
    notifyDefectsChanged(projectId);
    onChange();
    return true;
  }

  return { source, list, load, saving, error, completed, canDecide, decide,
    clearDecision: () => { setError(null); setCompleted(null); } };
}
