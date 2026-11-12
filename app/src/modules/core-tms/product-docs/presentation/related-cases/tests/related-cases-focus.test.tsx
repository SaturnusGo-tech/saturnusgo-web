import assert from "node:assert/strict";
import test from "node:test";
import { componentHarness, nodes } from "../../../../portfolios/tests/support/component-harness";
import type { ProductDocRelatedCasesDrawer } from "../ProductDocRelatedCasesDrawer";

test("opening a case waits for the related-cases drawer to release its focus scope", () => {
  const frames: Array<() => void> = [], opened: string[] = []; let closed = false;
  const h = componentHarness(undefined, { requestAnimationFrame: (callback: () => void) => frames.push(callback) });
  const { ProductDocRelatedCasesDrawer: render } = h.load<{ ProductDocRelatedCasesDrawer: typeof ProductDocRelatedCasesDrawer }>(
    new URL("../ProductDocRelatedCasesDrawer.tsx", import.meta.url), name => name === "framer-motion" ? { useReducedMotion: () => false } : undefined);
  const all = nodes(h.render(() => render({ open: true, selecting: false, cases: [{ caseId: "a", title: "A", sectionId: null }],
    scope: { workspaceId: "w", projectId: "p" }, projectName: "P", ru: false, editable: false, busy: false,
    loading: false, saveFailed: false, onSelect() {}, onClose() { closed = true; }, async onSave() { return true; },
    onOpenCase(id) { opened.push(id); } })));
  const link = all.find(node => node.type === "button")!;
  (link.props.onClick as () => void)();
  assert.equal(closed, true);
  assert.equal(opened.length, 0);
  const drawer = all.find(node => node.type === "Drawer")!;
  (drawer.props.motionProps as { onAnimationComplete(value: string): void }).onAnimationComplete("exit");
  frames.forEach(callback => callback());
  assert.deepEqual(opened, ["a"]);
  h.dispose();
});
