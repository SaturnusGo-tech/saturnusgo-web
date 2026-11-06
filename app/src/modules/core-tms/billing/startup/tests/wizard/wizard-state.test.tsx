import assert from "node:assert/strict";
import { test } from "node:test";
import { componentHarness } from "../../../../portfolios/tests/support/component-harness";
import type { useCompanyWizard } from "../../presentation/wizard/model/useCompanyWizard";
const source = new URL("../../presentation/wizard/model/useCompanyWizard.ts", import.meta.url);
function fixture() {
  const h = componentHarness(); let saves = 0;
  const model = { setup: null, loading: false, busy: false, canRetryCommand: false, error: null,
    save: async () => { saves++; return false; }, reload() {}, retry: async () => {}, retryCommand: async () => {} };
  const { useCompanyWizard: hook } = h.load<{ useCompanyWizard: typeof useCompanyWizard }>(source, path => {
    if (path === "./wizard-values") return h.load(new URL("../../presentation/wizard/model/wizard-values.ts", import.meta.url));
  });
  return { draw: () => h.render(() => hook(model as unknown as Parameters<typeof useCompanyWizard>[0])), model, saves: () => saves };
}
test("wizard derives address from name but preserves a manually edited address", () => {
  const h = fixture(); h.draw().change("displayName", "Mercury QA");
  assert.equal(h.draw().values.slug, "mercury-qa");
  h.draw().change("slug", "our-team"); h.draw().change("displayName", "New Name");
  assert.equal(h.draw().values.slug, "our-team");
});
test("failed reservation retains the address step and entered details", async () => {
  const h = fixture(); h.draw().change("displayName", "Mercury QA"); h.draw().go("address");
  await h.draw().reserve();
  assert.equal(h.saves(), 1); assert.equal(h.draw().stage, "address"); assert.equal(h.draw().values.displayName, "Mercury QA");
});
test("conversion consent is revoked when the saved setup version changes", () => {
  const h = fixture(); const base = { id: "draft", version: 1, displayName: "Team", slug: "team", status: "ready" };
  Object.assign(h.model, { setup: base }); h.draw().confirm(true); assert.equal(h.draw().consented, true);
  Object.assign(h.model, { setup: { ...base, version: 2 } }); assert.equal(h.draw().consented, false);
});
