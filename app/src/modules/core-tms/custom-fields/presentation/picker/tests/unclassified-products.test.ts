import assert from "node:assert/strict";
import test from "node:test";
import { componentHarness, nodes } from "../../../../portfolios/tests/support/component-harness";
import { field, scope, value } from "../../../tests/support/fixtures";
import type { CustomFieldPicker } from "../CustomFieldPicker";

test("the product picker requests scoped legacy inclusion and separates unclassified options", t => {
  let query: Record<string, unknown> = {};
  let chosen: unknown;
  const legacy = { ...value, id: "deep-links", label: "Deep Links", parentValueId: null, isLegacy: true };
  const child = { ...value, id: "one", label: "1", parentValueId: "whole-product" };
  const h = componentHarness(); t.after(h.dispose);
  const { CustomFieldPicker: render } = h.load<{ CustomFieldPicker: typeof CustomFieldPicker }>(
    new URL("../CustomFieldPicker.tsx", import.meta.url), name => {
      if (name.endsWith("useTmsLocale")) return { useTmsLocale: () => ({ locale: "en" }) };
      if (name.endsWith("field-labels")) return { customFieldLabel: () => "Product", customValueLabel: (entry: typeof value) => entry.label };
      if (name.endsWith("field-validation")) return { parseFieldValue: () => null, normalizedFieldLabel: (label: string) => label };
      if (name.endsWith("useCustomFieldValues")) return { useCustomFieldValues: (input: typeof query) => {
        query = input; return { search: "", items: [child, legacy], loading: false, setSearch() {} };
      } };
      if (name.endsWith("useFieldValueWrite")) return { useFieldValueWrite: () => ({ reset() {} }) };
      return undefined;
    });
  const all = nodes(h.render(() => render({ ...scope, field: { ...field, systemKey: "product" },
    parentValueId: "whole-product", selected: [], onChange: entries => { chosen = entries; } })));
  assert.equal(query.parentValueId, "whole-product");
  assert.equal(query.includeUnclassified, true);
  const section = all.find(node => node.type === "ListboxSection" && node.key === "unclassified");
  assert.ok(section, "legacy products must remain visible in a separate section");
  const option = nodes(section).find(node => node.type === "ListboxItem" && node.key === legacy.id)!;
  (option.props.onPress as () => void)();
  assert.equal((chosen as typeof value[])[0].parentValueId, null);
});
