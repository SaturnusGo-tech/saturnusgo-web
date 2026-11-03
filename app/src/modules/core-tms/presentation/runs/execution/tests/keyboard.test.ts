import test from "node:test";
import assert from "node:assert/strict";
import type { useRunKeyboardShortcuts } from "../useRunKeyboardShortcuts";
import { componentHarness } from "../../../../portfolios/tests/support/component-harness";

test("a bug-report page suppresses covered run shortcuts from any focus target", () => {
  let pageOpen = true, handler: (event: unknown) => void = () => undefined, evidence = 0, reports = 0;
  const statuses: unknown[] = [], selection: string[] = [];
  const h = componentHarness(undefined, { document: { querySelector: () => pageOpen ? {} : null, getElementById: () => ({ click: () => evidence++ }) } });
  Object.assign(h.window, { addEventListener: (_name: string, callback: typeof handler) => { handler = callback; }, removeEventListener() {} });
  const { useRunKeyboardShortcuts: useKeys } = h.load<{ useRunKeyboardShortcuts: typeof useRunKeyboardShortcuts }>(new URL("../useRunKeyboardShortcuts.ts", import.meta.url), name => {
    if (name.endsWith("caseRevision")) return { executableSteps: () => [{ id: "step", required: true }] };
  });
  h.render(() => useKeys({ items: [{ id: "previous" }, { id: "current" }, { id: "next" }], selectedItem: { id: "current", activeAttemptNo: 1, status: "failed", snapshot: {}, attempts: [{ attemptNo: 1, stepResults: [{ stepId: "step", status: "passed" }] }] }, selectedRun: { id: "run" }, runWritable: true,
    onItemStatus: (value: string) => statuses.push(value), onSelectItem: (id: string) => selection.push(id), setReporting: () => { reports++; } } as never));
  const press = (key: string, metaKey = false) => handler({ key, metaKey, target: { closest: () => null }, preventDefault() {} });
  for (const key of ["b", "f", "p", "e", "r"]) press(key);
  press("[", true); press("]", true);
  assert.deepEqual(statuses, []); assert.deepEqual(selection, []); assert.equal(evidence, 0); assert.equal(reports, 0);
  pageOpen = false;
  for (const key of ["b", "f", "p", "e", "r"]) press(key);
  press("[", true); press("]", true);
  assert.deepEqual(statuses, ["blocked", "failed", "passed"]); assert.deepEqual(selection, ["previous", "next"]); assert.equal(evidence, 1); assert.equal(reports, 1);
});
