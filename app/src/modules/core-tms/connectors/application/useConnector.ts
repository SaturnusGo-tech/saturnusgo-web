"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTmsHttpClient } from "../../auth/http/TmsHttpClientContext";
import { TmsApiError } from "../../../../core/tms/transport/http";
import { connectorApi } from "../data/connector-api";
import { connectionDraft } from "../model/connector-draft";
import type { Scope, Provider, Snapshot, Discovery, ConnectionInput } from "../model/connector-types";
import { useWorkspaceConnectors } from "./context/WorkspaceConnectorContext";
import { connectorError } from "./connector-errors";
import { ConnectorRequestOwner } from "./requests/connector-request-owner";
import { ConnectorActivityFreshness } from "./activity/connector-activity-freshness";
import { RepublishOperationKeys } from "./republish/republish-operation-keys";
import { republishReport } from "./republish/republish-report";

export function useConnector(scope: Scope, provider: Provider, russian: boolean, onSaved: () => void,
  activityActive: boolean) {
  const http = useTmsHttpClient();
  const catalog = useWorkspaceConnectors();
  const api = useMemo(() => connectorApi(http), [http]);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [draft, setDraft] = useState(() => connectionDraft(provider, null));
  const [discovery, setDiscovery] = useState<Discovery | null>(null);
  const [pending, setPending] = useState<string | null>("load");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [activityFailed, setActivityFailed] = useState(false);
  const [configurationReloadRequired, setConfigurationReloadRequired] = useState(false);
  const requests = useRef(new ConnectorRequestOwner());
  const freshness = useRef(new ConnectorActivityFreshness());
  const republishKeys = useRef(new RepublishOperationKeys());
  const stableScope = useMemo(() => ({ workspaceId: scope.workspaceId, projectId: scope.projectId }),
    [scope.workspaceId, scope.projectId]);
  const act = useCallback(async (name: string, work: (signal: AbortSignal) => Promise<void>) => {
    const signal = requests.current.begin();
    setPending(name); setError(null); setNotice(null);
    if (name === "activity" || name === "load") setActivityFailed(false);
    try { await work(signal); }
    catch (failure) { if (requests.current.current(signal)) {
      setError(connectorError(failure, russian));
      if (failure instanceof TmsApiError && failure.status === 412) setConfigurationReloadRequired(true);
      if (name === "activity") setActivityFailed(true);
    } }
    finally { if (requests.current.current(signal)) { requests.current.finish(signal); setPending(null); } }
  }, [russian]);
  const publishSnapshot = useCallback((result: Snapshot) => {
    setSnapshot(result); freshness.current.loaded(); setActivityFailed(false); setConfigurationReloadRequired(false);
  }, []);
  const load = useCallback(() => act("load", async (signal) => {
    const result = await api.load(stableScope, provider, signal);
    signal.throwIfAborted(); publishSnapshot(result); setDraft(connectionDraft(provider, result.connection));
    setDiscovery(null);
  }), [act, api, stableScope, provider, publishSnapshot]);
  useEffect(() => {
    freshness.current.reset(); setSnapshot(null); void load();
    return () => requests.current.cancel();
  }, [load]);
  const refreshActivity = useCallback(() => act("activity", async (signal) => {
    const result = await api.activity(stableScope, provider, signal);
    signal.throwIfAborted();
    setSnapshot((current) => current ? { ...current, ...result } : current);
    freshness.current.loaded();
  }), [act, api, stableScope, provider]);
  useEffect(() => {
    const available = Boolean(snapshot) && !pending && !requests.current.busy();
    if (freshness.current.refreshOnEntry(activityActive, available)) void refreshActivity();
  }, [activityActive, pending, snapshot, refreshActivity]);
  const discover = () => act("discover", async (signal) => {
    const result = await api.discover(stableScope, provider, draft, signal);
    signal.throwIfAborted(); setDiscovery(result);
    setNotice(russian ? `Доступ подтверждён: ${result.account}` : `Access verified: ${result.account}`);
  });
  const save = (input: ConnectionInput = draft) => act("save", async (signal) => {
    if (!snapshot?.etag) throw new Error("Missing version");
    const saved = await api.save(stableScope, provider, input, snapshot.etag, signal);
    signal.throwIfAborted();
    setDraft(connectionDraft(provider, saved.data));
    setSnapshot((current) => current ? { ...current, connection: saved.data, etag: saved.etag } : current);
    catalog.update(stableScope, provider, saved.data);
    onSaved();
    setNotice(russian ? "Настройки сохранены." : "Settings saved.");
    const updated = await api.load(stableScope, provider, signal);
    signal.throwIfAborted(); publishSnapshot(updated);
  });
  const disconnect = () => act("disconnect", async (signal) => {
    if (!snapshot?.etag) throw new Error("Missing version");
    await api.disconnect(stableScope, provider, snapshot.etag, signal);
    signal.throwIfAborted(); catalog.update(stableScope, provider, null);
    const updated = await api.load(stableScope, provider, signal);
    signal.throwIfAborted(); publishSnapshot(updated); setDraft(connectionDraft(provider, null)); setDiscovery(null);
    onSaved(); setNotice(russian ? "Подключение отсоединено. Созданные записи сохранены." : "Disconnected. Existing records are preserved.");
  });
  const recover = (id: string, remoteId?: string) => act(id, async (signal) => {
    if (remoteId) await api.reconcile(stableScope, provider, id, remoteId, signal);
    else await api.retry(stableScope, provider, id, signal);
    const updated = await api.load(stableScope, provider, signal);
    signal.throwIfAborted(); publishSnapshot(updated);
    setNotice(russian ? "Журнал обновлён." : "Activity updated.");
  });
  const more = () => act("more", async (signal) => {
    if (!snapshot?.nextCursor) return;
    const page = await api.history(stableScope, provider, snapshot.nextCursor, signal);
    signal.throwIfAborted();
    setSnapshot((current) => current ? { ...current, deliveries: [...current.deliveries, ...page.data],
      nextCursor: page.nextCursor } : current);
  });
  const republish = (runId: string) => act(`republish:${runId}`, async (signal) => {
    if (provider !== "confluence" || !snapshot?.connection || !snapshot.etag) throw new Error("Missing connection version");
    const activity = await republishReport({ scope: stableScope, connectionId: snapshot.connection.id,
      runId, etag: snapshot.etag, signal }, { keys: republishKeys.current, accept: api.republishReport,
      refresh: (scope, activeSignal) => api.activity(scope, "confluence", activeSignal) });
    signal.throwIfAborted();
    setSnapshot((current) => current ? { ...current, ...activity } : current);
    freshness.current.loaded(); setActivityFailed(false);
    setNotice(russian ? "Обновление отчёта поставлено в очередь. Статус доставки показан ниже." :
      "Report update queued. Delivery progress is shown below.");
  });
  const updateDraft = (value: ConnectionInput) => {
    setDraft(value);
    if (provider === "swagger") { setDiscovery(null); setNotice(null); }
  };
  return { snapshot, draft, setDraft: updateDraft, discovery, pending, error, notice, activityFailed, configurationReloadRequired,
    load, refreshActivity, discover, save, disconnect, recover, more, republish };
}
