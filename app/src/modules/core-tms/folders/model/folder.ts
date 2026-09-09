import type { components } from "../../../../core/tms/generated/tms-api";

export type RepositoryFolder = components["schemas"]["RepositoryFolder"];
export type FolderScope = Readonly<{ workspaceId: string; projectId: string }>;
export type FolderMutationResult = { ok: true } | { ok: false; message: string };
export type FolderResource = {
  items: readonly RepositoryFolder[];
  loading: boolean;
  error: string;
  busy: boolean;
  canManage: boolean;
  reload: () => void;
  create: (name: string, parentId: string | null) => Promise<RepositoryFolder | null>;
  update: (folder: RepositoryFolder, patch: { name?: string; parentId?: string | null }) => Promise<boolean>;
  archive: (folder: RepositoryFolder) => Promise<boolean>;
  restore: (folder: RepositoryFolder) => Promise<boolean>;
  moveCases: (ids: readonly string[], targetFolderId: string | null) => Promise<FolderMutationResult>;
  archiveCases: (ids: readonly string[]) => Promise<FolderMutationResult>;
};
