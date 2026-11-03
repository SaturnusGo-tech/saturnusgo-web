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
function wrapper(http: TmsHttpClient, offline = false) {
  return <TmsHttpClientProvider client={http}><TmsLocaleContext.Provider value={{ locale: "en", languageTag: "en-US", setLocale() {}, t: key => key }}>
    <ExecutionHistoryFeature scope={scope} attemptNo={2} steps={[{ id: "step-a", order: 1 }, { id: "step-b", order: 2 }]} offline={offline} />
  </TmsLocaleContext.Provider></TmsHttpClientProvider>;
}
test("compact history is closed by default and keeps attempt/step filters bound to the request", async () => {
  const requests: URL[] = [];
  const http = { get: async (path: string) => { const url = new URL(`https://test${path}`); requests.push(url); return { data: [], meta: { hasMore: false, nextCursor: null } }; } } as unknown as TmsHttpClient;
  let view!: ReactTestRenderer; await act(async () => { view = create(wrapper(http)); });
  assert.equal(requests.length, 0); assert.equal(view.root.findAllByType("details").length, 0);
  const toggle = () => view.root.findByProps({ "aria-label": "Execution history" });
  assert.equal(toggle().props["aria-expanded"], false);
  await act(async () => toggle().props.onClick());
  assert.equal(requests[0].searchParams.get("attemptNo"), "2");
  assert.equal(toggle().props["aria-expanded"], true);
  await act(async () => view.root.findAllByType(AnimatedSelect)[0].props.onChange("all"));
  assert.equal(requests[requests.length - 1]!.searchParams.has("attemptNo"), false);
  await act(async () => view.root.findAllByType(AnimatedSelect)[1].props.onChange("step-b"));
  assert.equal(requests[requests.length - 1]!.searchParams.get("stepId"), "step-b");
  assert.match(JSON.stringify(view.toJSON()), /No matching records/);
  await act(async () => toggle().props.onClick());
  assert.equal(toggle().props["aria-expanded"], false);
  assert.equal(view.root.findAllByProps({ role: "dialog" }).length, 0);
  await act(async () => view.unmount());
});
test("offline history opens a concise connection hint and never fetches", async () => {
  let reads = 0; const http = { get: async () => { reads++; throw new Error("offline"); } } as unknown as TmsHttpClient;
  let view!: ReactTestRenderer; await act(async () => { view = create(wrapper(http, true)); });
  await act(async () => view.root.findByProps({ "aria-label": "Execution history" }).props.onClick());
  assert.equal(reads, 0); assert.match(JSON.stringify(view.toJSON()), /Connect to view history/);
  await act(async () => view.unmount());
});
