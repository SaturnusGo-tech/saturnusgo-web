import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { IntegrationSelectTrigger } from "../../select-trigger/IntegrationSelectTrigger";

Object.assign(globalThis, { React });
test("computed HeroUI label IDs remain resolvable while keyboard events, button semantics and ref are preserved", async () => {
  let view!: ReactTestRenderer, pressed = "";
  const ref = React.createRef<HTMLButtonElement>(), node = { focus() {} };
  const libraryProps = { selectedKeys: new Set(["one"]), selectionMode: "single", isLoading: false, onPress() {} };
  try {
    await act(async () => { view = create(<IntegrationSelectTrigger {...libraryProps} ref={ref} aria-labelledby="react-aria:r1:value,react-aria:r2:label,"
      aria-expanded aria-controls="menu-1" data-open onKeyDown={event => { pressed = event.key; }}>Current</IntegrationSelectTrigger>, { createNodeMock: () => node }); });
    const trigger = view.root.findByType("button");
    assert.equal(trigger.props["aria-labelledby"], "react-aria:r1:value react-aria:r2:label");
    assert.equal(trigger.props.type, "button");
    assert.equal(trigger.props["aria-controls"], "menu-1");
    assert.equal(trigger.props["data-open"], true);
    assert.deepEqual(trigger.children, ["Current"]);
    for (const name of ["selectedKeys", "selectionMode", "isLoading", "onPress"]) assert.equal(trigger.props[name], undefined);
    assert.equal(ref.current, node);
    trigger.props.onKeyDown({ key: "ArrowDown" });
    assert.equal(pressed, "ArrowDown");
    await act(async () => view.update(<IntegrationSelectTrigger aria-labelledby="value-id label-id" disabled/>));
    assert.equal(view.root.findByType("button").props["aria-labelledby"], "value-id label-id");
    assert.equal(view.root.findByType("button").props.disabled, true);
    await act(async () => view.update(<IntegrationSelectTrigger data-disabled="true"/>));
    assert.equal(view.root.findByType("button").props.disabled, true, "HeroUI supplies its disabled state as a data attribute to a custom trigger");
    assert.equal(view.root.findByType("button").props["aria-disabled"], true);
    await act(async () => view.update(<IntegrationSelectTrigger data-disabled="false"/>));
    assert.equal(view.root.findByType("button").props.disabled, false);
  } finally { await act(async () => view?.unmount()); }
});

test("pointer opening focuses its trigger before the overlay snapshots restoration, without intercepting dismissal", async () => {
  const order: string[] = [];
  let view!: ReactTestRenderer;
  const node = { focus: (options: FocusOptions) => { assert.equal(options.preventScroll, true); order.push("trigger-focus"); } };
  const pointer = { button: 0, defaultPrevented: false, currentTarget: node };
  try {
    await act(async () => { view = create(<IntegrationSelectTrigger onPointerDownCapture={() => order.push("capture")}
      onPointerDown={() => order.push("overlay-open")} onBlur={() => order.push("outside-focus")}/>); });
    const trigger = view.root.findByType("button");
    trigger.props.onPointerDownCapture(pointer);
    trigger.props.onPointerDown(pointer);
    assert.deepEqual(order, ["capture", "trigger-focus", "overlay-open"]);
    trigger.props.onBlur();
    assert.deepEqual(order, ["capture", "trigger-focus", "overlay-open", "outside-focus"]);
    await act(async () => view.update(<IntegrationSelectTrigger disabled/>));
    view.root.findByType("button").props.onPointerDownCapture(pointer);
    assert.equal(order.filter(item => item === "trigger-focus").length, 1);
    await act(async () => view.update(<IntegrationSelectTrigger data-disabled="true"/>));
    view.root.findByType("button").props.onPointerDownCapture(pointer);
    assert.equal(order.filter(item => item === "trigger-focus").length, 1);
    await act(async () => view.update(<IntegrationSelectTrigger/>));
    view.root.findByType("button").props.onPointerDownCapture({ ...pointer, defaultPrevented: true });
    view.root.findByType("button").props.onPointerDownCapture({ ...pointer, button: 2 });
    assert.equal(order.filter(item => item === "trigger-focus").length, 1);
  } finally { await act(async () => view?.unmount()); }
});
