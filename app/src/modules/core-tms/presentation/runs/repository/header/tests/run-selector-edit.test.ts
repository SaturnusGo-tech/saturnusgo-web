import assert from "node:assert/strict";
import test from "node:test";
import type { TestRunSummary } from "../../../../../../../core/tms/contracts/legacy-contract";
import type { RunSelector } from "../RunSelector";
import { isHistoricalRunChoice } from "../../../../../runs/model/history/run-history";
import { componentHarness, invoke, nodes } from "../../../../../portfolios/tests/support/component-harness";

function run(id: string): TestRunSummary {
  return { id, projectId: "project-a", key: id, name: id, description: "", type: "smoke", status: "draft",
    environment: { id: null, key: "QA", name: "QA", baseUrl: "" }, suiteId: null, build: "", configuration: {}, itemCount: 0,
    progress: { total: 0, executed: 0, percent: 0, counts: { not_run: 0, in_progress: 0, passed: 0, failed: 0, blocked: 0, skipped: 0 } },
    createdAt: "2026-09-27T00:00:00Z", startedAt: null, completedAt: null, archivedAt: null, archivedBy: null, archiveReason: null };
}
function selector(editable = true) {
  const document = { activeElement: null as unknown, addEventListener() {}, removeEventListener() {} };
  const h = componentHarness(undefined, { document });
  const { RunSelector: component } = h.load<{ RunSelector: typeof RunSelector }>(new URL("../RunSelector.tsx", import.meta.url),
    name => name.endsWith("run-history") ? { isHistoricalRunChoice } : name.endsWith("format/labels") ? { localizedLabel: (_locale: string, key: string) => key } : undefined);
  const selected: string[] = []; let edited = 0; let expandedAtEdit = false;
  const props = { ru: false, value: "run-a", disabled: false,
    choices: [run("run-a"), run("run-b")].map(run => ({ id: run.id, name: run.name, tags: [], runs: [run] })),
    onChoose: (id: string) => { selected.push(id); },
    onEdit: editable ? () => { edited++; expandedAtEdit = trigger().props["aria-expanded"] === true; } : undefined };
  const render = () => nodes(h.render(() => component(props)));
  const trigger = () => render().find(node => node.props["aria-haspopup"] && node.type === "button")!;
  const open = () => invoke(trigger(), "onClick");
  return { render, open, trigger, props, selected, document, edited: () => edited, expandedAtEdit: () => expandedAtEdit };
}

test("the selected run has one independent edit button immediately before its checkmark", () => {
  const h = selector(); h.open();
  const edits = h.render().filter(node => node.props["aria-label"] === "Edit run");
  assert.equal(edits.length, 1);
  const row = h.render().find(node => node.props["data-run-choice"] === "run-a"); assert.ok(row);
  const children = row.props.children as { type: string; props: Record<string, unknown> }[];
  assert.equal(children[1].props["aria-label"], "Edit run"); assert.equal(children[2].type, "Check");
  assert.equal(nodes(children[0]).some(node => node.props["aria-label"] === "Edit run"), false, "edit must not be nested in the selection button");
});

test("editing opens the current run without choosing any run, then dismisses the dropdown", () => {
  const h = selector(); h.open(); const edit = h.render().find(node => node.props["aria-label"] === "Edit run"); assert.ok(edit);
  let stopped = false;
  invoke(edit, "onClick", { stopPropagation() { stopped = true; } });
  assert.equal(h.edited(), 1); assert.equal(h.expandedAtEdit(), true); assert.equal(stopped, true);
  assert.deepEqual(h.selected, []); assert.equal(h.trigger().props["aria-expanded"], false);
});

test("missing permission or a busy selector never exposes a working edit action", () => {
  const denied = selector(false); denied.open();
  assert.equal(denied.render().some(node => node.props["aria-label"] === "Edit run"), false);
  const busy = selector(); busy.open(); busy.props.disabled = true;
  assert.equal(busy.render().some(node => node.props["aria-label"] === "Edit run"), false);
  assert.equal(busy.edited(), 0);
});

test("choosing another run keeps normal selection behavior and does not edit", () => {
  const h = selector(); h.open();
  const row = h.render().find(node => node.props["data-run-choice"] === "run-b"); assert.ok(row);
  const select = nodes(row).find(node => node.props["data-run-select"]); assert.ok(select);
  invoke(select, "onClick"); assert.deepEqual(h.selected, ["run-b"]); assert.equal(h.edited(), 0);
  assert.equal(h.trigger().props["aria-expanded"], false);
});

test("an archived selected run never offers edit even if an obsolete callback is provided", () => {
  const h = selector(); h.props.choices[0].runs[0].status = "completed"; h.open();
  const archive = h.render().find(node => node.props["data-archive-toggle"]); assert.ok(archive); invoke(archive, "onClick");
  assert.ok(h.render().some(node => node.props["data-run-choice"] === "run-a"));
  assert.equal(h.render().some(node => node.props["aria-label"] === "Edit run"), false);
});

test("keyboard navigation moves between runs while the pencil remains a separate tab stop", () => {
  const h = selector(); h.open(); let focused = "";
  const buttons = ["run-a", "run-b"].map(id => ({ focus() { focused = id; h.document.activeElement = this; } }));
  const group = h.render().find(node => node.props.role === "group"); assert.ok(group);
  const currentTarget = { querySelectorAll: () => buttons };
  let prevented = false;
  invoke(group, "onKeyDown", { key: "ArrowDown", currentTarget, preventDefault() { prevented = true; } });
  assert.equal(focused, "run-a"); assert.equal(prevented, true);
  invoke(group, "onKeyDown", { key: "End", currentTarget, preventDefault() {} }); assert.equal(focused, "run-b");
  const edit = h.render().find(node => node.props["aria-label"] === "Edit run"); assert.ok(edit);
  assert.equal(edit.type, "button"); assert.notEqual(edit.props.tabIndex, -1);
  assert.deepEqual(h.selected, []); assert.equal(h.edited(), 0);
});
