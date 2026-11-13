import assert from "node:assert/strict";
import test from "node:test";
import type { CommentShareItem } from "../CommentShareItem";
import { writeClipboardText } from "../../../../../../../shared/lib/clipboard";
import { componentHarness, invoke, nodes } from "../../../../../portfolios/tests/support/component-harness";

const link = "https://falcon.example/work/?workspaceId=company-1&projectId=project-2&view=reports&defectId=defect-3";

for (const mode of ["native", "legacy", "unavailable", "comment-unavailable", "failure-after-success"] as const) {
  test(`share feedback handles ${mode} without inventing clipboard success`, async t => {
    let copied = "", selected = false, removed = false, restored = false;
    let attempts = 0;
    const field = { value: "", readOnly: false, style: {}, focus() {}, select() { selected = true; }, remove() { removed = true; } };
    const doc = { activeElement: { focus() { restored = true; } }, getSelection: () => null, createElement: () => field,
      addEventListener() {}, removeEventListener() {},
      body: { appendChild() {} }, execCommand(command: string) {
        if (mode !== "legacy" || command !== "copy" || !selected || removed) return false;
        copied = field.value; return true;
      } };
    const navigator = { clipboard: { async writeText(value: string) {
      if (mode !== "native" && !(mode === "failure-after-success" && attempts++ === 0)) throw new DOMException("Write permission denied", "NotAllowedError");
      copied = value;
    } } };
    for (const [name, value] of Object.entries({ navigator, document: doc })) {
      const original = Object.getOwnPropertyDescriptor(globalThis, name);
      Object.defineProperty(globalThis, name, { value, configurable: true });
      t.after(() => { if (original) Object.defineProperty(globalThis, name, original); else Reflect.deleteProperty(globalThis, name); });
    }
    const errors: string[] = [];
    const h = componentHarness(undefined, { navigator, document: doc }); t.after(() => h.dispose());
    const { CommentShareItem: Share } = h.load<{ CommentShareItem: typeof CommentShareItem }>(new URL("../CommentShareItem.tsx", import.meta.url), name => {
      if (name.endsWith("/clipboard")) return { writeClipboardText };
      if (name.endsWith("/ErrorToast")) return { showErrorToast: ({ message }: { message: string }) => { errors.push(message); } };
      return undefined;
    });
    const resource = mode === "comment-unavailable" ? "comment" : "defect";
    const render = () => nodes(h.render(() => Share({ ru: false, compact: true, resource, link: () => link })));
    invoke(render().find(node => node.type === "button")!, "onClick");
    await new Promise(resolve => setImmediate(resolve));
    if (mode === "failure-after-success") {
      assert.equal(render().find(node => node.type === "button")!.props["aria-label"], "Link copied");
      invoke(render().find(node => node.type === "button")!, "onClick");
      await new Promise(resolve => setImmediate(resolve));
    }
    const tree = render();
    const failed = mode === "unavailable" || mode === "comment-unavailable" || mode === "failure-after-success";
    const manual = tree.filter(node => node.type === "input");
    assert.equal(manual.length, resource === "comment" ? 1 : 0);
    if (resource === "comment") assert.equal(manual[0].props.value, link);
    assert.equal(tree.find(node => node.type === "button")!.props["aria-label"], failed ? resource === "defect" ? "Copy bug report link" : "Copy comment link" : "Link copied");
    assert.equal(copied, mode === "unavailable" || mode === "comment-unavailable" ? "" : link);
    assert.equal(errors.length, failed && resource === "defect" ? 1 : 0);
    if (mode !== "native") assert.equal(removed && restored, true);
  });
}
