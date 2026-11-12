import { useFolderAppearanceCatalog } from "../../../state/appearance-catalog/useFolderAppearanceCatalog";
import type { ReactNode } from "react";
import type { FolderResource } from "../../../model/folder";
import { FolderAppearanceContext } from "../../../state/appearance/folder-appearance-context";
import { useFolderImageOperations } from "../../../state/appearance/useFolderImageOperations";

export function FolderAppearanceProvider({ resource, workspaceId, projectId, children }: { resource: FolderResource; workspaceId: string; projectId?: string; children: ReactNode }) {
  const images = useFolderImageOperations();
  const catalog = useFolderAppearanceCatalog(workspaceId, resource.items, projectId);
  return <FolderAppearanceContext.Provider value={{ ...catalog, workspaceId, projectId,
    save: resource.canManage ? resource.saveAppearance : undefined, ...images }}>{children}</FolderAppearanceContext.Provider>;
}
