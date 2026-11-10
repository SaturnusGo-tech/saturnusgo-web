import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { useProductDocLinkHover } from "./useProductDocLinkHover";

test("leaving an old documentation link does not cancel the next preview", (context) => {
  context.mock.timers.enable({ apis: ["setTimeout"] });
  const originalWindow = globalThis.window;
  globalThis.window = new EventTarget() as Window & typeof globalThis;
  let renderer: ReactTestRenderer | undefined;
  context.after(() => {
    act(() => renderer?.unmount());
    globalThis.window = originalWindow;
  });

  const first = { isConnected: true, matches: () => false } as unknown as HTMLAnchorElement;
  const second = { isConnected: true, matches: () => false } as unknown as HTMLAnchorElement;
  let hover!: ReturnType<typeof useProductDocLinkHover>;
  function Harness() {
    hover = useProductDocLinkHover();
    return null;
  }

  act(() => { renderer = create(createElement(Harness) as unknown as Parameters<typeof create>[0]); });
  act(() => hover.show(first, 0));
  assert.equal(hover.anchor, first);
  act(() => {
    hover.show(second);
    hover.hide(first);
  });
  act(() => context.mock.timers.tick(170));
  assert.equal(hover.anchor, second);

  act(() => hover.hide(second));
  act(() => context.mock.timers.tick(50));
  act(() => hover.retain());
  act(() => context.mock.timers.tick(110));
  assert.equal(hover.anchor, second);

  act(() => hover.hide(second));
  act(() => context.mock.timers.tick(110));
  assert.equal(hover.anchor, null);
});
