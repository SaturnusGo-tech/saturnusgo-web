import assert from "node:assert/strict";
import test, { type TestContext } from "node:test";
import { componentHarness, nodes, type Node } from "../../../../../portfolios/tests/support/component-harness";
import { relatedCasesChanged, toggleRelatedCases, type ProductDocRelatedCaseSelection } from "../../../../domain/related-cases/product-doc-related-cases";
import type { ProductDocsApi } from "../../../../domain/product-docs";
import { loadRelatedCases } from "../../../../data/related-cases/load-related-cases";
import { saveRelatedCases } from "../../../../requirements/related-cases/save-related-cases";
import { notifyCaseRequirementsChanged, subscribeCaseRequirementsChanged } from "../../../../requirements/save/case-requirements-events";
import type { useProductDocResource } from "../../../../state/useProductDocResource";
import type { useProductDocRelatedCases } from "../../../../state/related-cases/useProductDocRelatedCases";
import type { RelatedCasePicker } from "../../../../presentation/related-cases/picker/RelatedCasePicker";

const flush = () => new Promise<void>(resolve => setImmediate(resolve));
const scope = { workspaceId: "w", projectId: "p" };

async function pickerFixture(t: TestContext, partial = true, pauseReconcile = false) {
  const h = componentHarness(); t.after(h.dispose);
  const resource = h.load<{ useProductDocResource: typeof useProductDocResource }>(new URL("../../../../state/useProductDocResource.ts", import.meta.url));
  const { useProductDocRelatedCases: useCases } = h.load<{ useProductDocRelatedCases: typeof useProductDocRelatedCases }>(
    new URL("../../../../state/related-cases/useProductDocRelatedCases.ts", import.meta.url), name => name.endsWith("useProductDocResource") ? resource
      : name.endsWith("load-related-cases") ? { loadRelatedCases } : name.endsWith("save-related-cases") ? { saveRelatedCases }
        : name.endsWith("case-requirements-events") ? { subscribeCaseRequirementsChanged } : undefined);
  const { RelatedCasePicker: picker } = h.load<{ RelatedCasePicker: typeof RelatedCasePicker }>(new URL("../../../../presentation/related-cases/picker/RelatedCasePicker.tsx", import.meta.url), name =>
    name.endsWith("useProductDocCaseCatalog") ? { useProductDocCaseCatalog: () => ({ status: "ready", data: {
      cases: ["a", "b", "c"].map(id => ({ id, title: id })), folders: [] } }) }
      : name.endsWith("product-doc-related-cases") ? { relatedCasesChanged, toggleRelatedCases } : undefined);
  const persisted = new Set(["a"]);
  let fail = partial, pending: Promise<boolean> | undefined;
  let reads = 0, releaseRead: (() => void) | undefined;
  const api = {
    async getImpact() {
      if (++reads > 1 && pauseReconcile) await new Promise<void>(resolve => { releaseRead = () => { pauseReconcile = false; resolve(); }; });
      return { cases: [...persisted].map(caseId => ({ caseId, title: caseId, sectionId: null, needsUpdate: false, affected: false, missingSection: false })),
        nextCursor: null, totalLinkedCases: persisted.size, affectedCases: 0, casesNeedingUpdate: 0, draftVersion: 3, publishedVersion: 2, changes: null };
    },
    async linkRequirement(_scope, caseId, docId) {
      if (caseId === "c" && fail) { fail = false; throw new Error("C could not be linked"); }
      persisted.add(caseId); return { docId };
    },
    async unlinkRequirement(_scope, caseId, docId) { persisted.delete(caseId); return { docId }; },
  } satisfies Pick<ProductDocsApi, "getImpact" | "linkRequirement" | "unlinkRequirement"> as unknown as ProductDocsApi;
  const read = () => h.render(() => {
    const state = useCases(api, scope, "doc", 3);
    return { state, ui: state.status === "ready" ? nodes(picker({ scope, baseline: state.data, projectName: "Project", ru: false,
      busy: state.busy, failed: state.saveFailed, onCancel() {}, async onApply(selection: ProductDocRelatedCaseSelection) {
        pending = state.save(selection); await pending;
      } })) : [] };
  });
  function toggle(id: string) {
    const node = read().ui.find(node => node.type === "SuiteCasePicker")!;
    (node.props.onToggle as (id: string) => void)(id);
  }
  function applyButton(): Node { return read().ui.find(node => node.type === "Button" && node.props.color === "primary")!; }
  async function apply() {
    const button = applyButton(); assert.equal(button.props.isDisabled, false);
    (button.props.onPress as () => void)();
    const saved = await pending;
    read(); await flush(); read();
    return saved;
  }
  read(); await flush(); read();
  if (partial) {
    toggle("b"); toggle("c");
    assert.equal(await apply(), false);
    assert.deepEqual([...persisted], ["a", "b"]);
    const selected = read().ui.find(node => node.type === "SuiteCasePicker")!.props.selected as Set<string>;
    assert.deepEqual([...selected], ["a", "b", "c"], "reconciliation must preserve desired selection");
    assert.equal(read().state.saveFailed, true);
  }
  async function externalChange(caseId: string, linked: boolean) {
    if (linked) persisted.add(caseId); else persisted.delete(caseId);
    notifyCaseRequirementsChanged(scope, caseId);
    read(); await flush(); read();
  }
  return { persisted, read, toggle, apply, applyButton, externalChange, resumeRead: () => releaseRead?.() };
}

