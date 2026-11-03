import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { TmsHttpClientProvider } from "../../../auth/http/TmsHttpClientContext";
import { TmsLocaleContext } from "../../../localization/context/TmsLocaleProvider";
import type { TmsHttpClient } from "../../../../../core/tms/transport/http";
(globalThis as typeof globalThis & { React: typeof React }).React = React;
require.extensions[".css"] = module => { module.exports = {}; };
const { ExecutionHistoryFeature } = require("../../execution-history/composition/ExecutionHistoryFeature") as typeof import("../../execution-history/composition/ExecutionHistoryFeature");
const { AnimatedSelect } = require("../../../presentation/common/select/AnimatedSelect") as typeof import("../../../presentation/common/select/AnimatedSelect");
const scope = { workspaceId: "w", projectId: "p", runId: "r", itemId: "i" };
const event = { ...scope, id: "e", attemptNo: 1, kind: "result_recorded", status: "passed", actor: "Author", actorIdentityId: null, createdAt: "2026-11-01T00:00:00Z" };
const listeners = new Map<string, (event: unknown) => void>();
Object.assign(globalThis, { innerWidth: 900, innerHeight: 800,
  window: { addEventListener() {}, removeEventListener() {} },
  document: { addEventListener: (name: string, fn: (e: unknown) => void) => listeners.set(name, fn), removeEventListener: (name: string) => listeners.delete(name) } });
type Options = Partial<Parameters<typeof ExecutionHistoryFeature>[0]>;
function tree(http: TmsHttpClient, options: Options = {}) {
  return <TmsHttpClientProvider client={http}><TmsLocaleContext.Provider value={{ locale: "en", languageTag: "en-US", setLocale() {}, t: key => key }}>
    <ExecutionHistoryFeature scope={scope} attemptNo={1} steps={[]} offline={false} {...options} />
  </TmsLocaleContext.Provider></TmsHttpClientProvider>;
}
function render(http: TmsHttpClient, focus: string[], panels: { style: Record<string, string> }[] = [], options: Options = {}) {
  return create(tree(http, options), { createNodeMock: element => { const node = {
    focus: () => focus.push(element.props["aria-label"]), contains: () => false, style: {}, scrollHeight: 1000,
    matches: () => false, getBoundingClientRect: () => ({ width: 30, left: 300, top: 100, bottom: 130 }),
  }; if (element.props.role === "dialog") panels.push(node); return node; } });
}
test("history is an icon-only header action with no empty panel until opened; Escape restores focus", async () => {
  const focus: string[] = []; const http = { get: async () => ({ data: [event], meta: { hasMore: false, nextCursor: null } }) } as unknown as TmsHttpClient;
  let view!: ReactTestRenderer; await act(async () => { view = render(http, focus); });
  const trigger = () => view.root.findByProps({ "aria-label": "Execution history" });
  assert.equal(trigger().findAllByType("span").length, 0, "the byline action only shows its History icon");
  assert.equal(view.root.findAllByProps({ role: "dialog" }).length, 0);
  assert.doesNotMatch(JSON.stringify(view.toJSON()), /No execution activity/);
  assert.equal(trigger().props["aria-haspopup"], "dialog");
  await act(async () => trigger().props.onClick());
  assert.equal(view.root.findByProps({ role: "dialog" }).props["aria-modal"], undefined);
  assert.equal(view.root.findAllByType("li").length, 1);
  assert.deepEqual(focus, ["Close execution history"]);
  const root = view.root.findAll(node => typeof node.props.onKeyDown === "function")[0];
  await act(async () => root.props.onKeyDown({ key: "Escape", preventDefault() {}, stopPropagation() {} }));
  assert.equal(view.root.findAllByProps({ role: "dialog" }).length, 0);
  assert.deepEqual(focus, ["Close execution history", "Execution history"]);
  await act(async () => view.unmount());
});
test("100 history records remain reachable by 30-record cursor pages and close cancels an active request", async () => {
  const requests: URL[] = []; let pendingSignal: AbortSignal | undefined;
  const http = { get: async (path: string, signal: AbortSignal) => {
    const url = new URL(`https://test${path}`); requests.push(url);
    if (requests.length === 6) { pendingSignal = signal; return new Promise(() => {}); }
    const start = Number(url.searchParams.get("cursor") ?? 0), end = Math.min(start + Number(url.searchParams.get("limit")), 100);
    return { data: Array.from({ length: end - start }, (_, n) => ({ ...scope, id: `event-${start + n}`, attemptNo: 1,
      kind: "result_recorded", status: "passed", actor: `Author ${start + n}`, actorIdentityId: null, createdAt: "2026-11-01T00:00:00Z" })),
    meta: { hasMore: end < 100, nextCursor: end < 100 ? String(end) : null } };
  } } as unknown as TmsHttpClient;
  const panels: { style: Record<string, string> }[] = [];
  let view!: ReactTestRenderer; await act(async () => { view = render(http, [], panels); });
  const toggle = () => view.root.findByProps({ "aria-label": "Execution history" });
  await act(async () => toggle().props.onClick());
  for (const count of [30, 60, 90]) {
    assert.equal(view.root.findAllByType("li").length, count);
    const more = view.root.findAllByType("button").find(button => button.children.includes("Load more records"))!;
    await act(async () => more.props.onClick());
  }
  assert.equal(view.root.findAllByType("li").length, 100);
  assert.equal(panels[0].style.maxHeight, "320px", "all records stay inside the bounded anchored viewport");
  assert.deepEqual(requests.map(url => url.searchParams.get("limit")), ["1", "30", "30", "30", "30"]);
  assert.deepEqual(requests.filter(url => url.searchParams.get("limit") === "30").map(url => url.searchParams.get("cursor")), [null, "30", "60", "90"]);
  assert.equal(view.root.findAllByType("button").some(button => button.children.includes("Load more records")), false);
  await act(async () => toggle().props.onClick());
  await act(async () => toggle().props.onClick());
  assert.equal(pendingSignal?.aborted, false);
  await act(async () => listeners.get("pointerdown")?.({ target: {} }));
  assert.equal(pendingSignal?.aborted, true);
  assert.equal(view.root.findAllByProps({ role: "dialog" }).length, 0);
  await act(async () => view.unmount());
});

