import { useEffect, useState } from "react";
import type { FolderScope } from "../../model/folder";
import { folderAppearanceTipKey, hasSeenFolderAppearanceTip, markFolderAppearanceTipSeen } from "./appearance-tip-storage";

export function useFolderAppearanceTip(scope: FolderScope | undefined, eligible: boolean) {
  const key = scope ? folderAppearanceTipKey(scope) : "";
  const [visibleFor, setVisibleFor] = useState("");
  useEffect(() => {
    if (!eligible || !scope) return;
    if (hasSeenFolderAppearanceTip(key)) return;
    setVisibleFor(key);
    markFolderAppearanceTipSeen(scope);
  }, [eligible, key, scope?.workspaceId, scope?.projectId]);
  return { visible: eligible && Boolean(key) && visibleFor === key, dismiss: () => setVisibleFor("") };
}
