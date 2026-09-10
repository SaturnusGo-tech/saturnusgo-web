import assert from "node:assert/strict";
import test from "node:test";
import { saveCaseWithAttachments, type CaseSaveCheckpoint } from "../saveCaseWithAttachments";
import type { TestCase } from "../../../../../../../core/tms/contracts/legacy-contract";
import type { PrivateAttachmentClient } from "../../../../../attachments/application/private-attachment-client";
import type { UploadPrivateAttachmentInput, AttachmentMetadata } from "../../../../../attachments/domain/attachment";

const saved = { data: { id: "case-a", projectId: "project-a", currentRevision: 4 } as TestCase, etag: '"case-a:4"' };
const files = ["Screenshot.png", "File.pdf"].map((name, index) => ({
  id: `file-${index}`, fieldKey: `step:step-${index}:action`, stepId: `step-${index}`,
  file: new File([name], name, { type: index ? "application/pdf" : "image/png" }),
}));
const checkpoint = (): CaseSaveCheckpoint => ({ key: "case-save-123", saved: null, completed: new Set() });
const client = (upload: PrivateAttachmentClient["upload"]) => ({ upload } as PrivateAttachmentClient);
const ready = { id: "attachment", status: "ready" } as AttachmentMetadata;

test("save stays pending until file finalization and authoritative reload complete", async () => {
  let release!: () => void;
  const gate = new Promise<void>((resolve) => { release = resolve; });
  const events: string[] = [];
  let finished = false;
  const job = saveCaseWithAttachments({ checkpoint: checkpoint(), files: files.slice(0, 1),
    client: client(async (input) => { events.push("upload"); input.onProgress?.("uploading"); await gate; events.push("finalized"); return ready; }),
    save: async () => { events.push("revision"); return saved; },
    reload: async () => { events.push("reload"); return saved; },
  }).then(() => { finished = true; });
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(finished, false); assert.deepEqual(events, ["revision", "upload"]);
  release(); await job;
  assert.deepEqual(events, ["revision", "upload", "finalized", "reload"]);
});

test("retry preserves exact revision and completed files after a partial failure", async () => {
  const state = checkpoint(); const uploads: UploadPrivateAttachmentInput[] = [];
  const phases: string[] = []; let writes = 0; let failure = true;
  const input = { checkpoint: state, files,
    save: async () => { writes++; return saved; }, reload: async () => saved,
    client: client(async (value) => { uploads.push(value); value.onProgress?.("uploading");
      if (failure && value.file.name === "File.pdf") throw new Error("network interrupted"); return ready; }),
    onProgress: (id: string, phase: string) => phases.push(`${id}:${phase}`),
  };
  await assert.rejects(saveCaseWithAttachments(input), /network interrupted/);
  assert.equal(state.saved, saved); assert.deepEqual([...state.completed], ["file-0"]);
  assert.ok(phases.includes("file-1:error")); failure = false;
  await saveCaseWithAttachments(input);
  assert.equal(writes, 1);
  assert.deepEqual(uploads.map((value) => value.file.name), ["Screenshot.png", "File.pdf", "File.pdf"]);
  assert.equal(uploads[1].operationKey, uploads[2].operationKey);
  assert.deepEqual(uploads[2].owner, { kind: "test_case_revision", caseId: "case-a", revisionNo: 4, stepId: "step-1" });
});

test("a refresh failure retries only the read, never the revision or finalized attachments", async () => {
  let writes = 0; let uploads = 0; let reads = 0;
  const input = { checkpoint: checkpoint(), files, client: client(async () => { uploads++; return ready; }),
    save: async () => { writes++; return saved; }, reload: async () => { if (++reads === 1) throw new Error("refresh failed"); return saved; },
  };
  await assert.rejects(saveCaseWithAttachments(input), /refresh failed/);
  await saveCaseWithAttachments(input);
  assert.deepEqual({ writes, uploads, reads }, { writes: 1, uploads: 2, reads: 2 });
});
