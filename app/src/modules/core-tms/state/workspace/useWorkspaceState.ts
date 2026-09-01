import { useEffect, useState } from "react";
import type {
  RunItem, RunItemSummary,
} from "../../../../core/tms/contracts/legacy-contract";
import { useTmsHttpClient } from "../../auth/http/TmsHttpClientContext";
import { useTmsLocale } from "../../localization/context/useTmsLocale";
import type { CaseFilters, Dialog, View } from "../types/workspace";
import { useWorkspaceBootstrap } from "./useWorkspaceBootstrap";
import { getRun, getRunItem, listRunItems } from "../../runs/data/run-api";
import { buildCaseDeepLink, readCaseDeepLink } from "../../test-cases/navigation/case-deep-link";
import { useSelectedSuiteResource } from "../workspace-resources/useSelectedSuiteResource";
import { useCaseEditorState } from "../case-editor/useCaseEditorState";
import { useSelectedCaseResource } from "../case-resource/useSelectedCaseResource";

const defaultFilters: CaseFilters = {
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
  const [query, setQuery] = useState("");
  const [selectedCaseId, setSelectedCaseId] = useState("");
  const [selectedSuiteId, setSelectedSuiteId] = useState("");
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [selectedRunItemId, setSelectedRunItemId] = useState<string | null>(null);
  const [dialog, setDialog] = useState<Dialog>(null);
  const caseEditor = useCaseEditorState(locale, () => {
    setDialog((current) => current === "case" ? null : current);
  });
  const [selectedFolder, setSelectedFolder] = useState("/Unsorted");
  const [customFolders, setCustomFolders] = useState<Record<string, string[]>>(
    {},
  );
  const [caseFilters, setCaseFilters] = useState<CaseFilters>(defaultFilters);
  const [editingSuiteId, setEditingSuiteId] = useState<string | null>(null);
  const [runPresetCaseIds, setRunPresetCaseIds] = useState<string[]>([]);
  const [runPresetSuiteId, setRunPresetSuiteId] = useState("");
  const [notice, setNotice] = useState("");
  const [collapsedFolders, setCollapsedFolders] = useState<string[]>([]);
  const selectedCase = useSelectedCaseResource(http, connection, data.testCases, selectedCaseId);
  const selectedSuite = useSelectedSuiteResource(http, connection === "connected", selectedSuiteId);
  const [runItems, setRunItems] = useState<RunItemSummary[]>([]);
  const [selectedRunEtag, setSelectedRunEtag] = useState<string | null>(null);
  const [selectedRunItemDetail, setSelectedRunItemDetail] = useState<RunItem | null>(null);
  const [selectedRunItemEtag, setSelectedRunItemEtag] = useState<string | null>(null);

  useEffect(() => {
    if (connection !== "connected" && connection !== "demo") return;
    const linked = readCaseDeepLink(window.location.href);
    const remembered = window.localStorage.getItem("tms.project.v1");
    const active = data.projects.filter((item) => item.status !== "archived");
    const initialProjectId = active.some((item) => item.id === linked.projectId)
      ? linked.projectId!
      : active.some((item) => item.id === remembered)
      ? remembered!
      : (active[0]?.id ?? "");
    const linkedCase = data.testCases.find(
      (item) => item.projectId === initialProjectId && item.id === linked.caseId,
    );
    const initialCase = linkedCase ?? data.testCases.find(
      (item) => item.projectId === initialProjectId && !item.archivedAt,
    );
    setProjectId(initialProjectId);
    setSelectedCaseId(initialCase?.id ?? "");
    setSelectedFolder(initialCase?.folderPath ?? "/Unsorted");
    setSelectedSuiteId(
      data.suites.find((item) => item.projectId === initialProjectId)?.id ?? "",
    );
    setSelectedRunId(
      data.runs.find((item) => item.projectId === initialProjectId && item.status === "active" && !item.archivedAt)?.id
        ?? data.runs.find((item) => item.projectId === initialProjectId && !item.archivedAt)?.id
        ?? null,
    );
    setNotice(connection === "connected" ? t("actions.workspaceConnected") : "");
  }, [bootstrap.generation]);

  useEffect(() => {
    if ((connection !== "connected" && connection !== "demo") || !selectedCaseId) return;
    const selected = data.testCases.find((item) => item.id === selectedCaseId);
    if (!selected) return;
    const next = buildCaseDeepLink(window.location.href, {
      caseId: selected.id,
      projectId: selected.projectId,
    });
    if (next !== window.location.href) window.history.replaceState(null, "", next);
  }, [connection, data.testCases, selectedCaseId]);

  useEffect(() => {
    setRunItems([]);
    setSelectedRunEtag(null);
    setSelectedRunItemDetail(null);
    setSelectedRunItemEtag(null);
    if (connection !== "connected" || !selectedRunId) return;
    const controller = new AbortController();
    Promise.all([
      getRun(http, selectedRunId, controller.signal),
      listRunItems(http, selectedRunId, controller.signal),
    ]).then(([run, items]) => {
      if (controller.signal.aborted) return;
      setData((current) => ({
        ...current,
        runs: current.runs.map((item) => item.id === run.data.id ? run.data : item),
      }));
      setSelectedRunEtag(run.etag);
      setRunItems(items.items);
      setSelectedRunItemId((current) => current && items.items.some((item) => item.id === current)
        ? current
        : (items.items[0]?.id ?? null));
    }).catch(() => {});
    return () => controller.abort();
  }, [connection, http, selectedRunId]);

  useEffect(() => {
    setSelectedRunItemDetail(null);
    setSelectedRunItemEtag(null);
    if (connection !== "connected" || !selectedRunId || !selectedRunItemId) return;
    const controller = new AbortController();
    getRunItem(http, selectedRunId, selectedRunItemId, controller.signal).then((resource) => {
      if (controller.signal.aborted) return;
      setSelectedRunItemDetail(resource.data);
      setSelectedRunItemEtag(resource.etag);
    }).catch(() => {});
    return () => controller.abort();
  }, [connection, http, selectedRunId, selectedRunItemId]);

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
    ...bootstrap, data, setData, connection, view, setView, projectId, setProjectId,
    query, setQuery, selectedCaseId, setSelectedCaseId, selectedSuiteId,
    setSelectedSuiteId, selectedRunId, setSelectedRunId, selectedRunItemId,
    setSelectedRunItemId, dialog, setDialog, ...caseEditor, selectedFolder,
    setSelectedFolder, customFolders, setCustomFolders, caseFilters,
    setCaseFilters, editingSuiteId, setEditingSuiteId, runPresetCaseIds,
    setRunPresetCaseIds, runPresetSuiteId, setRunPresetSuiteId, notice,
    setNotice, collapsedFolders, setCollapsedFolders,
    selectedCaseDetail: selectedCase.detail, setSelectedCaseDetail: selectedCase.setDetail,
    selectedCaseEtag: selectedCase.etag, setSelectedCaseEtag: selectedCase.setEtag,
    selectedCaseDetailError: selectedCase.failed,
    retrySelectedCaseDetail: selectedCase.retry, selectedSuiteDetail: selectedSuite.detail,
    setSelectedSuiteDetail: selectedSuite.setDetail, selectedSuiteEtag: selectedSuite.etag,
    setSelectedSuiteEtag: selectedSuite.setEtag, runItems, setRunItems, selectedRunEtag,
    setSelectedRunEtag, selectedRunItemDetail, setSelectedRunItemDetail,
    selectedRunItemEtag, setSelectedRunItemEtag,
  };
}
