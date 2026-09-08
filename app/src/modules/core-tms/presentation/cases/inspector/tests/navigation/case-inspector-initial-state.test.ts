import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { useCasesViewController } from "../../../view/useCasesViewController";
import type { CasesViewProps } from "../../../types";

function inspect(overrides: Partial<CasesViewProps> = {}) {
  const props = {
    testCases: [], query: "", selectedCaseId: "", selectedFolder: "/Unsorted",
    filters: { type: "all", priority: "all", lifecycle: "all", tag: "", includeArchived: false },
    ...overrides,
  } as CasesViewProps;
  let open: boolean | undefined;
  function Probe() {
    open = useCasesViewController(props, "ru", "ru-RU").inspectorOpen;
    return null;
  }
  renderToStaticMarkup(createElement(Probe));
  return open;
}

test("case list mounts without an empty or automatically opened inspector", () => {
  assert.equal(inspect(), false);
  assert.equal(inspect({ selectedCaseId: "missing" }), false);
});

test("an explicitly selected case or an active create editor still opens the inspector", () => {
  const testCase = { id: "chosen", projectId: "p" } as CasesViewProps["testCase"];
  assert.equal(inspect({ selectedCaseId: "chosen", testCase }), true);
  assert.equal(inspect({ testCase }), false);
  assert.equal(inspect({ editor: { mode: "create" } as CasesViewProps["editor"] }), true);
});
