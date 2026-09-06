import { useCallback, useEffect, useMemo, useState } from "react";
import {
  disconnectYouTrack,
  discoverYouTrack,
  getYouTrackConfiguration,
  saveYouTrackConfiguration,
} from "../../../../application/integrations/getYouTrackIntegrationStatus";
import { useTmsHttpClient } from "../../../../auth/http/TmsHttpClientContext";
import {
  canReuseYouTrackToken,
  configurationInput,
  draftFromConfiguration,
  normalizeYouTrackBaseUrl,
  validateYouTrackDraft,
  type YouTrackConfiguration,
  type YouTrackConfigurationDraft,
  type YouTrackProject,
} from "../../../../youtrack/model/youtrack-settings";
import type { HooksCopy } from "../../shared/hooks-copy";
import {
  discoverProjectDetails,
  discoveryError,
  isStaleWrite,
  mergeProjects,
  projectsFromConfiguration,
  reconcileDraftProjects,
  routeWithProject,
  saveError,
  uniqueProjectIds,
  validationKey,
} from "./settings-support";
export type YouTrackSettingsState = ReturnType<typeof useYouTrackSettings>;
export function useYouTrackSettings(
  workspaceId: string,
  copy: HooksCopy,
  onStatusChange: () => void,
  canManage: boolean,
) {
  const http = useTmsHttpClient();
  const [configuration, setConfiguration] = useState<YouTrackConfiguration | null>(null);
  const [configurationEtag, setConfigurationEtag] = useState<string | null>(null);
  const [draft, setDraft] = useState<YouTrackConfigurationDraft | null>(null);
  const [projects, setProjects] = useState<readonly YouTrackProject[]>([]);
  const [projectsBaseUrl, setProjectsBaseUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [reload, setReload] = useState(0);
  const [action, setAction] = useState<"idle" | "connecting" | "saving" | "disconnecting">("idle");
  const [loadingProjectId, setLoadingProjectId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [showToken, setShowToken] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setLoadFailed(false); setNotice(null);
    void getYouTrackConfiguration(http, workspaceId, controller.signal)
      .then(async (resource) => {
        if (controller.signal.aborted) return;
        const nextDraft = draftFromConfiguration(resource.data);
        const seeded = projectsFromConfiguration(resource.data);
        setConfiguration(resource.data); setConfigurationEtag(resource.etag);
        setDraft(nextDraft); setProjects(seeded); setProjectsBaseUrl(resource.data.baseUrl);
        if (!canManage || !resource.data.baseUrl || !resource.data.tokenConfigured) return;
        try {
          const baseUrl = normalizeYouTrackBaseUrl(resource.data.baseUrl);
          const catalog = await discoverYouTrack(http, workspaceId, { baseUrl }, controller.signal);
          const ids = uniqueProjectIds(nextDraft.routes)
            .filter((id) => catalog.projects.some((project) => project.id === id));
          const details = await discoverProjectDetails(http, workspaceId, baseUrl, ids, "", controller.signal);
          if (controller.signal.aborted) return;
          setProjects(mergeProjects(details, mergeProjects(catalog.projects, seeded)));
          setProjectsBaseUrl(catalog.baseUrl);
          setDraft((current) => current ? reconcileDraftProjects(current, catalog.projects, details) : current);
        } catch {
          // Keep the saved configuration editable while YouTrack is unavailable.
        }
      })
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === "AbortError")) setLoadFailed(true);
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [canManage, http, workspaceId, reload]);

  const selectedProjects = useMemo(() => {
    if (!draft || !projectsBaseUrl) return [];
    try {
      if (normalizeYouTrackBaseUrl(draft.baseUrl) !== normalizeYouTrackBaseUrl(projectsBaseUrl)) return [];
    } catch { return []; }
    return projects;
  }, [draft, projects, projectsBaseUrl]);

  const updateDraft = useCallback((updater: (current: YouTrackConfigurationDraft) => YouTrackConfigurationDraft) => {
    setDraft((current) => current ? updater(current) : current); setNotice(null);
  }, []);

  const connect = async () => {
    if (!canManage || !draft || !configuration) return;
    let baseUrl: string;
    try { baseUrl = normalizeYouTrackBaseUrl(draft.baseUrl); } catch {
      setNotice({ tone: "error", text: copy.validation.baseUrl }); return;
    }
    const apiToken = draft.apiToken.trim();
    if ((!canReuseYouTrackToken(configuration, baseUrl) && !apiToken) ||
      (apiToken && (apiToken.length < 32 || new TextEncoder().encode(apiToken).length > 2048))) {
      setNotice({ tone: "error", text: copy.validation.token }); return;
    }
    setAction("connecting"); setNotice(null);
    try {
      const catalog = await discoverYouTrack(http, workspaceId, { baseUrl, ...(apiToken ? { apiToken } : {}) });
      const ids = uniqueProjectIds(draft.routes)
        .filter((id) => catalog.projects.some((project) => project.id === id));
      const details = await discoverProjectDetails(http, workspaceId, baseUrl, ids, apiToken);
      setProjects(mergeProjects(details, catalog.projects)); setProjectsBaseUrl(catalog.baseUrl);
      setDraft((current) => current ? reconcileDraftProjects(current, catalog.projects, details) : current);
      setNotice({ tone: "success", text: copy.connectionSuccess(catalog.projects.length) });
    } catch (error: unknown) { setNotice({ tone: "error", text: discoveryError(copy, error) }); }
    finally { setAction("idle"); }
  };

  const selectRouteProject = async (routeId: string, projectId: string) => {
    if (!canManage || !draft) return;
    const project = selectedProjects.find((candidate) => candidate.id === projectId);
    if (!project) return;
    updateDraft((current) => ({ ...current, routes: current.routes.map((route) =>
      route.id === routeId ? routeWithProject(route, project) : route) }));
    if (project.stateFields?.length) return;
    setLoadingProjectId(projectId);
    try {
      const baseUrl = normalizeYouTrackBaseUrl(draft.baseUrl);
      const details = await discoverProjectDetails(http, workspaceId, baseUrl, [projectId], draft.apiToken.trim());
      const detailed = details.find((candidate) => candidate.id === projectId);
      if (!detailed) throw new Error("Project discovery returned no details.");
      setProjects((current) => mergeProjects(details, current));
      updateDraft((current) => ({ ...current, routes: current.routes.map((route) =>
        route.id === routeId && route.project.id === projectId
          ? routeWithProject(route, detailed)
          : route) }));
    } catch (error: unknown) { setNotice({ tone: "error", text: discoveryError(copy, error) }); }
    finally { setLoadingProjectId((current) => current === projectId ? null : current); }
  };

  const save = async () => {
    if (!canManage || !draft || !configuration) return;
    if (!configurationEtag) { setNotice({ tone: "error", text: copy.saveFailure }); return; }
    const issue = validateYouTrackDraft(draft, canReuseYouTrackToken(configuration, draft.baseUrl));
    if (issue) { setNotice({ tone: "error", text: copy.validation[validationKey(issue)] }); return; }
    if (!projectsBaseUrl ||
      normalizeYouTrackBaseUrl(draft.baseUrl) !== normalizeYouTrackBaseUrl(projectsBaseUrl)) {
      setNotice({ tone: "error", text: copy.validation.connection }); return;
    }
    setAction("saving"); setNotice(null);
    try {
      const saved = await saveYouTrackConfiguration(http, workspaceId, configurationInput(draft), configurationEtag);
      setConfiguration(saved.data); setConfigurationEtag(saved.etag); setDraft(draftFromConfiguration(saved.data));
      setProjects((current) => mergeProjects(projectsFromConfiguration(saved.data), current));
      setProjectsBaseUrl(saved.data.baseUrl); setNotice({ tone: "success", text: copy.saved }); onStatusChange();
    } catch (error: unknown) {
      if (isStaleWrite(error)) {
        try {
          const current = await getYouTrackConfiguration(http, workspaceId);
          setConfiguration(current.data); setConfigurationEtag(current.etag); setDraft(draftFromConfiguration(current.data));
          setProjects(projectsFromConfiguration(current.data)); setProjectsBaseUrl(current.data.baseUrl);
          setNotice({ tone: "error", text: copy.stale }); return;
        } catch { /* Report the durable save error below. */ }
      }
      setNotice({ tone: "error", text: saveError(copy, error) });
    } finally { setAction("idle"); }
  };

  const disconnect = async () => {
    if (!canManage || !configurationEtag) { setNotice({ tone: "error", text: copy.disconnectFailure }); return false; }
    setAction("disconnecting"); setNotice(null);
    try {
      const result = await disconnectYouTrack(http, workspaceId, configurationEtag);
      const next = result.data.configuration;
      setConfiguration(next); setConfigurationEtag(result.etag); setDraft(draftFromConfiguration(next));
      setProjects(projectsFromConfiguration(next)); setProjectsBaseUrl(next.baseUrl);
      setNotice({ tone: "success", text: copy.disconnected(result.data.detachedLinks) });
      onStatusChange(); return true;
    } catch (error: unknown) {
      if (isStaleWrite(error)) {
        try {
          const current = await getYouTrackConfiguration(http, workspaceId);
          setConfiguration(current.data); setConfigurationEtag(current.etag); setDraft(draftFromConfiguration(current.data));
          setProjects(projectsFromConfiguration(current.data)); setProjectsBaseUrl(current.data.baseUrl);
          setNotice({ tone: "error", text: copy.stale }); return false;
        } catch { /* Use the disconnect-specific fallback below. */ }
      }
      const message = saveError(copy, error);
      setNotice({ tone: "error", text: message === copy.saveFailure ? copy.disconnectFailure : message }); return false;
    } finally { setAction("idle"); }
  };

  return {
    configuration, draft, selectedProjects, loading, loadFailed, action, loadingProjectId,
    notice, showToken, setShowToken, updateDraft, connect, selectRouteProject, save, disconnect,
    retry: () => setReload((value) => value + 1),
  };
}
