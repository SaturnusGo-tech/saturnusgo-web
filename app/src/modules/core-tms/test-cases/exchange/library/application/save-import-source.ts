import type { TmsHttpClient } from "../../../../../../core/tms/transport/http";
import type { PrivateAttachmentClient } from "../../../../attachments/application/private-attachment-client";
import { importFileApi } from "../data/import-files";
import type { ImportFile, SaveImportSource } from "../model/import-file";

/** Keeps a finalized upload on receipt failure, so Retry never uploads a second original. */
export function createImportSourceSaver(http: TmsHttpClient, client: PrivateAttachmentClient,
  onSaved: (receipt: ImportFile) => void): SaveImportSource {
  const attempts = new WeakMap<File, { key: string; scope: string; id?: string; saved?: boolean }>();
  return async (file, scope, folderId, signal) => {
    const identity = JSON.stringify([scope.workspaceId, scope.projectId, folderId]);
    let attempt = attempts.get(file);
    if (attempt && attempt.scope !== identity) throw new Error("Import destination changed after upload started.");
    if (!attempt) {
      attempt = { key: `case-import:${crypto.randomUUID()}`, scope: identity };
      attempts.set(file, attempt);
    }
    if (attempt.saved) return;
    if (!attempt.id) {
      const extension = file.name.toLowerCase().split(".").pop();
      const mimeType = extension === "json" ? "application/json" as const
        : ["csv", "tsv", "xml"].includes(extension ?? "") ? "text/plain" as const
        : extension === "xls" || extension === "xlsx" ? "application/octet-stream" as const : null;
      if (!mimeType) throw new Error("Unsupported import file format.");
      const metadata = await client.upload({ projectId: scope.projectId,
        owner: { kind: "project", projectId: scope.projectId }, kind: "file", mimeType,
        file: new File([file], file.name, { type: mimeType, lastModified: file.lastModified }),
        operationKey: attempt.key, signal });
      attempt.id = metadata.id;
    }
    signal.throwIfAborted();
    const receipt = await importFileApi.save(http, scope, attempt.id, folderId, signal);
    attempt.saved = true;
    onSaved(receipt);
  };
}
