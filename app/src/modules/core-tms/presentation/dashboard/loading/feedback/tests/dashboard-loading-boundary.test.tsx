import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { test, type TestContext } from "node:test";
import React, { useContext, useEffect } from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";

const require = createRequire(import.meta.url);
const previousCss = require.extensions[".css"];
require.extensions[".css"] = module => { module.exports = {}; };
Object.assign(globalThis, { React });
const { DashboardLoadingBoundary } = require("../DashboardLoadingBoundary");
const { WorkspaceStartup } = require("../../../../common/loading/WorkspaceStartup");
const { TmsLocaleContext } = require("../../../../../localization/context/TmsLocaleProvider");
const { WorkspaceHeaderActionsHost, WorkspaceHeaderActions } = require("../../../../workspace/header-actions/WorkspaceHeaderActions");
if (previousCss) require.extensions[".css"] = previousCss; else delete require.extensions[".css"];

function setup(t: TestContext, { pending = true, startup = false, reduced = false, headerHost }: {
  pending?: boolean; startup?: boolean; reduced?: boolean; headerHost?: HTMLElement;
} = {}) {
  t.mock.timers.enable({ apis: ["setTimeout", "Date"] });
  t.mock.method(performance, "now", () => Date.now());
  const originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  const listeners = new Set<() => void>();
  const preference = { matches: reduced, addEventListener: (_: string, listener: () => void) => listeners.add(listener),
    removeEventListener: (_: string, listener: () => void) => listeners.delete(listener) };
  Object.defineProperty(globalThis, "window", { configurable: true, value: {
    matchMedia: () => preference, setTimeout: globalThis.setTimeout, clearTimeout: globalThis.clearTimeout,
  } });
  const nodes: { inert: boolean }[] = [];
  const receivedHosts: (HTMLElement | null | undefined)[] = [];
  let mounts = 0, unmounts = 0;
  function HeaderProbe() {
    const host = useContext(WorkspaceHeaderActionsHost) as HTMLElement | null | undefined;
    receivedHosts.push(host);
    return host === null ? <WorkspaceHeaderActions><button>Filter dashboard</button></WorkspaceHeaderActions> : null;
  }
  function Content() {
    useEffect(() => { mounts += 1; return () => { unmounts += 1; }; }, []);
    return <><button>Open report</button>{headerHost && <HeaderProbe />}</>;
  }
  function App({ pending }: { pending: boolean }) {
    const boundary = <WorkspaceHeaderActionsHost.Provider value={headerHost}>
      <DashboardLoadingBoundary pending={pending} label="Loading dashboard"><Content /></DashboardLoadingBoundary>
    </WorkspaceHeaderActionsHost.Provider>;
    return startup ? <TmsLocaleContext.Provider value={{ t: () => "Loading workspace" }}>
      <WorkspaceStartup>{boundary}</WorkspaceStartup></TmsLocaleContext.Provider> : boundary;
  }
  let view!: ReactTestRenderer;
  act(() => { view = create(<App pending={pending} />, { createNodeMock: element => {
    if (element.props["data-dashboard-loading-content"] !== undefined) {
      const node = { inert: false }; nodes.push(node); return node;
    }
    return null;
  } }); });
  let mounted = true;
  const unmount = () => { if (mounted) { act(() => view.unmount()); mounted = false; } };
  t.after(() => {
    unmount();
    if (originalWindow) Object.defineProperty(globalThis, "window", originalWindow);
    else Reflect.deleteProperty(globalThis, "window");
  });
  return {
    view, nodes, listeners, preference, unmount, receivedHosts,
    content: () => view.root.findByProps({ "data-dashboard-loading-content": true }),
    feedback: () => view.root.findAllByProps({ "data-testid": "dashboard-loading" }),
    startup: () => view.root.findAllByProps({ "data-testid": "workspace-startup" }),
    counts: () => ({ mounts, unmounts }),
    update: (next: boolean) => act(() => view.update(<App pending={next} />)),
    advance: (ms: number) => act(() => t.mock.timers.tick(ms)),
  };
}

