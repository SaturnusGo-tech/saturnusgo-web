import type { FolderScope } from "../../model/folder";

const seenThisSession = new Set<string>();

/** Project scoped because folder resources do not expose the current user. */
export function folderAppearanceTipKey(scope: FolderScope) {
  return `falcon:folder-appearance-tip:v1:${encodeURIComponent(scope.workspaceId)}:${encodeURIComponent(scope.projectId)}`;
}

export function hasSeenFolderAppearanceTip(key: string) {
  if (seenThisSession.has(key)) return true;
  try { return window.localStorage.getItem(key) === "seen"; }
  catch { return false; }
}

export function markFolderAppearanceTipSeen(scope: FolderScope) {
  const key = folderAppearanceTipKey(scope);
  seenThisSession.add(key);
  try { window.localStorage.setItem(key, "seen"); }
  catch { /* The current session still respects the tip when storage is unavailable. */ }
}
