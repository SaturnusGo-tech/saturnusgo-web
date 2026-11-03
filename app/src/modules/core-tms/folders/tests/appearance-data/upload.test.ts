import assert from "node:assert/strict";
import { test } from "node:test";
import type { TmsHttpClient } from "../../../../../core/tms/transport/http";
import type { PrivateAttachmentClient } from "../../../attachments/application/private-attachment-client";
import type { RepositoryFolder } from "../../model/folder";
import { uploadFolderImage } from "../../data/appearance/folder-image-upload";
const folder = { id: "folder-a", workspaceId: "workspace-a", projectId: "project-a" } as RepositoryFolder;

test("image upload normalizes HEIC with authenticated binary transport and preserves GIF through folder-owned upload", async () => {
  const calls: { path: string; blob: Blob; signal: AbortSignal | undefined }[] = []; const uploads: any[] = [];
  let type = "image/png"; const bytes = new Uint8Array([71, 73, 70, 56, 57, 97, 0]);
  const http = { binary: async (path: string, blob: Blob, signal: AbortSignal) => {
    calls.push({ path, blob, signal }); return new Response(bytes, { headers: { "content-type": type, "x-content-sha256": "a".repeat(64) } });
  } } as unknown as TmsHttpClient;
  const attachments = { upload: async (input: any) => { uploads.push(input); return { id: "asset-ready" }; } } as PrivateAttachmentClient;
  const signal = new AbortController().signal;
  assert.equal(await uploadFolderImage(http, attachments, folder, new File([bytes], "phone.heic", { type: "image/heic" }), "stable-operation", signal), "asset-ready");
  assert.equal(calls[0]?.path, "/workspaces/workspace-a/projects/project-a/folders/folder-a/normalize-image");
  assert.equal(calls[0]?.blob.type, "image/heic"); assert.equal(calls[0]?.signal, signal);
  assert.deepEqual(uploads[0].owner, { kind: "repository_folder", folderId: "folder-a" });
  assert.equal(uploads[0].file.type, "image/png"); assert.equal(uploads[0].operationKey, "stable-operation");
  type = "image/gif";
  await uploadFolderImage(http, attachments, folder, new File([bytes], "animated.gif", { type }), "gif-operation", signal);
  assert.equal(uploads[1].mimeType, "image/gif"); assert.equal(uploads[1].file.name, "animated.gif");
  assert.deepEqual(new Uint8Array(await uploads[1].file.arrayBuffer()), bytes);
});

test("unsupported, oversized, corrupt and cancelled images never enter immutable upload identity", async () => {
  let binary = 0, writes = 0; const abort = new AbortController();
  const http = { binary: async () => { binary++; throw new Error("Corrupt image"); } } as unknown as TmsHttpClient;
  const attachments = { upload: async () => { writes++; return {}; } } as unknown as PrivateAttachmentClient;
  await assert.rejects(uploadFolderImage(http, attachments, folder, new File(["x"], "unsafe.svg", { type: "image/svg+xml" }), "bad", abort.signal));
  await assert.rejects(uploadFolderImage(http, attachments, folder, new File([new Uint8Array(10_485_761)], "large.png", { type: "image/png" }), "large", abort.signal));
  assert.equal(binary, 0);
  await assert.rejects(uploadFolderImage(http, attachments, folder, new File(["x"], "broken.png", { type: "image/png" }), "corrupt", abort.signal), /Corrupt/);
  const cancelled = { binary: async () => { abort.abort(); return new Response("gif", { headers: { "content-type": "image/gif" } }); } } as unknown as TmsHttpClient;
  await assert.rejects(uploadFolderImage(cancelled, attachments, folder, new File(["gif"], "animated.gif", { type: "image/gif" }), "cancel", abort.signal), { name: "AbortError" });
  assert.equal(writes, 0);
});
