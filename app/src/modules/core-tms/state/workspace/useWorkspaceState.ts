import { useEffect, useState } from "react";
import { useTmsHttpClient } from "../../auth/http/TmsHttpClientContext";
import { useTmsLocale } from "../../localization/context/useTmsLocale";
import type { CaseFilters, Dialog, View } from "../types/workspace";
import { useWorkspaceBootstrap } from "./useWorkspaceBootstrap";
import { useSelectedRunResource } from "../run-resource/useSelectedRunResource";
import { buildWorkspaceDeepLink, readWorkspaceDeepLink } from "../navigation/workspace-deep-link";
import { useWorkspaceHistory } from "../navigation/browser/useWorkspaceHistory";
import { useNavigationValue } from "../navigation/context/useNavigationValue";
import { buildCaseDeepLink, readCaseDeepLink } from "../../test-cases/navigation/case-deep-link";
import { useSelectedSuiteResource } from "../workspace-resources/useSelectedSuiteResource";
import { useCaseEditorState } from "../case-editor/useCaseEditorState";
import { useSelectedCaseResource } from "../case-resource/useSelectedCaseResource";
import { resolveSelectedCase } from "../../test-cases/navigation/selection/selected-case";

const defaultFilters: CaseFilters = {
  type: "all",
  priority: "all",
  lifecycle: "all",
  tag: "",
  includeArchived: false,
};

