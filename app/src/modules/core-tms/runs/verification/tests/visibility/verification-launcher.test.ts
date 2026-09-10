import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { useVerificationLauncher } from "../../state/launcher/useVerificationLauncher";

test("hiding survives remounts, stays workspace scoped, and works with blocked storage", async () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, "window");
  const values = new Map<string, string>();
  let blocked = false;
  Object.defineProperty(globalThis, "window", { configurable: true, value: { localStorage: {
    getItem(key: string) { if (blocked) throw new Error("SecurityError"); return values.get(key) ?? null; },
    setItem(key: string, value: string) { if (blocked) throw new Error("SecurityError"); values.set(key, value); },
  } } });
  let current!: ReturnType<typeof useVerificationLauncher>;
  function Probe({ workspaceId }: { workspaceId: string }) { current = useVerificationLauncher(workspaceId); return null; }
  // The renderer bundles React 18 types; the app has React 19 type declarations.
  const probe = (workspaceId: string) => createElement(Probe, { workspaceId }) as unknown as Parameters<typeof create>[0];
  let renderer!: ReactTestRenderer;
  try {
    await act(async () => { renderer = create(probe("umbrella")); });
    assert.equal(current.ready, true); assert.equal(current.collapsed, false);
    await act(async () => current.setCollapsed(true));
    await act(async () => renderer.unmount());
    await act(async () => { renderer = create(probe("umbrella")); });
    assert.equal(current.collapsed, true);
    await act(async () => renderer.update(probe("darwin")));
    assert.equal(current.collapsed, false);
    await act(async () => renderer.update(probe("umbrella")));
    assert.equal(current.collapsed, true);
    await act(async () => current.setCollapsed(false));
    await act(async () => renderer.unmount());
    blocked = true;
    await act(async () => { renderer = create(probe("umbrella")); });
    assert.equal(current.ready, true); assert.equal(current.collapsed, false);
    await act(async () => current.setCollapsed(true)); assert.equal(current.collapsed, true);
    await act(async () => current.setCollapsed(false)); assert.equal(current.collapsed, false);
  } finally {
    await act(async () => renderer?.unmount());
    if (original) Object.defineProperty(globalThis, "window", original); else Reflect.deleteProperty(globalThis, "window");
  }
});
