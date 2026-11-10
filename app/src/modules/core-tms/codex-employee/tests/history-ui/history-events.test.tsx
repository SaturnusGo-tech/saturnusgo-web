import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import type { useExecutionHistory } from "../../execution-history/application/useExecutionHistory";
import type { TmsHttpClient } from "../../../../../core/tms/transport/http";
(globalThis as typeof globalThis & { React: typeof React }).React = React;
require.extensions[".css"] = module => { module.exports = {}; };
const { ExecutionHistory } = require("../../execution-history/presentation/ExecutionHistory") as typeof import("../../execution-history/presentation/ExecutionHistory");
const { ErrorToast } = require("../../../presentation/common/error/ErrorToast") as typeof import("../../../presentation/common/error/ErrorToast");
test("history retry, load-more and actual event metadata remain available in the compact view", async () => {
  let retries = 0, pages = 0;
  const state: ReturnType<typeof useExecutionHistory> = { owner: {} as TmsHttpClient, key: "scope", items: [], nextCursor: null,
    loading: false, pending: false, error: true, refresh() { retries++; }, more: async () => { pages++; } };
  const render = (value = state) => <ExecutionHistory state={value} workspaceId="w" locale="en" steps={[{ id: "step-a", order: 3 }]} />;
  let view!: ReactTestRenderer; await act(async () => { view = create(render()); });
  const toast = view.root.findByType(ErrorToast);
  assert.equal(toast.props.message, "Could not load history.");
  await act(async () => toast.props.onRetry()); assert.equal(retries, 1);
  const populated: typeof state = { ...state, error: false, nextCursor: "next", items: [{ id: "event-a", workspaceId: "w", projectId: "p", runId: "r", itemId: "i",
    attemptNo: 2, kind: "step_result_recorded", status: "failed", actor: "Ada", actorIdentityId: null, stepId: "step-a", createdAt: "2026-11-03T00:00:00Z",
    initiatedBy: { identityId: "initiator", name: "Mercury" } }] };
  await act(async () => view.update(render(populated)));
  const content = JSON.stringify(view.toJSON());
  for (const text of ["Ada", "Mercury", "Attempt", "Step", "Failed"]) assert.match(content, new RegExp(text));
  assert.equal(view.root.findAllByType("details").length, 0); assert.equal(view.root.findByType("time").props.dateTime, populated.items[0].createdAt);
  await act(async () => await view.root.findByType("button").props.onClick()); assert.equal(pages, 1);
  await act(async () => view.update(render({ ...populated, pending: true })));
  assert.equal(view.root.findByType("button").props.disabled, true); assert.equal(view.root.findByType("button").props["aria-busy"], true);
  await act(async () => view.unmount());
});
