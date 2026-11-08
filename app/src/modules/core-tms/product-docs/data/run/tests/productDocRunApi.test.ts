import assert from "node:assert/strict";
import test from "node:test";
import type { TmsHttpClient } from "../../../../../../core/tms/transport/http";
import { captureProductDocRun, listProductDocRuns, readProductDocRun } from "../productDocRunApi";

const scope = { workspaceId: "space", projectId: "project-a", docId: "doc-1" };
const path = "/workspaces/space/projects/project-a/product-docs/doc-1/run-embeds";
const id = "runembed_307b2254-f756-4836-9957-8f43b356137a";
const signal = new AbortController().signal;

test("reads only the selected article revision with one revision parameter", async () => {
  const calls: string[] = [];
  const http = {
    async getResource(url: string, incoming: AbortSignal) {
      calls.push(url);
      assert.equal(incoming, signal);
      return { data: { id, capturedAt: "2026-11-08T11:00:00Z", runCreatedAt: "2026-11-01T11:00:00Z" } };
    },
  } as TmsHttpClient;
  await readProductDocRun(http, { ...scope, archived: true, draft: true }, id, signal);
  await readProductDocRun(http, { ...scope, archived: true, draft: true, version: 2 }, id, signal);
  await readProductDocRun(http, { ...scope, draft: true }, id, signal);
  await readProductDocRun(http, scope, id, signal);
  assert.deepEqual(calls, [
    `${path}/${id}?archived=true`, `${path}/${id}?version=2`, `${path}/${id}?draft=true`, `${path}/${id}`,
  ]);
});

test("rejects a candidate page whose cursor does not advance", async () => {
  const http = {
    async get(url: string, incoming: AbortSignal) {
      assert.equal(url, `${path}/candidates?limit=25&cursor=older`);
      assert.equal(incoming, signal);
      return { data: [], meta: { nextCursor: "older", hasMore: true } };
    },
  } as TmsHttpClient;
  await assert.rejects(listProductDocRuns(http, scope, {}, "older", signal), /pagination did not advance/);
});

test("capture sends the source project and verifies the response", async () => {
  const input = { runId: "run-1", runProjectId: "project-b", commandId: "307b2254-f756-4836-9957-8f43b356137a" };
  const http = {
    async mutateResource(url: string, method: string, body: unknown, options: { signal: AbortSignal }) {
      assert.equal(url, path);
      assert.equal(method, "POST");
      assert.deepEqual(body, input);
      assert.equal(options.signal, signal);
      return { data: { id, runId: input.runId, runProjectId: input.runProjectId } };
    },
  } as TmsHttpClient;
  assert.equal(await captureProductDocRun(http, scope, input, signal), id);
});
