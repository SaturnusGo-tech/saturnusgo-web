import type { TestCaseSummary } from "../../../../../core/tms/contracts/legacy-contract";
import type { RepositoryFolder } from "../folder";

/** IDs distinguish an archived folder from a new folder that reuses its path. */
export function repositoryScope(folders: readonly RepositoryFolder[], selectedId: string | undefined, path: string) {
  const selected = folders.find((folder) => folder.id === selectedId);
  const ids = new Set<string>();
  if (selected) {
    ids.add(selected.id);
    let changed = true;
    while (changed) {
      changed = false;
      for (const folder of folders) {
        if (folder.parentId && ids.has(folder.parentId) && !ids.has(folder.id)) { ids.add(folder.id); changed = true; }
      }
    }
  }
  return {
    archived: Boolean(selected?.archivedAt),
    includes(testCase: TestCaseSummary) {
      if (selected) return Boolean(testCase.folderId && ids.has(testCase.folderId));
      if (!path) return true;
      if (path === "/") return !testCase.folderId && testCase.folderPath === "/";
      return testCase.folderPath === path || testCase.folderPath.startsWith(`${path}/`);
    },
  };
}
