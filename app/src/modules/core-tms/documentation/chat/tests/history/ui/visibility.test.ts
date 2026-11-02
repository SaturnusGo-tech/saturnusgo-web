import assert from "node:assert/strict";
import { test } from "node:test";
import { componentHarness } from "../../../../../portfolios/tests/support/component-harness";
import type { ChatHistorySidebar } from "../../../history/presentation/sidebar/ChatHistorySidebar";
import { guideHistoryCopy } from "../../../history/localization/copy";
import { guideChatCopy } from "../../../localization/copy";
import type { useSidebarVisibility } from "../../../history/presentation/sidebar/useSidebarVisibility";

test("desktop history loads only while its sidebar is visible", () => {
  const h = componentHarness(), enabled: boolean[] = []; let visible = false, active = true;
  const { ChatHistorySidebar: render } = h.load<{ ChatHistorySidebar: typeof ChatHistorySidebar }>(new URL("../../../history/presentation/sidebar/ChatHistorySidebar.tsx", import.meta.url), name => {
    if (name === "../../localization/copy") return { guideHistoryCopy };
    if (name.endsWith("localization/copy")) return { guideChatCopy };
    if (name.endsWith("useSidebarVisibility")) return { useSidebarVisibility: () => visible };
    if (name.endsWith("useChatHistory")) return { useChatHistory: (_api: unknown, _owner: string, _revision: number, open: boolean) => {
      enabled.push(open); return { query: "", items: [], loading: false, error: false };
    } };
  });
  const chat = { locale: "en", api: {}, owner: "owner", historyRevision: 0 } as unknown as Parameters<typeof render>[0]["chat"];
  h.render(() => render({ chat, active })); visible = true;
  h.render(() => render({ chat, active })); active = false;
  h.render(() => render({ chat, active })); visible = false; active = true;
  h.render(() => render({ chat, active }));
  assert.deepEqual(enabled, [false, true, false, false]);
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

test("history disclosure defaults open on desktop and closed on narrow screens without undoing manual toggles", () => {
  const h = componentHarness(); let width = 1200, focus = 0;
  const { useHistoryDisclosure: useDisclosure } = h.load<{ useHistoryDisclosure: typeof import('../../../history/state/sidebar/useHistoryDisclosure').useHistoryDisclosure }>(new URL("../../../history/state/sidebar/useHistoryDisclosure.ts", import.meta.url));
  const container = { current: { getBoundingClientRect: () => ({ width }), querySelector: () => ({ focus: () => focus++ }) } as unknown as HTMLElement };
  const render = () => h.render(() => useDisclosure(container));
  render(); let state = render(); assert.equal(state.open, true); assert.equal(state.narrow, false);
  state.toggle(); state = render(); assert.equal(state.open, false);
  width = 1000; h.emit("resize"); assert.equal(render().open, false);
  width = 390; h.emit("resize"); state = render(); assert.equal(state.open, false); assert.equal(state.narrow, true);
  state.toggle(); state = render(); assert.equal(state.open, true);
  state.afterNavigate(); assert.equal(render().open, false);
  state.toggle(); state = render(); state.close(true); assert.equal(render().open, false); assert.equal(focus, 1);
  width = 1200; h.emit("resize"); state = render(); assert.equal(state.open, true); assert.equal(state.narrow, false);
  state.afterNavigate(); assert.equal(render().open, true);
  h.dispose(); width = 390; h.emit("resize"); assert.equal(render().open, true);
});

test("history swipes close only leftward horizontal gestures and suppress the row click", () => {
  const h = componentHarness(); let closed = 0, captured = 0;
  const { useHistorySwipe: useSwipe } = h.load<{ useHistorySwipe: typeof import('../../../history/state/sidebar/useHistorySwipe').useHistorySwipe }>(new URL("../../../history/state/sidebar/useHistorySwipe.ts", import.meta.url));
  const handlers = h.render(() => useSwipe(restore => { assert.equal(restore, true); closed++; }));
  const target = { closest: () => null }, panel = { setPointerCapture: () => captured++ };
  const pointer = (x: number, y: number, other = {}) => ({ isPrimary: true, button: 0, pointerId: 1, clientX: x, clientY: y,
    target, currentTarget: panel, preventDefault() {}, stopPropagation() {}, ...other }) as unknown as Parameters<typeof handlers.onPointerDown>[0];
  handlers.onPointerDown(pointer(120, 20)); handlers.onPointerMove(pointer(50, 23)); handlers.onPointerUp(pointer(50, 23));
  assert.equal(closed, 1); assert.equal(captured, 1);
  let prevented = false;
  handlers.onClickCapture({ detail: 1, preventDefault() { prevented = true; }, stopPropagation() {} } as unknown as Parameters<typeof handlers.onClickCapture>[0]);
  assert.equal(prevented, true);
  handlers.onPointerDown(pointer(120, 20)); handlers.onPointerMove(pointer(115, 70)); handlers.onPointerUp(pointer(50, 90));
  handlers.onPointerDown(pointer(120, 20)); handlers.onPointerMove(pointer(190, 23)); handlers.onPointerUp(pointer(190, 23));
  handlers.onPointerDown(pointer(120, 20, { target: { closest: () => ({}) } })); handlers.onPointerMove(pointer(50, 23)); handlers.onPointerUp(pointer(50, 23));
  handlers.onPointerDown(pointer(120, 20)); handlers.onPointerMove(pointer(50, 23)); handlers.onPointerCancel(); handlers.onPointerUp(pointer(50, 23));
  assert.equal(closed, 1);
  prevented = false;
  handlers.onPointerDown(pointer(120, 20)); handlers.onPointerMove(pointer(98, 23)); handlers.onPointerUp(pointer(98, 23));
  handlers.onClickCapture({ detail: 1, preventDefault() { prevented = true; }, stopPropagation() {} } as unknown as Parameters<typeof handlers.onClickCapture>[0]);
  assert.equal(closed, 1); assert.equal(prevented, true);
  h.dispose();
});
