import assert from "node:assert/strict";
import { test, type TestContext } from "node:test";
import { componentHarness, invoke, nodes, type Node } from "../../../portfolios/tests/support/component-harness";
import { emptySharedStepDraft, type SharedStep, type SharedStepSummary } from "../../../shared-steps/model/shared-step";
import { filterSharedSteps } from "../../../shared-steps/model/catalog/shared-step-catalog";
import type { useSharedSteps } from "../../../shared-steps/state/useSharedSteps";
import type { SharedStepsView } from "../SharedStepsView";

const item = (id: string): SharedStep => ({ id, projectId: "p", folderId: null, folderPath: "/", currentRevision: 1, revisionCount: 1,
  current: { ...emptySharedStepDraft(), title: `Procedure ${id}`, revision: 1, createdAt: "2026-11-03T00:00:00Z", createdBy: "qa" },
  archivedAt: null, etag: id, createdAt: "2026-11-03T00:00:00Z", updatedAt: "2026-11-03T00:00:00Z" });
function setup(t: TestContext, items: SharedStepSummary[] = []) {
  const h = componentHarness(); t.after(() => h.dispose());
  const pending = new Map<string, (value: SharedStep) => void>();
  const resource = { items, status: "ready", selected: null, archiveEnabled: true, close() {},
    open: (id: string) => new Promise<SharedStep>(resolve => pending.set(id, resolve)) } as unknown as ReturnType<typeof useSharedSteps>;
  const { SharedStepsView: View } = h.load<{ SharedStepsView: typeof SharedStepsView }>(new URL("../SharedStepsView.tsx", import.meta.url), name => {
    if (name.endsWith("useTmsLocale")) return { useTmsLocale: () => ({ locale: "en" }) };
    if (name.endsWith("shared-step-catalog")) return { filterSharedSteps };
    if (name.endsWith("model/shared-step")) return { emptySharedStepDraft };
  });
  const render = () => nodes(h.render(() => View({ resource })));
  const create = (tree: Node[]) => tree.find(node => node.type === "button" && JSON.stringify(node.props.children).includes('"Shared step"'))!;
  return { render, create, pending, resource };
}
test("empty library has one creation action and creation opens one blank procedure", t => {
  const h = setup(t), tree = h.render();
  assert.equal(tree.filter(node => node.type === "button").length, 1);
  assert.ok(tree.some(node => node.type === "SharedStepEmpty" && !node.props.searching));
  invoke(h.create(tree), "onClick");
  const editor = h.render().find(node => node.type === "SharedStepAttachmentEditor")!;
  assert.equal(editor.props.current, null);
  assert.equal((editor.props.draft as ReturnType<typeof emptySharedStepDraft>).items.length, 1);
});
test("a late open cannot overwrite a newly created draft", async t => {
  const h = setup(t);
  h.resource.items = [{ ...item("a"), title: "Procedure a", itemCount: 1, usageCount: 0 }];
  invoke(h.render().find(node => node.type === "SharedStepList")!, "onOpen", "a");
  invoke(h.create(h.render()), "onClick");
  h.pending.get("a")!(item("a")); await new Promise<void>(resolve => setImmediate(resolve));
  const editor = h.render().find(node => node.type === "SharedStepAttachmentEditor")!;
  assert.equal(editor.props.current, null); assert.equal((editor.props.draft as SharedStep["current"]).title, "");
});
test("the last requested procedure owns the draft even if an earlier resource response arrives later", async t => {
  const h = setup(t);
  h.resource.items = ["a", "b"].map(id => ({ ...item(id), title: `Procedure ${id}`, itemCount: 1, usageCount: 0 }));
  invoke(h.render().find(node => node.type === "SharedStepList")!, "onOpen", "a");
  invoke(h.render().find(node => node.type === "SharedStepList")!, "onOpen", "b");
  h.pending.get("b")!(item("b")); await new Promise<void>(resolve => setImmediate(resolve));
  h.pending.get("a")!(item("a")); h.resource.selected = item("a"); await new Promise<void>(resolve => setImmediate(resolve));
  const editor = h.render().find(node => node.type === "SharedStepAttachmentEditor")!;
  assert.equal((editor.props.current as SharedStep).id, "b");
  assert.equal((editor.props.draft as SharedStep["current"]).title, "Procedure b");
});
test("search filters the library without dropping the creation action", t => {
  const h = setup(t);
  h.resource.items = ["Auth", "Booking"].map(id => ({ ...item(id), title: id, itemCount: 1, usageCount: 0 }));
  invoke(h.render().find(node => node.type === "SharedStepSearch")!, "onChange", "AUTH");
  assert.deepEqual((h.render().find(node => node.type === "SharedStepList")!.props.items as SharedStepSummary[]).map(row => row.title), ["Auth"]);
  invoke(h.render().find(node => node.type === "SharedStepSearch")!, "onChange", "unknown");
  assert.equal(h.render().find(node => node.type === "SharedStepEmpty")!.props.searching, true);
  assert.ok(h.create(h.render()));
});

test("section navigation precedes search and keeps all, root and nested scope distinct", t => {
  const h = setup(t);
  h.resource.items = ["/", "/Host", "/Host/Login", "/Payments"].map((folderPath, index) => ({
    ...item(String(index)), title: `Procedure ${index}`, folderPath, itemCount: 1, usageCount: 0,
  }));
  const tree = h.render();
  assert.ok(tree.findIndex(node => node.type === "SharedStepSectionFilter") < tree.findIndex(node => node.type === "SharedStepSearch"));
  const choose = (path: string) => invoke(h.render().find(node => node.type === "SharedStepSectionFilter")!, "onChange", path);
  const titles = () => (h.render().find(node => node.type === "SharedStepList")!.props.items as SharedStepSummary[]).map(row => row.title);
  choose("/Host"); assert.deepEqual(titles(), ["Procedure 1", "Procedure 2"]);
  choose("/"); assert.deepEqual(titles(), ["Procedure 0"]);
  choose("all"); assert.equal(titles().length, 4);
});
