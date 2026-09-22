import type { FolderResource, RepositoryFolder } from "../folder";

/** Optional authoring capability. Selection trees never receive it. */
export type RepositoryCreation = {
  activeFolderId: string | null;
  begin: (folderId: string) => void;
  close: () => void;
  create: FolderResource["create"];
  created: (folder: RepositoryFolder) => void;
  createCase: (folderPath: string) => void;
};
