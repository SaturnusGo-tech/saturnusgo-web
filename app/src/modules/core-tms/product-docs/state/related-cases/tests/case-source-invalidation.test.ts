import assert from "node:assert/strict";
import test from "node:test";
import { componentHarness, nodes } from "../../../../portfolios/tests/support/component-harness";
import { notifyCaseRequirementsChanged, subscribeCaseRequirementsChanged } from "../../../requirements/save/case-requirements-events";
import type { Requirements } from "../../../requirements/Requirements";
import type { ProductDocsApi } from "../../../domain/product-docs";

const flush = () => new Promise<void>(resolve => setImmediate(resolve));
test("case-side requirement changes invalidate the source document's related-case property", async t => {
  const h = componentHarness(); t.after(h.dispose);
  const scope = { workspaceId: "w", projectId: "p" }, changed: string[] = [];
  t.after(subscribeCaseRequirementsChanged((_scope, id) => changed.push(id)));
  const api = { async listCaseRequirements() { return { requirements: [], canEdit: true, nextCursor: null }; },
    async linkRequirement(_scope: unknown, _caseId: string, docId: string) { return { docId }; } } as unknown as ProductDocsApi;
  const { Requirements: render } = h.load<{ Requirements: typeof Requirements }>(new URL("../../../requirements/Requirements.tsx", import.meta.url), name =>
    name.endsWith("ProductDocsContext") ? { useProductDocsWorkspace: () => ({ api, scope }) }
      : name.endsWith("case-requirements-events") ? { notifyCaseRequirementsChanged, subscribeCaseRequirementsChanged } : undefined);
  const read = () => h.render(() => {
    const node = render({ projectId: "p", subject: { caseId: "case" }, ru: false })!;
    return (node.type as (props: unknown) => unknown)(node.props);
  });
  read(); await flush();
  const picker = nodes(read()).find(node => node.type === "CaseRequirementPicker")!;
  (picker.props.onLink as (requirement: unknown) => void)({ docId: "doc", sectionId: null });
  await flush();
  assert.deepEqual(changed, ["case"]);
});
