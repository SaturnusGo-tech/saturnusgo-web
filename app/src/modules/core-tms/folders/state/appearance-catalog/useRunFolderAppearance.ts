import { useEffect } from "react";
import { useFolderAppearanceContext } from "../appearance/folder-appearance-context";

export function useRunFolderAppearance(projectIds: readonly string[]) {
  const context = useFolderAppearanceContext(); const key = JSON.stringify([...new Set(projectIds)].sort());
  useEffect(() => {
    const controller = new AbortController();
    void context.loadProjects?.([...new Set(projectIds)], controller.signal);
    return () => controller.abort();
  }, [context.loadProjects, key]);
  return context.folders;
}
