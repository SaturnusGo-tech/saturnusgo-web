import assert from "node:assert/strict";
import test from "node:test";
import { draftFromConfiguration } from "../../../../../youtrack/model/youtrack-settings";
import { reconcileDraftProjects, routeWithProject } from "../../state/settings-support";
import { legacyFixture } from "./legacy-fixture";
import { catalogHarness } from "../state/catalog-harness";

test("version-1 projected mappings translate to exact project-local IDs without recalculating business stages", () => {
  const { saved, projects } = legacyFixture(), draft = draftFromConfiguration(saved);
  const next = reconcileDraftProjects(draft, projects, projects, saved.configurationVersion);
  const android = next.routes.find(route => route.legacyKey === "android")!;
  assert.deepEqual(android.workflow.stateField, { id: "189-10", name: "Stage" });
  assert.deepEqual(android.workflow.inbound, { backlog: ["166-21"], inProgress: ["166-22", "166-23"], readyForRetest: ["166-24", "166-34", "166-25"], accepted: ["166-26"] });
  assert.deepEqual(android.workflow.outbound, { open: "166-21", triaged: "166-21", inProgress: "166-22", readyForRetest: "166-24", verified: "166-26", closed: "166-26", reopened: "166-21" });
  assert.deepEqual(next.routes.find(route => route.legacyKey === "ios")?.workflow.inbound.readyForRetest, ["166-30", "166-35", "166-31"]);
  assert.deepEqual(next.routes.find(route => route.legacyKey === "backend")?.workflow.inbound.accepted, ["166-20"]);
  assert.deepEqual(draft.routes.find(route => route.legacyKey === "android")?.workflow.inbound.accepted, ["Done"]);
});
test("ambiguous fields or names and missing exact names preserve legacy mappings instead of guessing", () => {
  const { saved, projects } = legacyFixture(), draft = draftFromConfiguration(saved), route = draft.routes[1];
  const field = projects[0].stateFields![0];
  for (const stateFields of [[field, { ...field, id: "another-field" }],
    [{ ...field, statuses: [...field.statuses, { ...field.statuses[3], id: "duplicate-name" }] }],
    [{ ...field, statuses: field.statuses.map(status => status.name === "Test" ? { ...status, name: "test" } : status) }]]) {
    const catalog = [{ ...projects[0], stateFields }, ...projects.slice(1)];
    const next = reconcileDraftProjects(draft, catalog, catalog, 1);
    assert.deepEqual(next.routes[1].workflow, route.workflow);
  }
});
test("version-2 configurations and explicit cross-project choices retain strict ID matching", () => {
  const { saved, projects } = legacyFixture(), draft = draftFromConfiguration(saved);
  const strict = reconcileDraftProjects(draft, projects, projects, 2).routes[1];
  assert.deepEqual(strict.workflow.inbound.readyForRetest, []);
  const moved = routeWithProject(draft.routes[1], projects[1]);
  assert.equal(moved.project.id, "0-3"); assert.deepEqual(moved.workflow.inbound.accepted, []);
});
test("the real settings hook loads legacy mappings as live IDs without any automatic configuration PATCH", async () => {
  const fixture = legacyFixture(), h = await catalogHarness("ready", true, fixture);
  try {
    assert.equal(h.model.catalogIssue, null);
    assert.deepEqual(h.model.draft?.routes.find(route => route.legacyKey === "android")?.workflow.inbound.accepted, ["166-26"]);
    assert.equal(h.requests.some(request => request.method === "PATCH"), false);
  } finally { await h.dispose(); }
});

test("ambiguous legacy catalogs fail closed in the real hook without erasing projected mappings", async () => {
  const fixture = legacyFixture(), field = fixture.projects[0].stateFields![0];
  const projects = [{ ...fixture.projects[0], stateFields: [{ ...field, statuses: [...field.statuses, { ...field.statuses[3], id: "duplicate-Test" }] }] }, ...fixture.projects.slice(1)];
  const h = await catalogHarness("ready", true, { saved: fixture.saved, projects });
  try {
    assert.equal(h.model.catalogIssue, "legacy_mapping");
    assert.deepEqual(h.model.draft?.routes.find(route => route.legacyKey === "android")?.workflow.inbound.readyForRetest, ["Test", "Acceptance", "Staging"]);
    assert.equal(h.requests.some(request => request.method === "PATCH"), false);
  } finally { await h.dispose(); }
});
