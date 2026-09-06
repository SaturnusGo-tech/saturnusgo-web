import assert from "node:assert/strict";
import test from "node:test";

import {
  canReuseYouTrackToken,
  configurationInput,
  draftFromConfiguration,
  validateYouTrackDraft,
  type YouTrackConfiguration,
} from "../model/youtrack-settings";

const statuses = [
  { id: "state-open", name: "Open", localizedName: "Открыта", ordinal: 0, isResolved: false, archived: false },
  { id: "state-test", name: "Ready to verify", localizedName: "Можно проверять", ordinal: 1, isResolved: false, archived: false },
  { id: "state-done", name: "Complete", localizedName: "Завершена", ordinal: 2, isResolved: true, archived: false },
];

const configuration: YouTrackConfiguration = {
  workspaceId: "workspace-a",
  enabled: true,
  source: "workspace",
  baseUrl: "https://youtrack.example/youtrack/",
  tokenConfigured: true,
  configurationVersion: 2,
  targets: { android: null, ios: null, backend: null },
  readyForTestStatuses: [],
  acceptedStage: null,
  connectionRevision: 1,
  routes: [{
    id: "default",
    name: "Main project",
    enabled: true,
    isDefault: true,
    match: null,
    project: { id: "1-1", shortName: "WEB", name: "Web platform" },
    workflow: {
      stateField: { id: "field-state", name: "State" },
      statuses,
      inbound: { backlog: ["state-open"], inProgress: [], readyForRetest: ["state-test"], accepted: ["state-done"] },
      outbound: { open: "state-open", triaged: null, inProgress: null, readyForRetest: "state-test", verified: null, closed: "state-done", reopened: "state-open" },
    },
  }],
  connection: { status: "connected", checkedAt: null, lastErrorCode: null },
  rowVersion: 3,
};

test("YouTrack v2 drafts never expose or overwrite a stored token", () => {
  const draft = draftFromConfiguration(configuration);
  assert.equal(draft.apiToken, "");
  assert.equal(validateYouTrackDraft(draft, configuration.tokenConfigured), null);
  assert.equal("apiToken" in configurationInput(draft), false);
});

test("a blank workspace starts with one empty default route", () => {
  const draft = draftFromConfiguration({
    ...configuration,
    enabled: false,
    source: "tenant_default",
    baseUrl: null,
    tokenConfigured: false,
    routes: [],
    connection: { status: "unconfigured", checkedAt: null, lastErrorCode: null },
    rowVersion: 0,
  });
  assert.equal(draft.baseUrl, "");
  assert.equal(draft.routes.length, 1);
  assert.equal(draft.routes[0]?.isDefault, true);
  assert.equal(draft.routes[0]?.project.id, "");
});

test("v2 validation uses discovered project, state field and status ids", () => {
  const draft = draftFromConfiguration(configuration);
  draft.baseUrl = "http://youtrack.example/";
  assert.equal(validateYouTrackDraft(draft, true), "base_url");
  draft.baseUrl = "https://youtrack.example/youtrack/";
  assert.equal(validateYouTrackDraft(draft, false), "token");
  draft.apiToken = "permanent-token".padEnd(32, "x");
  draft.routes[0]!.workflow.stateField = { id: "", name: "" };
  assert.equal(validateYouTrackDraft(draft, false), "state_field");
  draft.routes[0]!.workflow.stateField = { id: "field-state", name: "State" };
  draft.routes[0]!.workflow.inbound.readyForRetest = [];
  assert.equal(validateYouTrackDraft(draft, false), "ready_statuses");
});

test("arbitrary routing rules are serialized without platform assumptions", () => {
  const draft = draftFromConfiguration(configuration);
  draft.routes.push({
    ...structuredClone(draft.routes[0]!),
    id: "route-web-client",
    name: "Web client",
    isDefault: false,
    match: { field: "component", value: " Web client " },
  });
  const input = configurationInput(draft);
  assert.equal(input.configurationVersion, 2);
  assert.deepEqual(input.routes[1]?.match, { field: "component", value: "Web client" });
  assert.equal("statuses" in (input.routes[0]?.workflow ?? {}), false);
});

test("self-hosted YouTrack paths normalize and reuse credentials", () => {
  assert.equal(canReuseYouTrackToken(configuration, "https://youtrack.example/youtrack"), true);
  const draft = draftFromConfiguration(configuration);
  draft.baseUrl = "https://youtrack.example/youtrack";
  assert.equal(configurationInput(draft).baseUrl, "https://youtrack.example/youtrack/");
  assert.equal(canReuseYouTrackToken(configuration, "https://other.example/youtrack/"), false);
});

test("duplicate matcher values are rejected case-insensitively", () => {
  const draft = draftFromConfiguration(configuration);
  const base = structuredClone(draft.routes[0]!);
  draft.routes.push({ ...base, id: "a", isDefault: false, match: { field: "tag", value: "Web" } });
  draft.routes.push({ ...base, id: "b", isDefault: false, match: { field: "tag", value: " web " } });
  assert.equal(validateYouTrackDraft(draft, true), "route_duplicate");
});

test("one YouTrack status cannot belong to two Falcon stages", () => {
  const draft = draftFromConfiguration(configuration);
  draft.routes[0]!.workflow.inbound.accepted.push("state-test");
  assert.equal(validateYouTrackDraft(draft, true), "status_conflict");
});

test("a missing legacy state field becomes an editable empty selection", () => {
  const current = configuration.routes![0]!;
  const route = { ...current, workflow: { ...current.workflow, stateField: null } };
  const draft = draftFromConfiguration({ ...configuration, routes: [route] });
  assert.deepEqual(draft.routes[0]?.workflow.stateField, { id: "", name: "" });
});