test("fast readiness keeps children mounted and reveals them without ever showing a logo", t => {
  const screen = setup(t);
  assert.equal(screen.content().props["aria-hidden"], true);
  assert.equal(screen.content().props.hidden, undefined, "charts must stay measurable while covered");
  assert.equal(screen.nodes[screen.nodes.length - 1]?.inert, true);
  assert.deepEqual(screen.counts(), { mounts: 1, unmounts: 0 });
  screen.advance(299);
  assert.equal(screen.feedback().length, 0);
  screen.update(false);
  assert.equal(screen.content().props["aria-hidden"], undefined);
  assert.equal(screen.nodes[screen.nodes.length - 1]?.inert, false);
  screen.advance(1000);
  assert.equal(screen.feedback().length, 0);
  assert.deepEqual(screen.counts(), { mounts: 1, unmounts: 0 });
});

test("slow readiness holds the logo briefly, fades it out, then reveals usable content", t => {
  const screen = setup(t);
  screen.advance(300);
  assert.equal(screen.feedback()[0].props["data-phase"], "visible");
  assert.equal(screen.view.root.findAllByProps({ "data-falcon-brand-mark": "" }).length, 1);
  screen.update(false);
  screen.advance(249);
  assert.equal(screen.feedback()[0].props["data-phase"], "visible");
  screen.advance(1);
  assert.equal(screen.feedback()[0].props["data-phase"], "leaving");
  screen.advance(239);
  assert.equal(screen.content().props["aria-hidden"], true);
  screen.advance(1);
  assert.equal(screen.feedback().length, 0);
  assert.equal(screen.content().props["aria-hidden"], undefined);
  assert.equal(screen.nodes[screen.nodes.length - 1]?.inert, false);
});

test("renewed readiness cancels an exit and never exposes stale interactive content", t => {
  const screen = setup(t);
  screen.advance(300); screen.update(false); screen.advance(250); screen.advance(100);
  screen.update(true);
  assert.equal(screen.feedback()[0].props["data-phase"], "visible");
  screen.advance(140);
  assert.equal(screen.feedback().length, 1);
  assert.equal(screen.content().props["aria-hidden"], true);
  screen.advance(160); screen.update(false); screen.advance(250); screen.advance(240);
  assert.equal(screen.feedback().length, 0);
  assert.equal(screen.content().props["aria-hidden"], undefined);
  assert.deepEqual(screen.counts(), { mounts: 1, unmounts: 0 });
});

test("workspace startup owns the single intro and hands off directly to ready dashboard content", t => {
  const screen = setup(t, { startup: true });
  screen.advance(1600);
  assert.equal(screen.startup().length, 1, "dashboard readiness must hold the initial workspace intro");
  assert.equal(screen.feedback().length, 0);
  assert.equal(screen.view.root.findAllByProps({ "data-falcon-brand-mark": "" }).length, 1);
  screen.update(false); screen.advance(0); screen.advance(240);
  assert.equal(screen.startup().length, 0);
  assert.equal(screen.feedback().length, 0);
  assert.equal(screen.content().props["aria-hidden"], undefined);
});

test("reduced motion skips the exit delay but retains the loading minimum", t => {
  const screen = setup(t, { reduced: true });
  screen.advance(300); screen.update(false); screen.advance(249);
  assert.equal(screen.feedback().length, 1);
  screen.advance(1);
  assert.equal(screen.feedback().length, 0);
  assert.equal(screen.content().props["aria-hidden"], undefined);
});

test("unmount clears motion listeners and all pending loading callbacks", t => {
  const screen = setup(t);
  screen.advance(300); screen.update(false); screen.advance(250);
  screen.unmount(); screen.advance(2000);
  assert.equal(screen.listeners.size, 0);
  assert.deepEqual(screen.counts(), { mounts: 1, unmounts: 1 });
});

test("external header actions stay suppressed until the dashboard loading fade completes", t => {
  const headerHost = {} as HTMLElement;
  const screen = setup(t, { headerHost });
  const host = () => screen.receivedHosts[screen.receivedHosts.length - 1];
  assert.equal(host(), null, "hidden dashboard controls must not escape into the workspace header");
  assert.equal(screen.view.root.findAllByType("button").length, 1, "the real null-host action wrapper renders no toolbar");
  screen.advance(300); screen.update(false); screen.advance(250); screen.advance(239);
  assert.equal(host(), null);
  screen.advance(1);
  assert.equal(host(), headerHost, "ready controls receive the original portal host");
  assert.deepEqual(screen.counts(), { mounts: 1, unmounts: 0 });
});
