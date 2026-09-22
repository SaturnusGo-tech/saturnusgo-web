import { TEST_CASE_IMPORT_BYTES } from "../../model/test-case-exchange";
import type { PrivateAttachmentClient } from "../../../../attachments/application/private-attachment-client";

export async function readImportFile(client: PrivateAttachmentClient, id: string, signal: AbortSignal) {
  const access = await client.createAccess({ attachmentId: id, disposition: "inline", signal });
  const response = await fetch(access.url, { signal, credentials: "omit", redirect: "error", cache: "no-store" });
  if (!response.ok) throw new Error("FILE_UNAVAILABLE");
  const text = await response.text();
  signal.throwIfAborted();
  if (new Blob([text]).size > TEST_CASE_IMPORT_BYTES) throw new Error("FILE_TOO_LARGE");
  try { return JSON.stringify(JSON.parse(text.replace(/^\uFEFF/, "")), null, 2); }
  catch { return text; }
}
