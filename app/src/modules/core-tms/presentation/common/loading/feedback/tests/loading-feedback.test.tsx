import assert from "node:assert/strict";
import { test, type TestContext } from "node:test";
import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { useLoadingFeedback } from "../useLoadingFeedback";

function setup(t: TestContext, pending = true) {
  t.mock.timers.enable({ apis: ["setTimeout", "Date"] });
  function Probe({ pending }: { pending: boolean }) {
    return <div data-visible={useLoadingFeedback(pending)} />;
  }
  let view!: ReactTestRenderer;
  act(() => { view = create(<Probe pending={pending} />); });
  t.after(() => act(() => view.unmount()));
  return {
    visible: () => view.root.findByType("div").props["data-visible"],
    update: (pending: boolean) => act(() => view.update(<Probe pending={pending} />)),
    advance: (ms: number) => act(() => t.mock.timers.tick(ms)),
  };
}

test("short requests never reveal the loading feedback", (t) => {
  const screen = setup(t);
  screen.advance(299);
  assert.equal(screen.visible(), false);
  screen.update(false);
  screen.advance(1000);
  assert.equal(screen.visible(), false);
});

test("a revealed fallback stays briefly, then yields to the result", (t) => {
  const screen = setup(t);
  screen.advance(300);
  assert.equal(screen.visible(), true);
  screen.update(false);
  screen.advance(249);
  assert.equal(screen.visible(), true);
  screen.advance(1);
  assert.equal(screen.visible(), false);
});

test("a renewed request cancels the scheduled dismissal", (t) => {
  const screen = setup(t);
  screen.advance(300);
  screen.update(false);
  screen.advance(50);
  screen.update(true);
  screen.advance(1000);
  assert.equal(screen.visible(), true);
  screen.update(false);
  assert.equal(screen.visible(), false);
});
