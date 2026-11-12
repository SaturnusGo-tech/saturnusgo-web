import assert from "node:assert/strict";
import test from "node:test";
import { componentHarness, nodes } from "../../../../../portfolios/tests/support/component-harness";
import { relatedCasesChanged, toggleRelatedCases } from "../../../../domain/related-cases/product-doc-related-cases";
import type { RelatedCasePicker } from "../RelatedCasePicker";
import type { ProductDocRelatedCaseSelection } from "../../../../domain/related-cases/product-doc-related-cases";

test("bulk picker retains unseen links, applies deduplicated selections, and ignores changes during save", async () => {
  const h = componentHarness();
  const { RelatedCasePicker: render } = h.load<{ RelatedCasePicker: typeof RelatedCasePicker }>(new URL("../RelatedCasePicker.tsx", import.meta.url), name =>
    name.endsWith("useProductDocCaseCatalog") ? { useProductDocCaseCatalog: () => ({ status: "ready", data: {
      cases: [{ id: "a", title: "A" }, { id: "b", title: "B" }], folders: [] } }) }
      : name.endsWith("product-doc-related-cases") ? { relatedCasesChanged, toggleRelatedCases } : undefined);
  let applied: ProductDocRelatedCaseSelection | undefined;
  const props = { scope: { workspaceId: "w", projectId: "p" }, baseline: [{ caseId: "unseen", title: "Existing case", sectionId: "s" }],
    projectName: "Project", ru: false, busy: false, failed: false, onCancel() {}, async onApply(value: ProductDocRelatedCaseSelection) { applied = value; } };
  const read = (busy = false) => nodes(h.render(() => render({ ...props, busy })));
  const picker = read().find(node => node.type === "SuiteCasePicker")!;
  (picker.props.onScope as (ids: string[]) => void)(["a", "b", "a"]);
  const duringSave = read(true).find(node => node.type === "SuiteCasePicker")!;
  (duringSave.props.onToggle as (id: string) => void)("a");
  const final = read();
  const apply = final.find(node => node.type === "Button" && node.props.color === "primary")!;
  await (apply.props.onPress as () => Promise<void>)();
  assert.ok(applied);
  assert.equal(applied.cases.map(item => item.caseId).join(","), "unseen,a,b");
  assert.equal(applied.cases[0].sectionId, "s");
  assert.equal(applied.baseline.map(item => item.caseId).join(","), "unseen");
  h.dispose();
});


test("unavailable authoritative links block Apply while keeping Back available", () => {
  const h = componentHarness();
  const { RelatedCasePicker: render } = h.load<{ RelatedCasePicker: typeof RelatedCasePicker }>(new URL("../RelatedCasePicker.tsx", import.meta.url), name =>
    name.endsWith("useProductDocCaseCatalog") ? { useProductDocCaseCatalog: () => ({ status: "ready", data: {
      cases: [{ id: "a", title: "A" }], folders: [] } }) }
      : name.endsWith("product-doc-related-cases") ? { relatedCasesChanged, toggleRelatedCases } : undefined);
  const props = { scope: { workspaceId: "w", projectId: "p" }, baseline: [], projectName: "Project", ru: false,
    busy: false, failed: true, canApply: false, onCancel() {}, async onApply() {} };
  const read = () => nodes(h.render(() => render(props)));
  const picker = read().find(node => node.type === "SuiteCasePicker")!;
  (picker.props.onToggle as (id: string) => void)("a");
  const buttons = read().filter(node => node.type === "Button");
  assert.equal(buttons.find(node => node.props.color === "primary")!.props.isDisabled, true);
  assert.equal(buttons.find(node => node.props.variant === "light")!.props.isDisabled, false);
  h.dispose();
});
