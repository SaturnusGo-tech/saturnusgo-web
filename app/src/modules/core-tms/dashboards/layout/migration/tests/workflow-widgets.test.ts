import assert from "node:assert/strict";
import { test } from "node:test";
import { collapseWorkflowWidgets, workflowCatalog } from "../workflow-widgets";
import { createBoardWidget, widgetByKey, widgetKey } from "../../model/widget-catalog";

const widget = (key: string) => createBoardWidget(widgetByKey.get(key)!, "en", key);

test("groups scalar widgets and preserves the canonical IDs and other settings", () => {
  const existing = widget("defects");
  existing.settings.note = "preserve me";
  const before = [widget("currentDefects"), widget("tags"), existing, widget("defect:triaged"),
    widget("freshness"), widget("readyForRetest"), widget("completedRuns"), widget("type:manual")];
  const after = collapseWorkflowWidgets(before);
  assert.deepEqual(after.map(widgetKey), ["defectPerformance", "tags", "defects", "queue", "completedRuns", "types"]);
  assert.deepEqual(after.map(item => item.id), ["currentDefects", "tags", "defects", "freshness", "completedRuns", "type:manual"]);
  assert.equal(after[2].settings.note, "preserve me");
  assert.deepEqual(after.map(item => item.position.width), [12, 6, 12, 12, 12, 6]);
  assert.deepEqual(collapseWorkflowWidgets(after), after);
  assert.equal(before.length, 8);
});

test("catalog offers each work surface once and preserves saved widths of configured replacements", () => {
  const queue = widget("queue");
  assert.equal(collapseWorkflowWidgets([queue])[0], queue);
  assert.equal(workflowCatalog.filter(item => item.key === "defects").length, 1);
  assert.ok(workflowCatalog.every(item => item.key !== "currentDefects" && item.key !== "freshness" && !item.key.startsWith("type:")));
});

test("keeps the configured widget in its saved position when removing a preceding legacy sibling", () => {
  const configured = { ...widget("defects"), title: "Custom defect map",
    position: { x: 6, y: 3, width: 6, height: 4 } };
  const unrelated = widget("tags");
  const after = collapseWorkflowWidgets([widget("defect:triaged"), unrelated, configured]);

  assert.deepEqual(after, [unrelated, configured]);
});
