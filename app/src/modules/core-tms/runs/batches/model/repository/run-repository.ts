import type { RunItemSummary, TestCaseSummary } from "../../../../../../core/tms/contracts/legacy-contract";
import type { RepositoryFolder } from "../../../../folders/model/folder";
export type RunRepositoryEntry = { runId: string; projectId: string; item: RunItemSummary; testCase: TestCaseSummary };
export function runRepositoryEntries(runId: string, projectId: string, items: RunItemSummary[]): RunRepositoryEntry[] {
  return items.map((item) => {
    const p = item.preview;
    return { runId, projectId, item, testCase: { id: item.id, projectId, key: item.caseKey,
      title: p?.title ?? item.caseKey, folderPath: p?.folderPath ?? "/", currentRevision: item.revision,
      type: p?.type ?? "manual", lifecycle: p?.lifecycle ?? "ready", priority: p?.priority ?? "medium",
      component: p?.component ?? "", tags: p?.tags ?? [], estimatedMinutes: p?.estimatedMinutes ?? null,
      ownerIdentityId: item.assigneeIdentityId, revisionCount: item.revision, archivedAt: null,
      createdAt: item.createdAt, updatedAt: item.updatedAt, etag: "" } };
  });
}
export function runRepositoryFolders(workspaceId: string, projectId: string, cases: TestCaseSummary[]): RepositoryFolder[] {
  const folders = new Map<string, RepositoryFolder>();
  for (const item of cases) {
    const segments = item.folderPath.split("/").filter(Boolean); let path = ""; let parentId: string | null = null;
    for (const name of segments) {
      path += `/${name}`; const id = `${projectId}:${path}`;
      if (!folders.has(id)) folders.set(id, { id, workspaceId, projectId, parentId, name, path,
        archivedAt: null, etag: "", rowVersion: 1, createdAt: item.createdAt, updatedAt: item.updatedAt });
      parentId = id;
    }
  }
  return [...folders.values()];
}
