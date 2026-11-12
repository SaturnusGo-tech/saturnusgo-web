import assert from "node:assert/strict";
import { test } from "node:test";
import { componentHarness, nodes, invoke } from "../../../portfolios/tests/support/component-harness";
import type { AdvancedEventFilters } from "../../presentation/advanced/AdvancedEventFilters";
import { notificationCategories } from "../../presentation/events/category-copy";
function setup(saved = true) {
  const h = componentHarness(), calls: unknown[][] = [];
  const { AdvancedEventFilters: render } = h.load<{ AdvancedEventFilters: typeof AdvancedEventFilters }>(new URL("../../presentation/advanced/AdvancedEventFilters.tsx", import.meta.url),
    name => name.endsWith("category-copy") ? { notificationCategories } : undefined);
  let closed = 0;
  let settings = { version: 4, categories: ["runs"], excludedEventTypes: [], availableEvents: [{ type: "run.complete", category: "runs", labelEn: "Run completed", labelRu: "Прогон завершён" }] };
  const draw = () => nodes(h.render(() => render({ ru: false, model: { settings, busy: false, changeExcludedEvents: async (...args: unknown[]) => { calls.push(args); return saved; } }, onSaved: () => { closed++; } } as never)));
  return { draw, calls, closed: () => closed, refresh: (version = settings.version) => { settings = { ...settings, version, excludedEventTypes: [] }; } };
}
test("a same-version focus refresh preserves unsaved event choices", () => {
  const h = setup(); let rows = h.draw();
  invoke(rows.find(n => n.type === "PreferenceSwitch")!, "onChange", false);
  assert.equal(h.draw().find(n => n.type === "PreferenceSwitch")!.props.selected, false);
  h.refresh(); h.draw();
  assert.equal(h.draw().find(n => n.type === "PreferenceSwitch")!.props.selected, false);
});
for (const success of [true, false]) test(`advanced saves use reviewed version and only close on success (${success})`, async () => {
  const h = setup(success); const rows = h.draw();
  invoke(rows.find(n => n.type === "PreferenceSwitch")!, "onChange", false);
  invoke(h.draw().find(n => n.type === "form")!, "onSubmit", { preventDefault() {} });
  await Promise.resolve(); await Promise.resolve();
  assert.deepEqual(JSON.parse(JSON.stringify(h.calls)), [[["run.complete"], 4]]); assert.equal(h.closed(), success ? 1 : 0);
});
