import assert from "node:assert/strict";
import test from "node:test";
import { buildSelection, emptyBuildDraft, platformBuildError } from "../../model/platform-build";
import { buildFileError } from "../../application/build-upload";
import { buildArtifact, buildFile } from "../support/build-fixture";
import { mapRun } from "../../../data/run-mapper";
import { iosReferenceError } from "../../model/ios-reference";
import type { components } from "../../../../../../core/tms/generated/tms-api";

test("platforms are optional, Android version requires a ready project artifact, iOS accepts text", () => {
  const draft = emptyBuildDraft(); assert.deepEqual(buildSelection(draft, "project-a", false), []);
  draft.iosReference = "  TestFlight 2.4 (124)  ";
  assert.deepEqual(buildSelection(draft, "project-a", false), [{ platform: "ios", reference: "TestFlight 2.4 (124)" }]);
  draft.androidVersion = "2.4";
  assert.match(platformBuildError(draft, "project-a", false), /Upload/);
  draft.file = buildFile(); assert.match(platformBuildError(draft, "project-a", false), /Upload/);
  draft.artifact = buildArtifact("project-b"); assert.match(platformBuildError(draft, "project-a", false), /this project/);
  draft.artifact = { ...buildArtifact(), status: "pending" }; assert.match(platformBuildError(draft, "project-a", false), /ready/);
  draft.artifact = buildArtifact();
  assert.deepEqual(buildSelection(draft, "project-a", false), [
    { platform: "android", attachmentId: draft.artifact.id, version: "2.4" },
    { platform: "ios", reference: "TestFlight 2.4 (124)" },
  ]);
  draft.androidVersion = "";
  assert.equal("version" in buildSelection(draft, "project-a", false)[0], false);
});

test("file and reference limits reject invalid drafts before upload", () => {
  const draft = { ...emptyBuildDraft(), androidVersion: "x".repeat(201) };
  assert.match(platformBuildError(draft, "project-a", false), /200/);
  draft.androidVersion = ""; draft.iosReference = "x".repeat(501);
  assert.match(platformBuildError(draft, "project-a", false), /500/);
  assert.match(buildFileError(new File([], "empty.apk"), false), /empty/);
  assert.match(buildFileError({ size: 500 * 1024 * 1024 + 1 } as File, false), /500 MiB/);
  assert.equal(buildFileError({ size: 500 * 1024 * 1024 } as File, false), "");
});

test("iOS accepts version text and HTTP(S), rejecting malformed and credential-bearing links", () => {
  for (const reference of ["", "2.4.0 (124)", "TestFlight 124", "https://testflight.apple.com/join/abc", "http://example.test/app"]) {
    assert.equal(iosReferenceError(reference, false), "", reference);
  }
  for (const reference of ["javascript:alert(1)", "ftp://example.test/app", "https:example.test", "//example.test", "https://user:pass@example.test", "https://example.test/with space", "a\nb"]) {
    assert.ok(iosReferenceError(reference, false), reference);
  }
});

test("run mapper keeps legacy references and copies optional platform snapshots", () => {
  const time = "2026-09-27T00:00:00Z";
  const dto: components["schemas"]["Run"] = {
    id: "run-a", projectId: "project-a", key: "QA-TR-1", name: "Release", description: "", type: "ad_hoc", status: "draft",
    environment: { id: null, key: "", name: "", baseUrl: "", variableKeys: [] }, suiteId: null, suiteResolutionId: null,
    build: "legacy-42", configuration: { legacy: "yes" }, itemCount: 1, attachmentIds: [], createdBy: "identity-a",
    progress: { total: 1, executed: 0, percent: 0, counts: { not_run: 1, in_progress: 0, passed: 0, failed: 0, blocked: 0, skipped: 0 } },
    startedAt: null, completedAt: null, abortedAt: null, abortReason: null, archivedAt: null, archivedBy: null, archiveReason: null,
    createdAt: time, updatedAt: time, elapsedMilliseconds: 0, activeSince: null, measuredAt: time,
  };
  assert.equal(mapRun(dto).build, "legacy-42"); assert.deepEqual(mapRun(dto).platformBuilds, []);
  dto.platformBuilds = [{ platform: "android", attachmentId: "artifact-a", version: "42", fileName: "release.apk", byteSize: 3 }];
  const run = mapRun(dto); assert.deepEqual(run.platformBuilds, dto.platformBuilds);
  assert.notEqual(run.platformBuilds, dto.platformBuilds); assert.notEqual(run.platformBuilds![0], dto.platformBuilds[0]);
  assert.equal(run.configuration.legacy, "yes");
});
