import { useEffect } from "react";
import type { useWorkspaceState } from "../../state/workspace/useWorkspaceState";
import { navigateWorkspace } from "../../state/navigation/browser/workspace-history";
import type { FolderResource } from "../model/folder";

export function useFolderNavigation(state: ReturnType<typeof useWorkspaceState>, resource: FolderResource) {
  useEffect(() => {
    if (state.view !== "cases" || !state.selectedCaseId) return;
    const selected = state.data.testCases.find((item) => item.id === state.selectedCaseId && item.projectId === state.projectId);
    if (!selected) return;
    state.setSelectedFolder(selected.folderPath);
    state.setSelectedFolderId(selected.folderId ?? (selected.folderPath === "/" ? "root" : ""));
  }, [state.view, state.selectedCaseId, state.projectId, state.data.testCases]);
  useEffect(() => {
    if (resource.loading || state.view !== "cases") return;
    const restore = () => {
      const query = new URL(window.location.href).searchParams;
      if (query.get("view") !== "cases" || query.get("projectId") !== state.projectId || query.get("caseId")) return;
      const id = query.get("folderId");
      const folder = resource.items.find((item) => item.id === id);
      state.setSelectedFolderId(id ?? "");
      if (id === "root") state.setSelectedFolder("/");
      else if (folder) state.setSelectedFolder(folder.path);
      else if (!id) state.setSelectedFolder("");
    };
    restore(); window.addEventListener("popstate", restore);
    return () => window.removeEventListener("popstate", restore);
  }, [state.projectId, state.view, resource.items, resource.loading]);
  return (path: string, knownFolderId?: string) => {
    if (state.dialog === "case") return;
    const url = new URL(window.location.href);
    url.searchParams.set("view", "cases"); url.searchParams.delete("caseId");
    const folder = resource.items.find((item) => item.path === path && !item.archivedAt);
    if (knownFolderId || folder) url.searchParams.set("folderId", knownFolderId ?? folder!.id);
    else if (path === "/") url.searchParams.set("folderId", "root");
    else url.searchParams.delete("folderId");
    navigateWorkspace(url.href);
    state.setSelectedFolderId(knownFolderId ?? folder?.id ?? (path === "/" ? "root" : ""));
    state.setSelectedFolder(path); state.setSelectedCaseId("");
  };
}
