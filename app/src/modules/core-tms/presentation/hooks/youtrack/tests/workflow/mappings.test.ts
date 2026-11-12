import assert from "node:assert/strict";
import test from "node:test";
import { createEmptyRoute } from "../../../../../youtrack/model/youtrack-settings";
import { updateInbound, routeWithStateField } from "../../sections/workflow/model/workflow-state";

function route() {
  const value = createEmptyRoute("primary", true);
  value.workflow.inbound = { backlog: ["new"], inProgress: ["active"], readyForRetest: ["ready"], accepted: ["done"] };
  value.workflow.outbound = { open: "new", triaged: "new", inProgress: "active", readyForRetest: "ready", verified: "done", closed: "done", reopened: "new" };
  return value;
}
test("moving a status between inbound stages keeps IDs exclusive and removes invalid verified transitions", () => {
  const original = route(), updated = updateInbound(original, "readyForRetest", ["ready", "done", "done"]);
  assert.deepEqual(updated.workflow.inbound, { backlog: ["new"], inProgress: ["active"], readyForRetest: ["ready", "done"], accepted: [] });
  assert.equal(updated.workflow.outbound.verified, null); assert.equal(updated.workflow.outbound.closed, "done");
  assert.deepEqual(original.workflow.inbound.accepted, ["done"]);
  const removed = updateInbound(updated, "backlog", []);
  assert.equal(removed.workflow.outbound.open, null); assert.equal(removed.workflow.outbound.reopened, null);
});
test("selecting a different state field resets mappings without changing route identity or destination", () => {
  const original = route(); original.project = { id: "project-42", name: "Payments", shortName: "PAY" };
  const updated = routeWithStateField(original, { id: "state-2", name: "Workflow", bundleId: "bundle-2", statuses: [{ id: "custom", name: "Custom", localizedName: null, ordinal: 0, isResolved: false, archived: false }] });
  assert.equal(updated.id, "primary"); assert.equal(updated.project.id, "project-42");
  assert.deepEqual(updated.workflow.stateField, { id: "state-2", name: "Workflow" });
  assert.deepEqual(Object.values(updated.workflow.inbound), [[], [], [], []]);
  assert.ok(Object.values(updated.workflow.outbound).every(value => value === null));
  assert.equal(updated.workflow.statuses[0].id, "custom");
});
