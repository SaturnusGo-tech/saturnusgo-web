import assert from "node:assert/strict";
import test from "node:test";
import { createBuildDraftStore } from "../../application/build-draft-store";
import type { AttachmentMetadata } from "../../../../attachments/domain/attachment";
import { buildArtifact, buildClient, buildFile, tick } from "../support/build-fixture";

test("parallel project drafts retain independent files, versions, and payloads", async () => {
  const releases = new Map<string, (value: AttachmentMetadata) => void>();
  const f = buildClient((input) => new Promise(resolve => releases.set(input.projectId!, resolve)));
  const store = createBuildDraftStore(f.client, () => {}, false);
  store.setAndroidVersion("project-a", "Android A"); store.setIosReference("project-b", "TestFlight B");
  store.chooseFile("project-a", buildFile()); store.chooseFile("project-b", buildFile());
  assert.equal(store.uploading(), true); assert.match(store.validationError(["project-a"]), /Upload/);
  releases.get("project-b")!(buildArtifact("project-b")); await tick();
  assert.equal(store.current("project-a").artifact, null);
  releases.get("project-a")!(buildArtifact()); await tick();
  assert.deepEqual(store.selection("project-a"), [{ platform: "android", attachmentId: "artifact-project-a", version: "Android A" }]);
  assert.deepEqual(store.selection("project-b"), [{ platform: "android", attachmentId: "artifact-project-b" }, { platform: "ios", reference: "TestFlight B" }]);
  assert.equal(store.uploading(), false); store.dispose(); await tick();
  assert.deepEqual(f.removed.sort(), ["artifact-project-a", "artifact-project-b"]);
});

test("an upload retry reuses its operation key and preserves the chosen file", async () => {
  let attempts = 0;
  const f = buildClient(async () => { if (++attempts === 1) throw new Error("Network"); return buildArtifact(); });
  const store = createBuildDraftStore(f.client, () => {}, false); store.chooseFile("project-a", buildFile()); await tick();
  assert.equal(store.current("project-a").phase, "error"); assert.ok(store.current("project-a").error);
  store.retryUpload("project-a"); await tick(); assert.equal(store.current("project-a").phase, "ready");
  assert.equal(f.calls[0].operationKey, f.calls[1].operationKey); assert.equal(f.calls[0].file.name, "release.apk");
  store.dispose();
});

test("cancel aborts transfer, clears the file, and removes a late completed artifact", async () => {
  let resolve!: (value: AttachmentMetadata) => void;
  const f = buildClient(() => new Promise(done => { resolve = done; }));
  const store = createBuildDraftStore(f.client, () => {}, false); store.chooseFile("project-a", buildFile());
  store.removeFile("project-a"); assert.equal(f.calls[0].signal!.aborted, true);
  assert.equal(store.current("project-a").file, null);
  resolve(buildArtifact()); await tick();
  assert.equal(store.current("project-a").artifact, null); assert.deepEqual(f.removed, ["artifact-project-a"]);
  assert.deepEqual(store.selection("project-a"), []); store.dispose();
});

test("cancel observes finalization without aborting it, then cleans up the stored orphan", async () => {
  let resolve!: (value: AttachmentMetadata) => void;
  const f = buildClient((input) => { input.onProgress?.("finalizing"); return new Promise(done => { resolve = done; }); });
  const store = createBuildDraftStore(f.client, () => {}, false); store.chooseFile("project-a", buildFile());
  store.removeFile("project-a"); assert.equal(f.calls[0].signal!.aborted, false);
  resolve(buildArtifact()); await tick(); assert.deepEqual(f.removed, ["artifact-project-a"]); store.dispose();
});
