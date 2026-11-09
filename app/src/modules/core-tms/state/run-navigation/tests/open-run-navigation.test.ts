import assert from "node:assert/strict";
import test from "node:test";
import React, { useState } from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import type { Bootstrap } from "../../../../../core/tms/contracts/legacy-contract";
import { createTmsHttpClient } from "../../../../../core/tms/transport/http";
import { useSelectedRunResource } from "../../run-resource/useSelectedRunResource";
import { openRunNavigation } from "../open-run-navigation";
import { readWorkspaceDeepLink } from "../../navigation/workspace-deep-link";
import { WorkspaceNavigationRestoration } from "../../navigation/restoration/workspace-navigation-restoration";

test("opening a defect occurrence writes the exact run URL before clearing the report selection", () => {
  let href = "https://tms.example/work/?workspaceId=w&projectId=p&view=reports&defectId=d";
  const events: string[] = [];
  const restoration = new WorkspaceNavigationRestoration();
  restoration.begin({ workspaceId: "w", projectId: "p", view: "reports", runId: "old", caseId: "c" });
  openRunNavigation({ workspaceId: "w", projectId: "p", runId: "target", runItemId: "occurrence" }, {
    href,
    replace: (next) => { href = next; events.push("url"); },
    clearDefect: () => {
      assert.deepEqual(readWorkspaceDeepLink(href), { view: "runs", runId: "target", runItemId: "occurrence" });
      assert.equal(new URL(href).searchParams.has("defectId"), false);
      events.push("clear-defect");
    },
    selectRun: (id) => { assert.equal(id, "target"); events.push("run"); },
    selectItem: (id) => { assert.equal(id, "occurrence"); events.push("item"); },
    showRuns: () => { restoration.cancel(); events.push("view"); },
  });
  assert.deepEqual(events, ["url", "clear-defect", "run", "item", "view"]);
  assert.equal(restoration.canWrite({ workspaceId: "w", projectId: "p", view: "runs", runId: "target", caseId: "c" }), true);
  assert.deepEqual(Object.fromEntries(new URL(href).searchParams), {
    workspaceId: "w", projectId: "p", view: "runs", runId: "target", runItemId: "occurrence",
  });
  // Reload resolves the newly selected occurrence, including when an old report restoration was pending.
  assert.deepEqual(readWorkspaceDeepLink(href), { view: "runs", runId: "target", runItemId: "occurrence" });
});

test("opening a different run without an occurrence clears stale provider and item selectors", () => {
  let href = "https://tms.example/work/?workspaceId=old&projectId=old&view=hooks&integration=slack&runItemId=old";
  openRunNavigation({ workspaceId: "w", projectId: "p", runId: "r", runItemId: null }, {
    href, replace: (next) => { href = next; }, clearDefect: () => {}, selectRun: () => {},
    selectItem: (id) => assert.equal(id, null), showRuns: () => {},
  });
  assert.deepEqual(Object.fromEntries(new URL(href).searchParams), { workspaceId: "w", projectId: "p", view: "runs", runId: "r" });
});

test("run item restoration requires a valid run and never overrides an explicit other view", () => {
  for (const query of ["view=runs&runItemId=i", "view=runs&runId=../../bad&runItemId=i", "view=runs&runId=r&runItemId=../../bad"]) {
    assert.equal(readWorkspaceDeepLink(`https://tms.example/work/?${query}`).runItemId, undefined);
  }
  assert.deepEqual(readWorkspaceDeepLink("https://tms.example/work/?view=config&runId=r&runItemId=i"), { view: "config", runId: null });
});

test("late run item failures cannot replace the newer case and retry reloads only the failed item", async () => {
  const requests: { id: string; signal: AbortSignal | null | undefined; reply: (response: Response) => void }[] = [];
  let lists = 0;
  const http = createTmsHttpClient({ apiBase: "https://tms.example/api/v1", credentials: "include", production: false,
    fetch: async (input, init) => {
      const path = new URL(String(input)).pathname;
      if (path.endsWith("/runs/run-p")) return Response.json({ data: { id: "run-p", projectId: "p", environment: {}, progress: {} } });
      if (path.endsWith("/items")) {
        lists++;
        return Response.json({ data: [{ id: "a" }, { id: "b" }], meta: { hasMore: false, nextCursor: null, limit: 100 } });
      }
      return new Promise(resolve => requests.push({ id: path.slice(path.lastIndexOf("/") + 1), signal: init?.signal, reply: resolve }));
    },
  });
  let resource!: ReturnType<typeof useSelectedRunResource>;
  let select!: (id: string) => void;
  function Probe() {
    const [selectedRunItemId, setSelectedRunItemId] = useState<string | null>("a");
    const [, setData] = useState({ runs: [] } as unknown as Bootstrap);
    select = setSelectedRunItemId;
    resource = useSelectedRunResource({ http, connection: "connected", projectId: "p", selectedRunId: "run-p",
      selectedRunItemId, setSelectedRunItemId, setData });
    return null;
  }
  let renderer!: ReactTestRenderer;
  await act(async () => { renderer = create(React.createElement(Probe) as Parameters<typeof create>[0]); });
  const unavailable = () => Response.json({}, { status: 503 });
  try {
    assert.deepEqual(requests.map(request => request.id), ["a"]);
    await act(async () => { select("b"); });
    assert.equal(requests[0].signal?.aborted, true);
    assert.deepEqual(requests.map(request => request.id), ["a", "b"]);
    await act(async () => { requests[0].reply(unavailable()); });
    assert.equal(resource.runItemResourceError, false);
    await act(async () => { requests[1].reply(unavailable()); });
    assert.equal(resource.runItemResourceError, true);
    assert.equal(resource.runResourceError, false);
    await act(async () => { resource.retryRunItem(); });
    assert.deepEqual(requests.map(request => request.id), ["a", "b", "b"]);
    assert.equal(resource.runItemResourceError, false);
    assert.equal(lists, 1);
    await act(async () => { requests[2].reply(Response.json({ data: {
      id: "b", snapshot: { tags: [], steps: [], checklist: [], attachmentIds: [] },
      activeAttempt: { attachmentIds: [], stepResults: [] },
    } })); });
    assert.equal(resource.selectedRunItemDetail?.id, "b");
  } finally { await act(async () => renderer.unmount()); }
});
