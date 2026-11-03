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
const scope = { workspaceId: "w", projectId: "p", runId: "r", itemId: "i" };
const listeners = new Map<string, (event: unknown) => void>();
Object.assign(globalThis, { innerWidth: 900, innerHeight: 800,
  window: { addEventListener() {}, removeEventListener() {} },
  document: { addEventListener: (name: string, fn: (e: unknown) => void) => listeners.set(name, fn), removeEventListener: (name: string) => listeners.delete(name) } });
function render(http: TmsHttpClient, focus: string[], panels: { style: Record<string, string> }[] = []) {
  return create(<TmsHttpClientProvider client={http}><TmsLocaleContext.Provider value={{ locale: "en", languageTag: "en-US", setLocale() {}, t: key => key }}>
    <ExecutionHistoryFeature scope={scope} attemptNo={1} steps={[]} offline={false} />
  </TmsLocaleContext.Provider></TmsHttpClientProvider>, { createNodeMock: element => { const node = {
    focus: () => focus.push(element.props["aria-label"]), contains: () => false, style: {}, scrollHeight: 1000,
    matches: () => false, getBoundingClientRect: () => ({ width: 30, left: 300, top: 100, bottom: 130 }),
  }; if (element.props.role === "dialog") panels.push(node); return node; } });
}
test("history is an icon-only header action with no empty panel until opened; Escape restores focus", async () => {
  const focus: string[] = []; const http = { get: async () => ({ data: [], meta: { hasMore: false, nextCursor: null } }) } as unknown as TmsHttpClient;
  let view!: ReactTestRenderer; await act(async () => { view = render(http, focus); });
  const trigger = () => view.root.findByProps({ "aria-label": "Execution history" });
  assert.equal(trigger().findAllByType("span").length, 0, "the byline action only shows its History icon");
  assert.equal(view.root.findAllByProps({ role: "dialog" }).length, 0);
  assert.doesNotMatch(JSON.stringify(view.toJSON()), /No execution activity/);
  assert.equal(trigger().props["aria-haspopup"], "dialog");
  await act(async () => trigger().props.onClick());
  assert.equal(view.root.findByProps({ role: "dialog" }).props["aria-modal"], undefined);
  assert.match(JSON.stringify(view.toJSON()), /No execution activity yet/);
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
    if (requests.length === 5) { pendingSignal = signal; return new Promise(() => {}); }
    const start = Number(url.searchParams.get("cursor") ?? 0), end = Math.min(start + 30, 100);
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
  assert.deepEqual(requests.map(url => url.searchParams.get("limit")), ["30", "30", "30", "30"]);
  assert.deepEqual(requests.map(url => url.searchParams.get("cursor")), [null, "30", "60", "90"]);
  assert.equal(view.root.findAllByType("button").some(button => button.children.includes("Load more records")), false);
  await act(async () => toggle().props.onClick());
  await act(async () => toggle().props.onClick());
  assert.equal(pendingSignal?.aborted, false);
  await act(async () => listeners.get("pointerdown")?.({ target: {} }));
  assert.equal(pendingSignal?.aborted, true);
  assert.equal(view.root.findAllByProps({ role: "dialog" }).length, 0);
  await act(async () => view.unmount());
});