export function useWorkspaceState() {
  const http = useTmsHttpClient();
  const { locale, t } = useTmsLocale();
  const bootstrap = useWorkspaceBootstrap();
  const { data, setData, connection } = bootstrap;
  const [view, setView] = useState<View>("cases");
  const [projectId, setProjectId] = useState("");
  const [query, setQuery] = useNavigationValue(`cases:${projectId}:query`, "");
  const [selectedCaseId, setSelectedCaseId] = useState("");
  const [selectedSuiteId, setSelectedSuiteId] = useState("");
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [selectedRunItemId, setSelectedRunItemId] = useState<string | null>(null);
  const [dialog, setDialog] = useState<Dialog>(null);
  const caseEditor = useCaseEditorState(locale, () => {
    setDialog((current) => current === "case" ? null : current);
  });
  const [selectedFolder, setSelectedFolder] = useNavigationValue(`cases:${projectId}:folder`, "");
  const [selectedFolderId, setSelectedFolderId] = useNavigationValue(`cases:${projectId}:folderId`, "");
  const [customFolders, setCustomFolders] = useState<Record<string, string[]>>(
    {},
  );
  const [caseFilters, setCaseFilters] = useNavigationValue<CaseFilters>(`cases:${projectId}:filters`, defaultFilters);
  const [editingSuiteId, setEditingSuiteId] = useState<string | null>(null);
  const [runPresetCaseIds, setRunPresetCaseIds] = useState<string[]>([]);
  const [runPresetSuiteId, setRunPresetSuiteId] = useState("");
  const [notice, setNotice] = useState("");
  const [collapsedFolders, setCollapsedFolders] = useState<string[]>([]);
  const selectedCase = useSelectedCaseResource(http, connection, data.testCases, selectedCaseId);
  const selectedSuite = useSelectedSuiteResource(http, connection === "connected", selectedSuiteId);
  const runResource = useSelectedRunResource({ http, connection, projectId, selectedRunId,
    selectedRunItemId, setSelectedRunItemId, setData });

  const history = useWorkspaceHistory({ workspaceId: data.workspace.id, projectId, view,
    runId: selectedRunId, caseId: selectedCaseId, ready: connection === "connected" || connection === "demo",
    setView, setCase: setSelectedCaseId, setRun: setSelectedRunId, setItem: setSelectedRunItemId,
    closeDialog: () => setDialog(null), reload: bootstrap.retryBootstrap });
  const canWriteNavigation = history.canWrite;

  useEffect(() => {
    if (connection !== "connected" && connection !== "demo") return;
    const linked = readCaseDeepLink(window.location.href);
    const destination = readWorkspaceDeepLink(window.location.href);
    const remembered = window.localStorage.getItem("tms.project.v1");
    const active = data.projects.filter((item) => item.status !== "archived");
    const initialProjectId = active.some((item) => item.id === linked.projectId)
      ? linked.projectId!
      : active.some((item) => item.id === remembered)
      ? remembered!
      : (active[0]?.id ?? "");
    const initialCase = resolveSelectedCase(data.testCases, initialProjectId,
      !destination.view || destination.view === "cases" ? linked.caseId : null);
    const initialRunId = destination.runId
      ?? data.runs.find((item) => item.projectId === initialProjectId && item.status === "active" && !item.archivedAt)?.id
      ?? data.runs.find((item) => item.projectId === initialProjectId && !item.archivedAt)?.id ?? null;
    const initialView = destination.view ?? (linked.caseId ? "cases" : view);
    history.begin({ workspaceId: data.workspace.id,
      projectId: initialProjectId, view: initialView, runId: initialRunId, caseId: initialCase?.id ?? "" });
    setView(initialView);
    setProjectId(initialProjectId);
    setSelectedCaseId(initialCase?.id ?? "");
    setSelectedFolder(initialCase?.folderPath ?? "");
    setSelectedSuiteId(
      data.suites.find((item) => item.projectId === initialProjectId)?.id ?? "",
    );
    setSelectedRunId(initialRunId);
    setSelectedRunItemId(destination.runItemId ?? null);
    setNotice(connection === "connected" ? t("actions.workspaceConnected") : "");
  }, [bootstrap.generation]);

  useEffect(() => {
    if (!canWriteNavigation() || view !== "cases" || (connection !== "connected" && connection !== "demo") || !selectedCaseId) return;
    const selected = data.testCases.find((item) => item.id === selectedCaseId);
    if (!selected) return;
    const next = buildCaseDeepLink(window.location.href, {
      workspaceId: data.workspace.id,
      caseId: selected.id,
      projectId: selected.projectId,
    });
    history.write(next);
  }, [connection, data.testCases, data.workspace.id, selectedCaseId, view, canWriteNavigation]);

  useEffect(() => {
    if (!canWriteNavigation() || (connection !== "connected" && connection !== "demo") || !projectId || (view === "cases" && selectedCaseId)) return;
    const next = buildWorkspaceDeepLink(window.location.href, { workspaceId: data.workspace.id,
      projectId, view, runId: selectedRunId, runItemId: selectedRunItemId });
    history.write(next);
  }, [connection, projectId, view, selectedRunId, selectedRunItemId, selectedCaseId, data.workspace.id, canWriteNavigation]);

  useEffect(() => {
    if (connection !== "demo") return;
    try {
      const saved = window.localStorage.getItem("tms.development-folders.v1");
      if (saved) {
        setCustomFolders(JSON.parse(saved) as Record<string, string[]>);
      }
    } catch {}
  }, [connection]);

  useEffect(() => {
    if (connection !== "demo") return;
    window.localStorage.setItem(
      "tms.development-folders.v1",
      JSON.stringify(customFolders),
    );
  }, [connection, customFolders]);

  useEffect(() => {
    if (connection === "demo") {
      window.localStorage.setItem(
        "tms.development-demo.v1",
        JSON.stringify(data),
      );
    }
  }, [connection, data]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 3200);
    return () => window.clearTimeout(timer);
  }, [notice]);

  return {
    ...bootstrap, data, setData, connection, view, setView: history.navigateView, projectId, setProjectId,
    query, setQuery, canWriteNavigation, selectedCaseId, setSelectedCaseId, selectedSuiteId,
    setSelectedSuiteId, selectedRunId, setSelectedRunId, selectedRunItemId,
    setSelectedRunItemId, dialog, setDialog, ...caseEditor, selectedFolder,
    setSelectedFolder, selectedFolderId, setSelectedFolderId, customFolders, setCustomFolders, caseFilters,
    setCaseFilters, editingSuiteId, setEditingSuiteId, runPresetCaseIds,
    setRunPresetCaseIds, runPresetSuiteId, setRunPresetSuiteId, notice,
    setNotice, collapsedFolders, setCollapsedFolders,
    selectedCaseDetail: selectedCase.detail, setSelectedCaseDetail: selectedCase.setDetail,
    selectedCaseEtag: selectedCase.etag, setSelectedCaseEtag: selectedCase.setEtag,
    selectedCaseDetailError: selectedCase.failed,
    retrySelectedCaseDetail: selectedCase.retry, selectedSuiteDetail: selectedSuite.detail,
    setSelectedSuiteDetail: selectedSuite.setDetail, selectedSuiteEtag: selectedSuite.etag,
    setSelectedSuiteEtag: selectedSuite.setEtag, ...runResource,
    selectedSuiteDetailError: selectedSuite.failed, retrySelectedSuiteDetail: selectedSuite.retry,
  };
}
