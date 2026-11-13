import assert from "node:assert/strict";
import test from "node:test";
import { componentHarness, invoke, nodes, type Node } from "../../../../../portfolios/tests/support/component-harness";
import type { ProductDocItemMenu } from "../../menu/ProductDocItemMenu";
import type { ProductDocLifecycleContext } from "../../../../state/lifecycle/product-doc-lifecycle-context";
import { productDocsCopy } from "../../../../localization/copy";

const AnchoredDropdown = Symbol("AnchoredDropdown");

function fixture(instant = false) {
  const frames: (() => void)[] = [];
  const microtasks: (() => void)[] = [];
  const h = componentHarness(undefined, { requestAnimationFrame: (frame: () => void) => frames.push(frame),
    queueMicrotask: (task: () => void) => microtasks.push(task) });
  const { ProductDocItemMenu: View } = h.load<{ ProductDocItemMenu: typeof ProductDocItemMenu }>(
    new URL("../../menu/ProductDocItemMenu.tsx", import.meta.url), name => {
      if (name === "@heroui/system") return { useProviderContext: () => ({ disableAnimation: instant }) };
      if (name === "framer-motion") return { useReducedMotion: () => false };
      if (name.endsWith("AnchoredDropdown")) return { AnchoredDropdown };
    });
  let invoked = 0;
  let props: Parameters<typeof View>[0] = { node: { id: "doc", kind: "page", title: "Untitled page", parentId: null,
    draftVersion: 1, publishedVersion: null }, permissions: { canEdit: true, canArchive: true, canDelete: false }, tree: true,
    context: { api: {} as ProductDocLifecycleContext["api"], scope: { workspaceId: "w", projectId: "p" }, copy: productDocsCopy("en"), locale: "en", drafts: new Map(),
      onCompleted() {}, onChanged() {} } as ProductDocLifecycleContext };
  const render = (next: Partial<typeof props> = {}) => { props = { ...props, ...next }; return nodes(h.render(() => View(props))); };
  const action = () => { invoked++; };
  const element = { isConnected: true };
  const mountMenu = (view: Node[]) => { const menu = view.find(node => node.type === "DropdownMenu")!; invoke(menu, "ref", element); return menu; };
  const unmountMenu = (menu: Node) => { invoke(menu, "ref", null); element.isConnected = false; };
  const flushMicrotasks = () => { while (microtasks.length) microtasks.shift()!(); };
  const flushFrames = () => { while (frames.length) frames.shift()!(); };
  return { h, render, frames, mountMenu, unmountMenu, flushMicrotasks, flushFrames, props: () => props, action, count: () => invoked };
}

test("item actions follow independent server capabilities, including an empty fresh draft", t => {
  for (const permissions of [{ canEdit: true, canArchive: true, canDelete: true },
    { canEdit: false, canArchive: true, canDelete: false }, { canEdit: true }]) {
    const f = fixture(); t.after(f.h.dispose);
    const view = f.render({ permissions });
    const labels = view.filter(node => node.type === "DropdownItem").map(node => node.props.textValue);
    assert.equal(labels.includes("Archive item"), permissions.canArchive === true);
    assert.equal(labels.includes("Delete item"), permissions.canDelete === true);
    if (labels.length) {
      const trigger = view.find(node => node.type === "Button")!;
      assert.match(String(trigger.props["aria-label"]), /Untitled page/);
      assert.equal(trigger.props.disableAnimation, true);
      assert.ok(view.some(node => (node.type as unknown) === AnchoredDropdown));
    }
  }
});

test("animated and instant actions wait for committed menu removal and focus restoration, then run once", t => {
  for (const instant of [false, true]) {
    const f = fixture(instant); t.after(f.h.dispose);
    const view = f.render({ items: [{ key: "move", label: "Move", icon: null, run: f.action }] });
    const dropdown = view.find(node => (node.type as unknown) === AnchoredDropdown)!;
    const menu = f.mountMenu(view);
    invoke(menu, "onAction", "move"); assert.equal(f.count(), 0);
    invoke(dropdown, "onOpenChange", false); assert.equal(f.count(), 0);
    assert.equal(dropdown.props.motionProps, undefined, "motion completion must not hand off while its FocusScope is alive");
    f.unmountMenu(menu); assert.equal(f.count(), 0);
    f.flushMicrotasks(); assert.equal(f.count(), 0); f.flushFrames();
    assert.equal(f.count(), 1);
    f.unmountMenu(menu); f.flushMicrotasks(); f.flushFrames();
    assert.equal(f.count(), 1);
  }
});

