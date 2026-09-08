import assert from "node:assert/strict";
import test from "node:test";
import type { PrivateAttachmentClient } from "../../../attachments/application/private-attachment-client";
import type { AttachmentMetadata, UploadPrivateAttachmentInput } from "../../../attachments/domain/attachment";
import type { SharedStep, SharedStepDraft } from "../../model/shared-step";
import { saveSharedStepAssets, type SharedStepSaveCheckpoint } from "../../application/attachments/save-shared-step-assets";

const draft: SharedStepDraft = { title: "Login", changeNote: "", items: [
  { id: "item-a", order: 1, action: "Open", expectedResult: "Visible", testData: "", required: true, attachmentIds: [] },
  { id: "item-b", order: 2, action: "Verify", expectedResult: "Correct", testData: "", required: true, attachmentIds: [] },
] };
const saved = { id: "shared-a", projectId: "project-a", currentRevision: 4 } as SharedStep;
const entries = [
  { id: "file-a", fieldKey: "step:item-a:action", stepId: "item-a", file: new File(["image"], "reference.png", { type: "image/png" }) },
  { id: "file-b", fieldKey: "step:item-b:expected", stepId: "item-b", file: new File(["report"], "data.pdf", { type: "application/pdf" }) },
];
const checkpoint = (): SharedStepSaveCheckpoint => ({ operationKey: "shared-save-1", saved: null, uploaded: new Set() });

test("uploads each file to its exact shared item and reloads authoritative asset IDs", async () => {
  const uploads: UploadPrivateAttachmentInput[] = [];
  const client = { upload: async (input: UploadPrivateAttachmentInput) => {
    uploads.push(input); return { id: "asset" } as AttachmentMetadata;
  } } as PrivateAttachmentClient;
  let saves = 0;
  let reloads = 0;
  await saveSharedStepAssets({ draft, entries, checkpoint: checkpoint(), client,
    save: async (_, key) => { assert.equal(key, "shared-save-1"); saves++; return saved; },
    reload: async (id) => { assert.equal(id, saved.id); reloads++; return saved; } });
  assert.equal(saves, 1); assert.equal(reloads, 1);
  assert.deepEqual(uploads.map(({ owner }) => owner), entries.map(({ stepId }) => ({
    kind: "shared_step_revision", sharedStepId: "shared-a", revisionNo: 4, stepId,
  })));
  assert.deepEqual(uploads.map(({ kind }) => kind), ["screenshot", "file"]);
});

test("retry after partial upload keeps the same revision and upload idempotency key", async () => {
  const state = checkpoint();
  const keys: string[] = [];
  let fail = true;
  let saves = 0;
  const input = { draft, entries, checkpoint: state,
    client: { upload: async (value: UploadPrivateAttachmentInput) => {
      keys.push(value.operationKey);
      if (value.file.name === "data.pdf" && fail) throw new Error("Connection interrupted");
      return { id: "asset" } as AttachmentMetadata;
    } } as PrivateAttachmentClient,
    save: async () => { saves++; return saved; }, reload: async () => saved };
  await assert.rejects(saveSharedStepAssets(input));
  assert.equal(state.saved, saved); assert.deepEqual([...state.uploaded], ["file-a"]);
  fail = false;
  await saveSharedStepAssets(input);
  assert.equal(saves, 1);
  assert.deepEqual(keys, ["shared-save-1:file-a:0", "shared-save-1:file-b:0", "shared-save-1:file-b:0"]);
});

test("removed steps and attachment overflow fail before saving or uploading", async () => {
  const input = { draft, entries: [{ ...entries[0], stepId: "removed" }], checkpoint: checkpoint(),
    client: {} as PrivateAttachmentClient, save: async () => { assert.fail("must not save"); }, reload: async () => saved };
  await assert.rejects(saveSharedStepAssets(input), /Invalid shared-step/);
  await assert.rejects(saveSharedStepAssets({ ...input, entries: Array.from({ length: 21 }, () => entries[0]) }), /Invalid shared-step/);
});
