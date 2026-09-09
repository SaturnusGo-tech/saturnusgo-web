import assert from "node:assert/strict";
import test from "node:test";
import { componentHarness, invoke, nodes } from "../../../tests/support/component-harness";
import { organizationCopy } from "../../model/copy";
import type { Checklist } from "../Checklist";
import type { ChecklistItem } from "../../model/organization";
test("checklist additions preserve stable item ID across a failed save, then clear draft after confirmation", async () => {
  const h = componentHarness(); const saved: readonly ChecklistItem[] = [];
  const attempts: (readonly ChecklistItem[])[] = []; let succeed = false;
  const view = h.load<{ Checklist: typeof Checklist }>(new URL("../Checklist.tsx", import.meta.url), (name) => {
    if (name.endsWith("useTmsLocale")) return { useTmsLocale: () => ({ locale: "ru" }) };
    if (name.endsWith("model/copy")) return { organizationCopy };
  });
  const render = () => nodes(h.render(() => view.Checklist({ items: saved, onChange: async (items) => { attempts.push(items); return succeed; } })));
  let all = render(); invoke(all.find((node) => node.props["aria-expanded"] === false)!, "onClick");
  all = render(); invoke(all.find((node) => node.type === "input")!, "onChange", { target: { value: "Проверить оплату" } });
  all = render(); await invoke(all.find((node) => node.props["aria-label"] === "Добавить пункт")!, "onClick");
  succeed = true; all = render(); await invoke(all.find((node) => node.props["aria-label"] === "Добавить пункт")!, "onClick");
  assert.equal(attempts[0][0].id, attempts[1][0].id); assert.equal(attempts[1][0].text, "Проверить оплату");
  await new Promise((done) => setImmediate(done)); assert.equal(render().find((node) => node.type === "input")?.props.value, "");
});
