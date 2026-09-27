import assert from "node:assert/strict";
import test from "node:test";
import { uploadBuildFile } from "../../application/build-upload";
import { createPrivateAttachmentClient } from "../../../../attachments/application/private-attachment-client";
import type { AttachmentTransportPort, CreateUploadIntentInput } from "../../../../attachments/application/attachment-transport-port";
import { buildArtifact } from "../support/build-fixture";

test("APK and unknown browser MIME types upload binary content unchanged under the project owner", async () => {
  for (const [name, type, expected] of [["release.apk", "application/vnd.android.package-archive", "application/zip"],
    ["bundle.zip", "application/x-zip-compressed", "application/zip"], ["build.custom", "application/x-custom", "application/octet-stream"],
    ["release.png", "image/png", "application/octet-stream"], ["release.gz", "application/x-gzip", "application/gzip"]]) {
    let declaration!: CreateUploadIntentInput; let transferred!: File; const phases: string[] = [];
    const transport: AttachmentTransportPort = {
      getMetadata: async () => { throw new Error("Unused"); }, remove: async () => { throw new Error("Unused"); },
      createAccess: async () => { throw new Error("Unused"); },
      createUploadIntent: async (input) => { declaration = input; return { etag: '"attachment:1"', intent: {
        intentId: "intent-a", attachmentId: "artifact-a", method: "PUT", uploadUrl: "https://storage.example/upload",
        headers: {}, expiresAt: "2030-01-01T00:00:00Z", mimeType: input.mimeType, maxBytes: 500 * 1024 * 1024,
      } }; },
      uploadPrivateObject: async (_intent, file) => { transferred = file; return '"storage-etag"'; },
      finalizeUpload: async (input) => { assert.equal(input.storageETag, '"storage-etag"'); return buildArtifact(); },
    };
    const client = createPrivateAttachmentClient({ transport, digest: async () => "a".repeat(64) });
    await uploadBuildFile(client, "project-a", new File([new Uint8Array([0, 255, 42])], name, { type }),
      "build-upload-operation", new AbortController().signal, phase => phases.push(phase));
    assert.deepEqual(declaration.owner, { kind: "project", projectId: "project-a" });
    assert.equal(declaration.kind, "file");
    assert.equal(declaration.mimeType, expected); assert.equal(declaration.originalFilename, name);
    assert.equal(transferred.type, expected); assert.equal(transferred.name, name);
    assert.deepEqual([...new Uint8Array(await transferred.arrayBuffer())], [0, 255, 42]);
    assert.deepEqual(phases, ["preparing", "uploading", "finalizing", "ready"]);
  }
});
