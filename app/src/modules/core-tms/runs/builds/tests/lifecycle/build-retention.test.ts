import assert from "node:assert/strict";
import test from "node:test";
import { createBuildDraftStore } from "../../application/build-draft-store";
import { buildArtifact, buildClient, buildFile, tick } from "../support/build-fixture";

test("saved, in-flight, and uncertain run creation retain artifacts when the dialog closes", async () => {
  for (const outcome of ["saved", "uncertain", "pending"] as const) {
    const f = buildClient(); const store = createBuildDraftStore(f.client, () => {}, false);
    store.chooseFile("project-a", buildFile()); await tick(); const ids = store.beginSubmission(["project-a"]);
    if (outcome !== "pending") store.settleSubmission(ids, outcome);
    store.dispose(); await tick(); assert.deepEqual(f.removed, [], outcome);
  }
});

test("definite run rejection permits cleanup but cannot undo an earlier uncertain response", async () => {
  for (const uncertain of [false, true]) {
    const f = buildClient(); const store = createBuildDraftStore(f.client, () => {}, false);
    store.chooseFile("project-a", buildFile()); await tick(); const ids = store.beginSubmission(["project-a"]);
    if (uncertain) store.settleSubmission(ids, "uncertain");
    store.settleSubmission(ids, "rejected"); store.dispose(); await tick();
    assert.deepEqual(f.removed, uncertain ? [] : ["artifact-project-a"]);
  }
});

test("successful creation retains only artifacts included in that request", async () => {
  const f = buildClient(); const store = createBuildDraftStore(f.client, () => {}, false);
  store.chooseFile("project-a", buildFile()); store.chooseFile("project-b", buildFile()); await tick();
  store.settleSubmission(store.beginSubmission(["project-a"]), "saved"); store.dispose(); await tick();
  assert.deepEqual(f.removed, ["artifact-project-b"]);
});

test("replacing an unsubmitted ready file cleans only its old artifact", async () => {
  let attempt = 0; const f = buildClient(async () => buildArtifact("project-a", `artifact-${++attempt}`));
  const store = createBuildDraftStore(f.client, () => {}, false);
  store.chooseFile("project-a", buildFile()); await tick(); store.chooseFile("project-a", buildFile()); await tick();
  assert.deepEqual(f.removed, ["artifact-1"]); assert.equal(store.current("project-a").artifact?.id, "artifact-2"); store.dispose();
});

test("a definite rejection received after unmount releases and cleans its staged artifact", async () => {
  const f = buildClient(); const store = createBuildDraftStore(f.client, () => {}, false);
  store.chooseFile("project-a", buildFile()); await tick(); const ids = store.beginSubmission(["project-a"]);
  store.dispose(); await tick(); assert.deepEqual(f.removed, []);
  store.settleSubmission(ids, "rejected"); await tick(); assert.deepEqual(f.removed, ["artifact-project-a"]);
});

test("discarding an upload after a lost finalization response resolves it before cleanup", async () => {
  let attempt = 0;
  const f = buildClient(async (input) => {
    input.onProgress?.("finalizing"); if (++attempt === 1) throw new Error("Response lost after finalization"); return buildArtifact();
  });
  const store = createBuildDraftStore(f.client, () => {}, false);
  store.chooseFile("project-a", buildFile()); await tick(); assert.equal(store.current("project-a").phase, "error");
  store.removeFile("project-a"); await tick(); assert.equal(f.calls[0].operationKey, f.calls[1].operationKey);
  assert.deepEqual(f.removed, ["artifact-project-a"]); store.dispose();
});
