import assert from "node:assert/strict";
import test from "node:test";
import type { SourceEditor } from "../../editor/SourceEditor";
import { sourceDraft } from "../../model/api-source";
import { componentHarness, invoke, nodes } from "../../../portfolios/tests/support/component-harness";
test("Swagger full-page form retains validation, pending gate and saved callback without a modal", () => {
  const h = componentHarness(); let saves = 0, cancels = 0;
  const state = { draft: sourceDraft(null, "p"), setDraft() {}, pending: false, error: null, save: () => saves++ };
  const { SourceEditor: View } = h.load<{ SourceEditor: typeof SourceEditor }>(new URL("../../editor/SourceEditor.tsx", import.meta.url), name => {
    if (name.endsWith("useApiSourceEditor")) return { useApiSourceEditor: () => state };
  });
  const props = { workspaceId: "w", projectId: "p", source: null, catalog: [], projects: [{ id: "p", name: "Project" }], ru: false, onClose: () => cancels++, onSaved() {}, onExisting() {}, onReload() {} };
  let all = nodes(h.render(() => View(props)));
  assert.equal(all[0].type, "form"); assert.equal(all.some(node => node.props.role === "dialog"), false);
  assert.equal(all.find(node => node.props.type === "url")?.props.required, true);
  invoke(all[0], "onSubmit", { preventDefault() {} }); assert.equal(saves, 1);
  invoke(all.find(node => node.props.type === "button")!, "onClick"); assert.equal(cancels, 1);
  state.pending = true; all = nodes(h.render(() => View(props)));
  assert.equal(all.find(node => node.type === "fieldset")?.props.disabled, true);
  assert.equal(all.find(node => node.props.type === "submit")?.props.disabled, true);
});
