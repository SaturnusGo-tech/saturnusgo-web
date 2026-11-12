import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";

Object.assign(globalThis, { React });
const loader = require("node:module"), previous = loader._load, previousCss = require.extensions[".css"];
require.extensions[".css"] = (module: NodeModule) => { module.exports = {}; };
loader._load = function(name: string, parent: NodeModule, main: boolean) {
  return name === "@heroui/react" ? { Input: "input", Textarea: "textarea" } : previous.call(this, name, parent, main);
};
const { IntegrationInput } = require("../../input/IntegrationInput") as typeof import("../../input/IntegrationInput");
const { IntegrationTextarea } = require("../../textarea/IntegrationTextarea") as typeof import("../../textarea/IntegrationTextarea");
loader._load = previous;
if (previousCss) require.extensions[".css"] = previousCss; else delete require.extensions[".css"];

function wrapperFixture() {
  const attributes = new Map<string, string>();
  const node = { setAttribute: (name: string, value: string) => attributes.set(name, value) } as unknown as HTMLDivElement;
  return { node, attributes };
}

test("Input and Textarea mark the actual wrapper, preserve caller callbacks and keep native refs separate", async () => {
  for (const multiline of [false, true]) {
    const wrapper = wrapperFixture(), forwarded: (HTMLDivElement | null)[] = [];
    const callerRef = (node: HTMLDivElement | null) => { forwarded.push(node); };
    const native = { kind: multiline ? "textarea" : "input" } as unknown as HTMLElement;
    let nativeCurrent: HTMLElement | null = null, view!: ReactTestRenderer;
    const nativeRef = (node: HTMLElement | null) => { nativeCurrent = node; };
    const render = (value: string) => multiline
      ? <IntegrationTextarea aria-label="Notes" value={value} wrapperRef={callerRef} ref={nativeRef}/>
      : <IntegrationInput aria-label="Name" value={value} wrapperRef={callerRef} ref={nativeRef}/>;
    try {
      await act(async () => { view = create(render("First"), { createNodeMock: () => native }); });
      const control = () => view.root.findByType(multiline ? "textarea" : "input");
      const mark = control().props.wrapperRef;
      assert.equal(typeof mark, "function");
      mark(wrapper.node);
      assert.equal(wrapper.attributes.get("data-input-shell"), "", "the visible wrapper opts out of native-field styling");
      assert.deepEqual(forwarded, [wrapper.node]);
      assert.equal(nativeCurrent, native, "the public native editor ref must not receive the wrapper");
      await act(async () => view.update(render("Second")));
      assert.equal(control().props.wrapperRef, mark, "value updates must not detach and reattach the wrapper ref");
      mark(null);
      assert.deepEqual(forwarded, [wrapper.node, null]);
    } finally { await act(async () => view?.unmount()); }
    assert.equal(nativeCurrent, null);
  }
});

test("Input and Textarea preserve caller object refs and create a marker ref when none is supplied", async () => {
  for (const multiline of [false, true]) {
    const callerRef = React.createRef<HTMLDivElement>(), wrapper = wrapperFixture();
    let view!: ReactTestRenderer;
    const render = (withCaller: boolean) => multiline
      ? <IntegrationTextarea aria-label="Notes" wrapperRef={withCaller ? callerRef : undefined}/>
      : <IntegrationInput aria-label="Name" wrapperRef={withCaller ? callerRef : undefined}/>;
    try {
      await act(async () => { view = create(render(true)); });
      const control = () => view.root.findByType(multiline ? "textarea" : "input");
      const mark = control().props.wrapperRef;
      assert.equal(typeof mark, "function");
      mark(wrapper.node);
      assert.equal(callerRef.current, wrapper.node);
      assert.equal(wrapper.attributes.get("data-input-shell"), "");
      mark(null);
      assert.equal(callerRef.current, null);
      await act(async () => view.update(render(false)));
      const standalone = wrapperFixture();
      assert.equal(typeof control().props.wrapperRef, "function");
      control().props.wrapperRef(standalone.node);
      assert.equal(standalone.attributes.get("data-input-shell"), "");
    } finally { await act(async () => view?.unmount()); }
  }
});