test("all-attempt availability hides known-empty history, refreshes by version and never hides a filtered empty attempt", async t => {
  const pending: { url: URL; resolve(value: unknown): void }[] = [];
  const http = { get: (path: string) => {
    const url = new URL(`https://test${path}`);
    if (url.searchParams.get("limit") === "1") return new Promise(resolve => pending.push({ url, resolve }));
    return Promise.resolve({ data: url.searchParams.has("attemptNo") || url.searchParams.has("stepId") ? [] : [event], meta: { hasMore: false, nextCursor: null } });
  } } as unknown as TmsHttpClient;
  let view!: ReactTestRenderer; await act(async () => { view = render(http, []); }); t.after(() => act(() => view.unmount()));
  const trigger = () => view.root.findAllByProps({ "aria-label": "Execution history" });
  assert.equal(pending.length, 1, "preload is a bounded availability query while the popup is closed");
  assert.equal(pending[0].url.searchParams.has("attemptNo"), false); assert.equal(pending[0].url.searchParams.has("stepId"), false);
  assert.equal(trigger().length, 1, "unknown availability remains reachable");
  await act(async () => pending[0].resolve({ data: [], meta: { hasMore: false, nextCursor: null } }));
  assert.equal(trigger().length, 0); assert.doesNotMatch(JSON.stringify(view.toJSON()), /No execution activity/);
  await act(async () => view.update(tree(http, { version: 2, attemptNo: 2, steps: [{ id: "s", order: 1 }] })));
  assert.equal(pending.length, 2); assert.equal(trigger().length, 1);
  await act(async () => pending[1].resolve({ data: [event], meta: { hasMore: false, nextCursor: null } }));
  await act(async () => trigger()[0].props.onClick());
  assert.equal(trigger().length, 1); assert.match(JSON.stringify(view.toJSON()), /No matching records/);
  await act(async () => view.root.findAllByType(AnimatedSelect)[0].props.onChange("all"));
  assert.equal(view.root.findAllByType("li").length, 1);
  await act(async () => view.root.findAllByType(AnimatedSelect)[1].props.onChange("s"));
  assert.equal(trigger().length, 1); assert.match(JSON.stringify(view.toJSON()), /No matching records/);
});

test("availability errors retain the history retry path and successful empty retry removes the action", async t => {
  let failed = true, reads = 0;
  const http = { get: async () => { reads++; if (failed) throw new Error("offline"); return { data: [], meta: { hasMore: false, nextCursor: null } }; } } as unknown as TmsHttpClient;
  let view!: ReactTestRenderer; await act(async () => { view = render(http, []); }); t.after(() => act(() => view.unmount()));
  assert.equal(reads, 1);
  await act(async () => view.root.findByProps({ "aria-label": "Execution history" }).props.onClick());
  assert.match(JSON.stringify(view.toJSON()), /Could not load history/);
  failed = false;
  await act(async () => view.root.findAllByType("button").find(button => button.children.includes("Retry"))!.props.onClick());
  assert.equal(view.root.findAllByProps({ "aria-label": "Execution history" }).length, 0);
});