test("disabled, replaced and unmounted owners cannot execute a retained or queued menu action", t => {
  for (const change of ["disabled", "scope", "identity", "unmount"] as const) {
    const f = fixture(true); t.after(f.h.dispose);
    const view = f.render({ items: [{ key: "move", label: "Move", icon: null, run: f.action }] });
    const menu = f.mountMenu(view);
    const dropdown = view.find(node => (node.type as unknown) === AnchoredDropdown)!;
    invoke(menu, "onAction", "move"); invoke(dropdown, "onOpenChange", false);
    f.unmountMenu(menu);
    if (change === "disabled") f.render({ disabled: true });
    else if (change === "scope") f.render({ context: { ...f.props().context, scope: { workspaceId: "other", projectId: "other" } } });
    else if (change === "identity") f.render({ context: { ...f.props().context, ownerId: "second-identity" } });
    else f.h.dispose();
    f.flushMicrotasks(); f.flushFrames();
    assert.equal(f.count(), 0);
    if (change !== "unmount") {
      invoke(menu, "onAction", "move");
      f.unmountMenu(menu); f.flushMicrotasks(); f.flushFrames();
      assert.equal(f.count(), 0, "retained callbacks must not requeue work for a replaced or disabled owner");
    }
  }
});

test("the connected trigger receives focus before its action mounts a new focus scope", t => {
  for (const instant of [false, true]) {
    const f = fixture(instant); t.after(f.h.dispose); const events: string[] = [];
    const trigger = { isConnected: true, focus: (options: FocusOptions) => {
      assert.deepEqual({ ...options }, { preventScroll: true }); events.push("focus");
    } } as HTMLButtonElement;
    const view = f.render({ buttonRef: { current: trigger }, items: [{ key: "dialog", label: "Open dialog", icon: null, run: () => events.push("dialog") }] });
    const dropdown = view.find(node => (node.type as unknown) === AnchoredDropdown)!;
    const menu = f.mountMenu(view); invoke(menu, "onAction", "dialog");
    invoke(dropdown, "onOpenChange", false); assert.deepEqual([...events], []);
    f.unmountMenu(menu);
    f.frames.push(() => events.push("old-scope-restored"));
    f.flushMicrotasks(); f.flushFrames();
    assert.deepEqual(events, ["old-scope-restored", "focus", "dialog"]);
  }
});

test("a new dialog waits for the menu DOM unmount commit rather than motion completion", t => {
  const f = fixture(); t.after(f.h.dispose);
  const view = f.render({ items: [{ key: "dialog", label: "Open dialog", icon: null, run: f.action }] });
  const menu = view.find(node => node.type === "DropdownMenu")!;
  assert.equal(typeof menu.props.ref, "function", "the actual menu ref reports committed removal of its FocusScope");
  const connected = { isConnected: true }; invoke(menu, "ref", connected); invoke(menu, "onAction", "dialog");
  invoke(menu, "ref", null); f.flushMicrotasks(); f.flushFrames();
  assert.equal(f.count(), 0, "ref churn on a connected menu is not an unmount");
  invoke(menu, "ref", connected); invoke(menu, "ref", null); connected.isConnected = false;
  f.flushMicrotasks(); f.flushFrames(); assert.equal(f.count(), 1);
});


test("archived items expose restore in the menu only with the server publish capability", t => {
  const f = fixture(); t.after(f.h.dispose);
  const node = { ...f.props().node, archivedAt: "2026-11-13" };
  for (const canPublish of [false, true]) {
    const view = f.render({ node, permissions: { canPublish, canDelete: true } });
    const labels = view.filter(node => node.type === "DropdownItem").map(node => node.props.textValue);
    assert.equal(labels.includes("Restore"), canPublish);
    assert.equal(labels.includes("Archive item"), false);
    assert.equal(labels.includes("Delete item"), true);
  }
});
