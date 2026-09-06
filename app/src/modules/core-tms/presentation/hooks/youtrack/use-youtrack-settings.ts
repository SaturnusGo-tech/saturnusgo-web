import { useCallback, useEffect, useMemo, useState } from "react";

import {
  getYouTrackConfiguration,
  saveYouTrackConfiguration,
  testYouTrackConnection,
} from "../../../application/integrations/getYouTrackIntegrationStatus";
import { useTmsHttpClient } from "../../../auth/http/TmsHttpClientContext";
import {
  canReuseYouTrackToken,
  configurationInput,
  draftFromConfiguration,
  normalizeYouTrackBaseUrl,
  validateYouTrackDraft,
  YOU_TRACK_TARGETS,
  type YouTrackConfiguration,
  type YouTrackConfigurationDraft,
  type YouTrackProject,
} from "../../../youtrack/model/youtrack-settings";
import type { HooksCopy } from "../shared/hooks-copy";

export type YouTrackSettingsState = ReturnType<typeof useYouTrackSettings>;

export function useYouTrackSettings(
  workspaceId: string,
  copy: HooksCopy,
  onStatusChange: () => void,
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
  const [action, setAction] = useState<"idle" | "testing" | "saving">("idle");
  const [notice, setNotice] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [showToken, setShowToken] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setLoadFailed(false);
    setNotice(null);
    void getYouTrackConfiguration(http, workspaceId, controller.signal)
      .then((resource) => {
        setConfiguration(resource.data);
        setConfigurationEtag(resource.etag);
        setDraft(draftFromConfiguration(resource.data));
        setProjects(projectsFromConfiguration(resource.data));
        setProjectsBaseUrl(resource.data.baseUrl);
      })
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === "AbortError")) setLoadFailed(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [http, workspaceId, reload]);

  const selectedProjects = useMemo(() => {
    if (!draft || !projectsBaseUrl) return [];
    try {
      if (normalizeYouTrackBaseUrl(draft.baseUrl) !== projectsBaseUrl) return [];
    } catch {
      return [];
    }
    return projects.filter((project) => !project.archived);
  }, [draft, projects, projectsBaseUrl]);

  const updateDraft = useCallback((
    updater: (current: YouTrackConfigurationDraft) => YouTrackConfigurationDraft,
  ) => {
    setDraft((current) => current ? updater(current) : current);
    setNotice(null);
  }, []);

  const runConnectionTest = async () => {
    if (!draft || !configuration) return;
    let baseUrl: string;
    try { baseUrl = normalizeYouTrackBaseUrl(draft.baseUrl); } catch {
      setNotice({ tone: "error", text: copy.validation.baseUrl }); return;
    }
    const reusableTokenConfigured = canReuseYouTrackToken(configuration, baseUrl);
    const apiToken = draft.apiToken.trim();
    if ((!reusableTokenConfigured && !apiToken) ||
      (apiToken && (apiToken.length < 32 || new TextEncoder().encode(apiToken).length > 2048))) {
      setNotice({ tone: "error", text: copy.validation.token }); return;
    }
    setAction("testing"); setNotice(null);
    try {
      const result = await testYouTrackConnection(http, workspaceId, {
        baseUrl, ...(apiToken ? { apiToken } : {}),
      });
      setProjects(result.projects);
      setProjectsBaseUrl(result.baseUrl);
      setDraft((current) => current ? {
        ...current,
        targets: reconcileTargets(current.targets, result.projects),
      } : current);
      setNotice({ tone: "success", text: copy.connectionSuccess(result.projects.length) });
    } catch {
      setNotice({ tone: "error", text: copy.connectionFailure });
    } finally { setAction("idle"); }
  };

  const save = async () => {
    if (!draft || !configuration) return;
    if (!configurationEtag) {
      setNotice({ tone: "error", text: copy.saveFailure }); return;
    }
    const issue = validateYouTrackDraft(
      draft,
      canReuseYouTrackToken(configuration, draft.baseUrl),
    );
    if (issue) {
      setNotice({ tone: "error", text: copy.validation[validationKey(issue)] }); return;
    }
    if (normalizeYouTrackBaseUrl(draft.baseUrl) !== projectsBaseUrl) {
      setNotice({ tone: "error", text: copy.validation.connection }); return;
    }
    setAction("saving"); setNotice(null);
    try {
      const saved = await saveYouTrackConfiguration(
        http, workspaceId, configurationInput(draft), configurationEtag,
      );
      setConfiguration(saved.data);
      setConfigurationEtag(saved.etag);
      setDraft(draftFromConfiguration(saved.data));
      setProjects((current) => mergeProjects(current, projectsFromConfiguration(saved.data)));
      setProjectsBaseUrl(saved.data.baseUrl);
      setNotice({ tone: "success", text: copy.saved });
      onStatusChange();
    } catch (error: unknown) {
      if (isStaleWrite(error)) {
        try {
          const current = await getYouTrackConfiguration(http, workspaceId);
          setConfiguration(current.data);
          setConfigurationEtag(current.etag);
          setDraft(draftFromConfiguration(current.data));
          setProjects(projectsFromConfiguration(current.data));
          setProjectsBaseUrl(current.data.baseUrl);
          setNotice({ tone: "error", text: copy.stale });
          return;
        } catch {
          // Fall through to the durable generic error if reconciliation also fails.
        }
      }
      setNotice({ tone: "error", text: copy.saveFailure });
    } finally { setAction("idle"); }
  };

  return {
    configuration, draft, selectedProjects, loading, loadFailed, action, notice, showToken,
    setShowToken, updateDraft, runConnectionTest, save,
    retry: () => setReload((value) => value + 1),
  };
}

function projectsFromConfiguration(configuration: YouTrackConfiguration): YouTrackProject[] {
  return YOU_TRACK_TARGETS.flatMap((target) => {
    const value = configuration.targets[target];
    return value?.projectId && value.shortName
      ? [{ id: value.projectId, shortName: value.shortName, name: value.name ?? value.shortName }]
      : [];
  });
}

function mergeProjects(first: readonly YouTrackProject[], second: readonly YouTrackProject[]) {
  return [...new Map([...second, ...first].map((project) => [project.id, project])).values()];
}

function reconcileTargets(
  targets: YouTrackConfigurationDraft["targets"],
  projects: readonly YouTrackProject[],
): YouTrackConfigurationDraft["targets"] {
  const available = new Set(projects.map((project) => `${project.id}\u0000${project.shortName}`));
  return Object.fromEntries(YOU_TRACK_TARGETS.map((target) => {
    const value = targets[target];
    return [target, available.has(`${value.projectId}\u0000${value.shortName}`)
      ? value : { projectId: "", shortName: "" }];
  })) as YouTrackConfigurationDraft["targets"];
}

function validationKey(issue: ReturnType<typeof validateYouTrackDraft>) {
  return issue === "base_url" ? "baseUrl" : issue === "token" ? "token"
    : issue === "targets" ? "targets" : "readyStatuses";
}

function isStaleWrite(error: unknown): boolean {
  return error instanceof Error && "status" in error &&
    (error as Error & { status?: unknown }).status === 412;
}
