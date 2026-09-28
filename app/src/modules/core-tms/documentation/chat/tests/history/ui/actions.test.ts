import assert from "node:assert/strict";
import { test } from "node:test";
import { componentHarness, invoke, nodes } from "../../../../../portfolios/tests/support/component-harness";
import type { ChatHistoryPopover } from "../../../history/presentation/ChatHistoryPopover";
import { guideHistoryCopy } from "../../../history/localization/copy";

test("archiving the selected conversation starts a blank chat; another row only refreshes history", () => {
  const h = componentHarness(), changes: string[] = [];
  const { ChatHistoryPopover: render } = h.load<{ ChatHistoryPopover: typeof ChatHistoryPopover }>(new URL("../../../history/presentation/ChatHistoryPopover.tsx", import.meta.url), name => {
    if (name.endsWith("localization/copy")) return { guideHistoryCopy };
    if (name.endsWith("useAnchoredPopup")) return { useAnchoredPopup() {} };
    if (name.endsWith("useChatHistory")) return { useChatHistory: () => ({ query: "", items: [{ id: "current" }, { id: "other" }], loading: false, error: false }) };
  });
  const chat = { locale: "en", api: {}, chatId: "current", refreshHistory: () => changes.push("list"), newChat: () => changes.push("new"),
    refresh: () => changes.push("conversation") } as unknown as Parameters<typeof render>[0]["chat"];
  const all = () => nodes(h.render(() => render({ chat })));
  invoke(all().find(node => node.props["aria-label"] === guideHistoryCopy.en.history)!, "onClick");
  const rows = all().filter(node => node.type === "HistoryItem"); assert.equal(rows.length, 2);
  (rows[0].props.onChanged as (archived: boolean) => void)(true); assert.deepEqual(changes, ["list", "new"]);
  changes.length = 0; (rows[1].props.onChanged as (archived: boolean) => void)(true); assert.deepEqual(changes, ["list"]);
  changes.length = 0; (rows[0].props.onChanged as (archived: boolean) => void)(false); assert.deepEqual(changes, ["list", "conversation"]);
});
