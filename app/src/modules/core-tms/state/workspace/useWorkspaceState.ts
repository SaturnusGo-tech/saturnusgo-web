import { useEffect, useState } from "react";
import type { TestCaseRevision } from "../../../../core/tms/contracts/legacy-contract";
import { createEmptyRevision } from "../../helpers/cases/caseRevision";
import { useTmsLocale } from "../../localization/context/useTmsLocale";
import type { CaseFilters, Dialog, View } from "../types/workspace";
import { useWorkspaceBootstrap } from "./useWorkspaceBootstrap";

const defaultFilters: CaseFilters = {
  priority: "all",
  lifecycle: "all",
  tag: "",
  includeArchived: false,
};

export function useWorkspaceState() {
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
  const [editing, setEditing] = useState(false);
  const [caseDraft, setCaseDraft] = useState<TestCaseRevision>(() =>
    createEmptyRevision(locale),
  );
  const [caseFolderPath, setCaseFolderPath] = useState("/Unsorted");
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

  useEffect(() => {
    if (connection !== "connected" && connection !== "demo") return;
    const remembered = window.localStorage.getItem("tms.project.v1");
    const active = data.projects.filter((item) => item.status !== "archived");
    const initialProjectId = active.some((item) => item.id === remembered)
      ? remembered!
      : (active[0]?.id ?? "");
    const initialCase = data.testCases.find(
      (item) => item.projectId === initialProjectId && !item.archivedAt,
    );
    setProjectId(initialProjectId);
    setSelectedCaseId(initialCase?.id ?? "");
    setSelectedFolder(initialCase?.folderPath ?? "/Unsorted");
    setSelectedSuiteId(
      data.suites.find((item) => item.projectId === initialProjectId)?.id ?? "",
    );
    setSelectedRunId(
      data.runs.find((item) => item.projectId === initialProjectId)?.id ?? null,
    );
    setNotice(connection === "connected" ? t("actions.workspaceConnected") : "");
  }, [bootstrap.generation]);

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

  useEffect(() => {
    function handleCommandSearch(event: KeyboardEvent) {
      if (
        (event.metaKey || event.ctrlKey) &&
        event.key.toLowerCase() === "k"
      ) {
        event.preventDefault();
        setView("cases");
        window.requestAnimationFrame(() =>
          document.getElementById("tms-command-search")?.focus(),
        );
      }
    }
    window.addEventListener("keydown", handleCommandSearch);
    return () => window.removeEventListener("keydown", handleCommandSearch);
  }, []);

  return {
    ...bootstrap, data, setData, connection, view, setView, projectId, setProjectId,
    query, setQuery, selectedCaseId, setSelectedCaseId, selectedSuiteId,
    setSelectedSuiteId, selectedRunId, setSelectedRunId, selectedRunItemId,
    setSelectedRunItemId, dialog, setDialog, editing, setEditing, caseDraft,
    setCaseDraft, caseFolderPath, setCaseFolderPath, selectedFolder,
    setSelectedFolder, customFolders, setCustomFolders, caseFilters,
    setCaseFilters, editingSuiteId, setEditingSuiteId, runPresetCaseIds,
    setRunPresetCaseIds, runPresetSuiteId, setRunPresetSuiteId, notice,
    setNotice, collapsedFolders, setCollapsedFolders,
  };
}
