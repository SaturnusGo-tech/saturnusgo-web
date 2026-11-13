import assert from "node:assert/strict";
import test from "node:test";
import { componentHarness, nodes, type Node } from "../../../../../portfolios/tests/support/component-harness";
import type { ProductDocTaxonomyFields } from "../ProductDocTaxonomyFields";
import type { ProductDocTaxonomySelector } from "../ProductDocTaxonomySelector";

test("choosing an explicitly unclassified product clears the documentation group", t => {
  let next: unknown;
  const h = componentHarness(); t.after(h.dispose);
  const { ProductDocTaxonomyFields: render } = h.load<{ ProductDocTaxonomyFields: typeof ProductDocTaxonomyFields }>(
    new URL("../ProductDocTaxonomyFields.tsx", import.meta.url), name => {
      if (name === "framer-motion") return { useReducedMotion: () => false };
      if (name.endsWith("TmsHttpClientContext")) return { useOptionalTmsHttpClient: () => ({}) };
      if (name.endsWith("useTmsLocale")) return { useTmsLocale: () => ({ locale: "en" }) };
      return undefined;
    });
  const outer = h.render(() => render({ scope: { workspaceId: "w", projectId: "p" },
    value: { productGroup: { id: "group", label: "Весь продукт" }, product: null }, onChange: value => { next = value; } })) as unknown as Node;
  const all = nodes(h.render(() => (outer.type as unknown as (props: unknown) => unknown)(outer.props)));
  const picker = all.find(node => node.type === "ProductDocTaxonomySelector")!;
  (picker.props.onSelect as (dimension: string, value: unknown, unclassified: boolean) => void)("product", { id: "deep-links", label: "Deep Links" }, true);
  assert.deepEqual(JSON.parse(JSON.stringify(next)), { productGroup: null, product: { id: "deep-links", label: "Deep Links" } });
});

test("documentation product options include legacy values explicitly and mark the ungrouped selection", t => {
  let query: Record<string, unknown> = {};
  let unclassified: unknown;
  const h = componentHarness(); t.after(h.dispose);
  const { ProductDocTaxonomySelector: render } = h.load<{ ProductDocTaxonomySelector: typeof ProductDocTaxonomySelector }>(
    new URL("../ProductDocTaxonomySelector.tsx", import.meta.url), name => {
      if (name === "framer-motion") return { useReducedMotion: () => false };
      if (name.endsWith("useTmsLocale")) return { useTmsLocale: () => ({ locale: "en" }) };
      if (name.endsWith("useCustomFieldCatalog")) return { useCustomFieldCatalog: () => ({ items: [{ id: "products", systemKey: "product" }] }) };
      if (name.endsWith("useCustomFieldValues")) return { useCustomFieldValues: (input: typeof query) => {
        query = input; return { search: "", items: [{ id: "one", label: "1", parentValueId: "group" },
          { id: "deep-links", label: "Deep Links", parentValueId: null, isLegacy: true }], setSearch() {} };
      } };
      return undefined;
    });
  const initial = h.render(() => render({ scope: { workspaceId: "w", projectId: "p" }, dimension: "product", filter: false,
    value: { productGroup: { id: "group", label: "Весь продукт" }, product: null }, labels: { product: "Product", productGroup: "Group" },
    onDimension() {}, onSelect: (_dimension, _value, marker) => { unclassified = marker; } }));
  const inner = nodes(initial).find(node => typeof node.type === "function")!;
  const all = nodes(h.render(() => (inner.type as unknown as (props: unknown) => unknown)({ ...inner.props, autoFocus: false })));
  assert.equal(query.includeUnclassified, true);
  assert.ok(all.find(node => node.type === "ListboxSection" && node.key === "unclassified"));
  (all.find(node => node.type === "Listbox")!.props.onSelectionChange as (keys: Set<string>) => void)(new Set(["deep-links"]));
  assert.equal(unclassified, true);
});
