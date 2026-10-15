import assert from "node:assert/strict";
import test from "node:test";
import { createRequire } from "node:module";
import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";

const require = createRequire(import.meta.url);
require.extensions[".css"] = module => { module.exports = {}; };
Object.assign(globalThis, { React });
const flush = () => new Promise(resolve => setTimeout(resolve, 0));

test("form requires explicit consent, blocks duplicate clicks, preserves failed input, and aborts on unmount", async () => {
  const { FalconDemoForm } = await import("../FalconDemoForm");
  const previousFetch = globalThis.fetch;
  const previousWindow = globalThis.window;
  Object.assign(globalThis, { window: { setTimeout, clearTimeout } });
  let complete!: (value: Response) => void;
  let signal: AbortSignal | undefined;
  let calls = 0;
  globalThis.fetch = async (_url, options) => {
    calls++;
    signal = options?.signal as AbortSignal;
    return new Promise(resolve => { complete = resolve; });
  };
  let tree!: ReactTestRenderer;
  const focused: string[] = [];
  try {
    await act(async () => { tree = create(<FalconDemoForm locale="en" />, {
      createNodeMock: element => ({ value: "", focus: () => focused.push(String(element.props.name ?? element.props.role)) }),
    }); });
    const find = (name: string) => tree.root.findByProps({ name });
    const submit = () => tree.root.findByType("form").props.onSubmit({ preventDefault() {} });
    assert.equal(find("consent").props.checked, false);
    await act(async () => { await submit(); });
    assert.equal(calls, 0);
    assert.equal(focused[focused.length - 1], "email");
    act(() => find("email").props.onChange({ target: { value: "person@example.com" } }));
    await act(async () => { await submit(); });
    assert.equal(calls, 0);
    assert.equal(focused[focused.length - 1], "consent");
    act(() => find("consent").props.onChange({ target: { checked: true } }));
    act(() => { void submit(); void submit(); });
    assert.equal(calls, 1);
    assert.equal(tree.root.findByType("button").props.disabled, true);
    await act(async () => { complete(new Response(null, { status: 503 })); await flush(); });
    assert.equal(find("email").props.value, "person@example.com");
    assert.equal(find("consent").props.checked, true);
    assert.equal(focused[focused.length - 1], "status");
    assert.equal(tree.root.findAllByProps({ role: "alert" }).length, 1);
    act(() => { void submit(); });
    assert.equal(calls, 2);
    act(() => tree.unmount());
    assert.equal(signal?.aborted, true);
    await act(async () => { complete(Response.json({ status: "accepted" })); await flush(); });
  } finally {
    tree?.unmount();
    globalThis.fetch = previousFetch;
    Object.assign(globalThis, { window: previousWindow });
  }
});

test("form displays success only after accepted storage response, in every supported language", async () => {
  const { FalconDemoForm } = await import("../FalconDemoForm");
  const { demoCopy } = await import("../content/copy");
  const previousFetch = globalThis.fetch;
  const previousWindow = globalThis.window;
  Object.assign(globalThis, { window: { setTimeout, clearTimeout } });
  globalThis.fetch = async () => Response.json({ status: "accepted" });
  try {
    for (const locale of ["en", "ru", "es", "pt"] as const) {
      let tree!: ReactTestRenderer;
      await act(async () => { tree = create(<FalconDemoForm locale={locale} />); });
      act(() => tree.root.findByProps({ name: "email" }).props.onChange({ target: { value: "person@example.com" } }));
      act(() => tree.root.findByProps({ name: "consent" }).props.onChange({ target: { checked: true } }));
      await act(async () => { await tree.root.findByType("form").props.onSubmit({ preventDefault() {} }); });
      assert.equal(tree.root.findByProps({ role: "status" }).children.join(""), demoCopy[locale].success);
      assert.equal(tree.root.findAllByType("button").length, 0);
      act(() => tree.unmount());
    }
  } finally {
    globalThis.fetch = previousFetch;
    Object.assign(globalThis, { window: previousWindow });
  }
});
