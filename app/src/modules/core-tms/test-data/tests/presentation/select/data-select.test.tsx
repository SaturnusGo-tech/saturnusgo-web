import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { after, before, test } from "node:test";
import React from "react";
import { act, create } from "react-test-renderer";
import { installRenderControls } from "../../support/render-controls";

const require = createRequire(import.meta.url), previous = Object.getOwnPropertyDescriptor(globalThis, "React");
let DataSelect: typeof import("../../../presentation/select/DataSelect")["DataSelect"];
before(() => {
  Object.assign(globalThis, { React });
  const restore = installRenderControls();
  try { DataSelect = require("../../../presentation/select/DataSelect").DataSelect; } finally { restore(); }
});
after(() => { if (previous) Object.defineProperty(globalThis, "React", previous); else Reflect.deleteProperty(globalThis, "React"); });

test("menu has trigger width before opening and keeps its viewport when async choices arrive", async () => {
  const openEvents: boolean[] = [];
  const properties = { "aria-label": "Sources", isLoading: true, onOpenChange: (open: boolean) => openEvents.push(open) };
  let view: ReturnType<typeof create>;
  await act(async () => {
    view = create(<DataSelect {...properties}>{[]}</DataSelect>, {
      createNodeMock: node => node.type === "div" ? { querySelector: () => ({ getBoundingClientRect: () => ({ width: 327, top: 140, bottom: 170 }) }) } : null,
    });
  });
  try {
    let select = view!.root.findByType("select");
    assert.equal(typeof select.props.onOpenChange, "function");
    await act(async () => select.props.onOpenChange(true));
    select = view!.root.findByType("select");
    assert.equal(select.props.isOpen, true);
    assert.equal(select.props.popoverProps.style.width, 327, "first menu paint must already match its trigger");
    const viewport = select.props.scrollShadowProps.style.height;
    assert.ok(viewport > 0, "empty async content reserves space for its skeleton");
    assert.equal(select.props.listboxProps["aria-busy"], true);
    assert.ok(select.props.listboxProps.emptyContent, "loading supplies skeleton rows instead of a no-items flash");
    await act(async () => view!.update(<DataSelect {...properties} isLoading={false}>
      {Array.from({ length: 12 }, (_, index) => <option key={index}>{`Source ${index}`}</option>)}
    </DataSelect>));
    select = view!.root.findByType("select");
    assert.equal(select.props.scrollShadowProps.style.height, viewport, "loaded data must scroll inside the existing viewport");
    assert.equal(select.props.popoverProps.style.width, 327);
    assert.equal(select.props.popoverProps.shouldBlockScroll, false, "opening a menu must not lock and shift the page");
    assert.deepEqual(openEvents, [true]);
  } finally { await act(async () => view!.unmount()); }
});
