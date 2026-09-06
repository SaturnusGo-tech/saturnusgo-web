import assert from "node:assert/strict";
import test from "node:test";

import {
  canReuseYouTrackToken,
  configurationInput,
  draftFromConfiguration,
  validateYouTrackDraft,
  type YouTrackConfiguration,
} from "../model/youtrack-settings";

const configuration: YouTrackConfiguration = {
  workspaceId: "workspace-a",
  enabled: true,
  source: "workspace",
  baseUrl: "https://youtrack.example/",
  tokenConfigured: true,
  targets: {
    android: { projectId: "1-1", shortName: "ANDROID", name: "Android" },
    ios: { projectId: "1-2", shortName: "IOS", name: "iOS" },
    backend: { projectId: "1-3", shortName: "BACK", name: "Backend" },
  },
  readyForTestStatuses: ["Test", "Acceptance", "Staging"],
  acceptedStage: "Done",
  connection: { status: "connected", checkedAt: null, lastErrorCode: null },
  rowVersion: 3,
};

test("YouTrack configuration drafts never expose or overwrite a stored token", () => {
  const draft = draftFromConfiguration(configuration);
  assert.equal(draft.apiToken, "");
  assert.equal(validateYouTrackDraft(draft, configuration.tokenConfigured), null);
  assert.equal("apiToken" in configurationInput(draft), false);
});

test("tenant defaults become a blank first-connection draft", () => {
  const draft = draftFromConfiguration({
    ...configuration,
    enabled: false,
    source: "tenant_default",
    baseUrl: null,
    tokenConfigured: false,
    targets: { android: null, ios: null, backend: null },
    readyForTestStatuses: [],
    acceptedStage: null,
    connection: { status: "unconfigured", checkedAt: null, lastErrorCode: null },
    rowVersion: 0,
  });

  assert.equal(draft.baseUrl, "");
  assert.equal(draft.apiToken, "");
  assert.deepEqual(draft.targets, {
    android: { projectId: "", shortName: "" },
    ios: { projectId: "", shortName: "" },
    backend: { projectId: "", shortName: "" },
  });
  assert.deepEqual(draft.readyForTestStatuses, []);
  assert.equal(draft.acceptedStage, "Done");
});

test("YouTrack settings require an HTTPS root, a first token, routing, and ready statuses", () => {
  const draft = draftFromConfiguration(configuration);
  draft.baseUrl = "http://youtrack.example/";
  assert.equal(validateYouTrackDraft(draft, true), "base_url");
  draft.baseUrl = "https://youtrack.example/";
  assert.equal(validateYouTrackDraft(draft, false), "token");
  draft.apiToken = "permanent-token".padEnd(32, "x");
  draft.targets.ios = { projectId: "", shortName: "" };
  assert.equal(validateYouTrackDraft(draft, false), "targets");
  draft.targets.ios = { projectId: "1-2", shortName: "IOS" };
  draft.readyForTestStatuses = [];
  assert.equal(validateYouTrackDraft(draft, false), "ready_statuses");
});

test("YouTrack configuration normalizes the server URL and de-duplicates workflow statuses", () => {
  const draft = draftFromConfiguration(configuration);
  draft.baseUrl = "https://youtrack.example";
  draft.apiToken = ` ${"replacement-token".padEnd(32, "x")} `;
  draft.readyForTestStatuses = ["Test", "Test", "Acceptance"];
  const input = configurationInput(draft);
  assert.equal(input.baseUrl, "https://youtrack.example/");
  assert.equal(input.apiToken, "replacement-token".padEnd(32, "x"));
  assert.deepEqual(input.readyForTestStatuses, ["Test", "Acceptance"]);
});

test("YouTrack credentials are reusable only for the exact configured service root", () => {
  assert.equal(canReuseYouTrackToken(configuration, "https://youtrack.example"), true);
  assert.equal(canReuseYouTrackToken(configuration, "https://other.example/"), false);
  assert.equal(canReuseYouTrackToken(configuration, "not-a-url"), false);
});

test("YouTrack settings reject path-scoped roots and invalid replacement tokens", () => {
  const draft = draftFromConfiguration(configuration);
  draft.baseUrl = "https://youtrack.example/team/";
  assert.equal(validateYouTrackDraft(draft, true), "base_url");
  draft.baseUrl = "https://youtrack.example/";
  draft.apiToken = "too-short";
  assert.equal(validateYouTrackDraft(draft, true), "token");
});
