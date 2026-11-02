import assert from "node:assert/strict";
import { test } from "node:test";
import { componentHarness } from "../../../../../portfolios/tests/support/component-harness";
import type { ChatHistorySidebar } from "../../../history/presentation/sidebar/ChatHistorySidebar";
import { guideHistoryCopy } from "../../../history/localization/copy";
import { guideChatCopy } from "../../../localization/copy";
import type { useSidebarVisibility } from "../../../history/presentation/sidebar/useSidebarVisibility";

test("desktop history loads only while its sidebar is visible", () => {
  const h = componentHarness(), enabled: boolean[] = []; let visible = false;
  const { ChatHistorySidebar: render } = h.load<{ ChatHistorySidebar: typeof ChatHistorySidebar }>(new URL("../../../history/presentation/sidebar/ChatHistorySidebar.tsx", import.meta.url), name => {
    if (name === "../../localization/copy") return { guideHistoryCopy };
    if (name.endsWith("localization/copy")) return { guideChatCopy };
    if (name.endsWith("useSidebarVisibility")) return { useSidebarVisibility: () => visible };
    if (name.endsWith("useChatHistory")) return { useChatHistory: (_api: unknown, _owner: string, _revision: number, open: boolean) => {
      enabled.push(open); return { query: "", items: [], loading: false, error: false };
    } };
  });
  const chat = { locale: "en", api: {}, owner: "owner", historyRevision: 0 } as unknown as Parameters<typeof render>[0]["chat"];
  h.render(() => render({ chat })); visible = true;
  h.render(() => render({ chat })); visible = false;
  h.render(() => render({ chat }));
  assert.deepEqual(enabled, [false, true, false]);
});

test("sidebar measurement tracks display changes and disconnects on unmount", () => {
  let width = 0, reads = 0, disconnected = 0, resized = () => {};
  const element = { getBoundingClientRect: () => { reads++; return { width }; } } as HTMLElement;
  const h = componentHarness(undefined, { ResizeObserver: class {
    constructor(callback: () => void) { resized = callback; }
    observe(target: HTMLElement) { assert.equal(target, element); }
    disconnect() { disconnected++; }
  } });
  const { useSidebarVisibility: useVisibility } = h.load<{ useSidebarVisibility: typeof useSidebarVisibility }>(new URL("../../../history/presentation/sidebar/useSidebarVisibility.ts", import.meta.url));
  const ref = { current: element }, render = () => h.render(() => useVisibility(ref));
  assert.equal(render(), false); assert.equal(render(), false);
  width = 240; resized(); assert.equal(render(), true);
  width = 0; resized(); assert.equal(render(), false);
  h.dispose(); assert.equal(disconnected, 1);
  const before = reads; width = 240; resized(); h.emit("resize");
  assert.equal(render(), false); assert.equal(reads, before);
});

test("window resize measures the sidebar when ResizeObserver is unavailable", () => {
  let width = 240;
  const h = componentHarness();
  const { useSidebarVisibility: useVisibility } = h.load<{ useSidebarVisibility: typeof useSidebarVisibility }>(new URL("../../../history/presentation/sidebar/useSidebarVisibility.ts", import.meta.url));
  const ref = { current: { getBoundingClientRect: () => ({ width }) } as HTMLElement };
  const render = () => h.render(() => useVisibility(ref));
  assert.equal(render(), false); assert.equal(render(), true);
  width = 0; h.emit("resize"); assert.equal(render(), false);
  h.dispose(); width = 240; h.emit("resize"); assert.equal(render(), false);
});
