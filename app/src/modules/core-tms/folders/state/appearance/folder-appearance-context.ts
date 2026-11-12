import { createContext, useContext } from "react";
import type { RepositoryFolder, FolderResource } from "../../model/folder";
export type FolderAppearanceContextValue = {
  folders: readonly RepositoryFolder[];
  workspaceId?: string;
  projectId?: string;
  loadProjects?: (projectIds: readonly string[], signal: AbortSignal) => Promise<void>;
  save?: FolderResource["saveAppearance"];
  upload?: (folder: RepositoryFolder, file: File, key: string, signal: AbortSignal) => Promise<string>;
  read?: (assetId: string, signal: AbortSignal) => Promise<{ url: string; expiresAt: string }>;
};
export const FolderAppearanceContext = createContext<FolderAppearanceContextValue>({ folders: [] });
export const useFolderAppearanceContext = () => useContext(FolderAppearanceContext);
