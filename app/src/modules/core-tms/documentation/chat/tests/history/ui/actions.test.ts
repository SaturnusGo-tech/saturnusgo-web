import assert from "node:assert/strict";
import { test } from "node:test";
import { componentHarness, invoke, nodes } from "../../../../../portfolios/tests/support/component-harness";
import type { ChatHistoryPopover } from "../../../history/presentation/ChatHistoryPopover";
import { guideHistoryCopy } from "../../../history/localization/copy";
import type { ChatHistorySidebar } from "../../../history/presentation/sidebar/ChatHistorySidebar";
import { guideChatCopy } from "../../../localization/copy";

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

test("conversation sidebar searches history, opens chats and preserves selected-row management", () => {
  const h = componentHarness(), changes: string[] = [];
  const history = { query: "", items: [{ id: "current" }, { id: "other" }], loading: false, error: false, cursor: "next",
    setQuery: (value: string) => changes.push(`search:${value}`), more: () => changes.push("more") };
  const { ChatHistorySidebar: render } = h.load<{ ChatHistorySidebar: typeof ChatHistorySidebar }>(new URL("../../../history/presentation/sidebar/ChatHistorySidebar.tsx", import.meta.url), name => {
    if (name.includes("history/localization/copy") || name === "../../localization/copy") return { guideHistoryCopy };
    if (name.endsWith("localization/copy")) return { guideChatCopy };
    if (name.endsWith("useSidebarVisibility")) return { useSidebarVisibility: () => true };
    if (name.endsWith("useChatHistory")) return { useChatHistory: () => history };
  });
  const chat = { locale: "en", api: {}, chatId: "current", newChat: () => changes.push("new"), selectChat: (id: string) => changes.push(`open:${id}`),
    refreshHistory: () => changes.push("list"), refresh: () => changes.push("conversation") } as unknown as Parameters<typeof render>[0]["chat"];
  const all = () => nodes(h.render(() => render({ chat })));
  invoke(all().find(node => node.type === "input")!, "onChange", { target: { value: "build" } });
  invoke(all().find(node => node.type === "button" && node.props.children === guideHistoryCopy.en.loadMore)!, "onClick");
  const rows = all().filter(node => node.type === "HistoryItem");
  assert.equal(rows[0].props.selected, true); assert.equal(rows[1].props.selected, false);
  (rows[1].props.onOpen as () => void)();
  assert.deepEqual(changes, ["search:build", "more", "open:other"]);
  changes.length = 0;
  (rows[0].props.onChanged as (archived: boolean) => void)(true); assert.deepEqual(changes, ["list", "new"]);
  changes.length = 0;
  (rows[0].props.onChanged as (archived: boolean) => void)(false); assert.deepEqual(changes, ["list", "conversation"]);
  changes.length = 0;
  (rows[1].props.onChanged as (archived: boolean) => void)(true); assert.deepEqual(changes, ["list"]);
});
