import React from "react";
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { act, create } from "react-test-renderer";
import { useCommentAttachments } from "../useCommentAttachments";
import { AttachmentClientProvider } from "../../../../../attachments/presentation/context/AttachmentClientProvider";
import type { PrivateAttachmentClient } from "../../../../../attachments/application/private-attachment-client";
import type { AttachmentMetadata, UploadPrivateAttachmentInput } from "../../../../../attachments/domain/attachment";
const previousReact = Object.getOwnPropertyDescriptor(globalThis, "React");
before(() => { Object.assign(globalThis, { React }); });
after(() => { if (previousReact) Object.defineProperty(globalThis, "React", previousReact); else Reflect.deleteProperty(globalThis, "React"); });
function ready(id: string): AttachmentMetadata { return { id, projectId: "project-a", owner: { kind: "project", projectId: "project-a" }, kind: "file", originalFilename: "qa.txt", mimeType: "text/plain", trustedExtension: "txt", byteSize: 2, sha256: null, status: "ready", createdAt: "", updatedAt: "" }; }
test("uploads block submission, retain multiple files, and retry only the failed item", async () => {
  let state!: ReturnType<typeof useCommentAttachments>;
  const calls: UploadPrivateAttachmentInput[] = [];
  let complete!: (value: AttachmentMetadata) => void;
  let fail!: (reason: Error) => void;
  const client = { upload: async (input: UploadPrivateAttachmentInput) => { calls.push(input); return new Promise<AttachmentMetadata>((resolve, reject) => { complete = resolve; fail = reject; }); } } as PrivateAttachmentClient;
  function Probe() { state = useCommentAttachments("project-a", [], true); return null; }
  let root!: ReturnType<typeof create>;
  await act(async () => { root = create(<AttachmentClientProvider client={client}><Probe /></AttachmentClientProvider>); });
  await act(async () => state.add([new File(["ok"], "one.txt", { type: "text/plain" }), new File(["ok"], "two.txt", { type: "text/plain" })]));
  assert.equal(state.blocked, true); assert.equal(calls.length, 1);
  assert.deepEqual(calls[0].owner, { kind: "project", projectId: "project-a" });
  await act(async () => complete(ready("attachment_1")));
  assert.equal(calls.length, 2); assert.equal(state.blocked, true);
  await act(async () => fail(new Error("network")));
  assert.equal(state.blocked, true); assert.equal(state.entries[0].id, "attachment_1");
  const failedKey = state.entries[1].key;
  await act(async () => state.retry(failedKey));
  assert.equal(calls[2].operationKey, calls[1].operationKey);
  await act(async () => complete(ready("attachment_2")));
  assert.equal(state.blocked, false); assert.deepEqual(state.references.map(x => x.id), ["attachment_1", "attachment_2"]);
  await act(async () => state.remove(failedKey));
  assert.deepEqual(state.references.map(x => x.id), ["attachment_1"]);
  await act(async () => root.unmount());
});
test("unmount aborts upload and late completion cannot mutate a new draft", async () => {
  let state!: ReturnType<typeof useCommentAttachments>; let signal: AbortSignal | undefined;
  let complete!: (value: AttachmentMetadata) => void;
  const client = { upload: async (input: UploadPrivateAttachmentInput) => { signal = input.signal; return new Promise<AttachmentMetadata>(resolve => { complete = resolve; }); } } as PrivateAttachmentClient;
  function Probe() { state = useCommentAttachments("project-a", [], true); return null; }
  let root!: ReturnType<typeof create>;
  await act(async () => { root = create(<AttachmentClientProvider client={client}><Probe /></AttachmentClientProvider>); });
  await act(async () => state.add([new File(["ok"], "one.txt", { type: "text/plain" })]));
  await act(async () => root.unmount()); assert.equal(signal?.aborted, true);
  await act(async () => { root = create(<AttachmentClientProvider client={client}><Probe /></AttachmentClientProvider>); complete(ready("old_attachment")); });
  assert.deepEqual(state.references, []); assert.equal(state.blocked, false);
  await act(async () => root.unmount());
});