test("retry after a partial save removes a committed link deselected by the user", async t => {
  const { persisted, read, toggle, apply } = await pickerFixture(t);
  toggle("b");
  assert.equal(await apply(), true);
  assert.deepEqual([...persisted], ["a", "c"]);
  const state = read().state;
  assert.equal(state.status, "ready");
  if (state.status === "ready") assert.deepEqual(state.data.map(item => item.caseId), ["a", "c"]);
});

test("returning to the opening selection stays applicable until a partial committed link is removed", async t => {
  const { persisted, toggle, apply, applyButton } = await pickerFixture(t);
  toggle("b"); toggle("c");
  assert.equal(applyButton().props.isDisabled, false, "A still differs from authoritative A+B after the failed save");
  assert.equal(await apply(), true);
  assert.deepEqual([...persisted], ["a"]);
  assert.equal(applyButton().props.isDisabled, true);
});


test("applying a local addition preserves links added elsewhere while the picker is open", async t => {
  const { persisted, toggle, apply, externalChange } = await pickerFixture(t, false);
  toggle("c");
  await externalChange("b", true);
  assert.equal(await apply(), true);
  assert.deepEqual([...persisted], ["a", "b", "c"]);
});

test("applying a local addition does not restore an untouched link removed elsewhere", async t => {
  const { persisted, toggle, apply, externalChange } = await pickerFixture(t, false);
  toggle("c");
  await externalChange("a", false);
  assert.equal(await apply(), true);
  assert.deepEqual([...persisted], ["c"]);
});


test("a retry waits until the failed save's authoritative links reach the picker", async t => {
  const { persisted, read, toggle, apply, applyButton, resumeRead } = await pickerFixture(t, true, true);
  assert.equal(applyButton().props.isDisabled, true, "reconciliation must finish before Apply unlocks");
  const before = read().state;
  const item = (caseId: string) => ({ caseId, title: caseId, sectionId: null });
  assert.equal(await before.save({ baseline: [item("a")], cases: [item("a"), item("c")] }), false,
    "stale event handlers cannot bypass the reconciliation gate");
  assert.deepEqual([...persisted], ["a", "b"]);
  resumeRead(); await flush(); read();
  toggle("b");
  assert.equal(await apply(), true);
  assert.deepEqual([...persisted], ["a", "c"]);
});
