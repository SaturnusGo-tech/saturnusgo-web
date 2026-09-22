export type ImportScope = Readonly<{ workspaceId: string; projectId: string }>;
export type ImportFile = ImportScope & Readonly<{
  id: string; fileName: string; byteSize: number; folderId: string | null;
  destinationPath: string; authorId: string; createdAt: string;
  available: boolean; deleted: boolean;
}>;
export type SaveImportSource = (file: File, scope: ImportScope, folderId: string | null, signal: AbortSignal) => Promise<void>;
