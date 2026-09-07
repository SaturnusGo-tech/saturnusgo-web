import assert from "node:assert/strict";
import test from "node:test";
import { republishReport } from "../republish-report";
import { RepublishOperationKeys } from "../republish-operation-keys";
import { TmsApiError } from "../../../../../../core/tms/transport/http";

const scope = { workspaceId: "w", projectId: "p" };
const activity = { deliveries: [], links: [], nextCursor: null };
const input = { scope, connectionId: "c", runId: "r", etag: '"v2"' };

test("a lost acceptance response and a failed history refresh reuse the same request; a later explicit update gets a new key", async () => {
  let sequence = 0;
  const keys = new RepublishOperationKeys(() => `request-${++sequence}`);
  const received: string[] = [];
  const versions: string[] = [];
  let delivery = 0;
  const ports = {
    keys,
    accept: async (actualScope: typeof scope, runId: string, etag: string, key: string) => {
      assert.deepEqual(actualScope, scope); assert.equal(runId, "r"); versions.push(etag);
      received.push(key); delivery += 1;
      if (delivery === 1) throw new Error("Acceptance response lost");
      return { data: { accepted: true as const, deliveryId: "delivery-one" } };
    },
    refresh: async () => { if (delivery === 2) throw new Error("History temporarily unavailable"); return activity; },
  };
  const call = (etag = '"v2"') => republishReport({ ...input, etag, signal: new AbortController().signal }, ports);
  await assert.rejects(call(), /Acceptance response lost/);
  await assert.rejects(call('"v3"'), /History temporarily unavailable/);
  assert.deepEqual(await call('"v3"'), activity);
  await call('"v3"');
  assert.deepEqual(received, ["request-1", "request-1", "request-1", "request-2"]);
  assert.deepEqual(versions, ['"v2"', '"v2"', '"v2"', '"v3"']);
});

test("navigation cancellation prevents a late accepted response from refreshing another screen and retains its retry identity", async () => {
  let sequence = 0;
  const keys = new RepublishOperationKeys(() => `request-${++sequence}`);
  const controller = new AbortController();
  let refreshed = false;
  await assert.rejects(republishReport({ ...input, signal: controller.signal }, {
    keys,
    accept: async () => { controller.abort(); return { data: { accepted: true, deliveryId: "d" } }; },
    refresh: async () => { refreshed = true; return activity; },
  }));
  assert.equal(refreshed, false);
  assert.deepEqual(keys.begin(JSON.stringify(["w", "p", "c", "r"]), '"v3"'), { key: "request-1", etag: '"v2"' });
});

test("a cancelled history response cannot clear the accepted request identity", async () => {
  let sequence = 0;
  const keys = new RepublishOperationKeys(() => `request-${++sequence}`);
  const controller = new AbortController();
  await assert.rejects(republishReport({ ...input, signal: controller.signal }, {
    keys, accept: async () => ({ data: { accepted: true, deliveryId: "d" } }),
    refresh: async () => { controller.abort(); return activity; },
  }));
  assert.deepEqual(keys.begin(JSON.stringify(["w", "p", "c", "r"]), '"v3"'), { key: "request-1", etag: '"v2"' });
});

test("a definitive version rejection frees the unaccepted operation so configuration reload can recover", async () => {
  let sequence = 0;
  const keys = new RepublishOperationKeys(() => `request-${++sequence}`);
  const received: [string, string][] = [];
  const ports = { keys,
    accept: async (_scope: typeof scope, _run: string, etag: string, key: string) => {
      received.push([key, etag]);
      if (etag === '"v2"') throw new TmsApiError("Version rejected", 412, "request-safe", "PRECONDITION_FAILED");
      return { data: { accepted: true as const, deliveryId: "d" } };
    }, refresh: async () => activity };
  await assert.rejects(republishReport({ ...input, signal: new AbortController().signal }, ports));
  await republishReport({ ...input, etag: '"v3"', signal: new AbortController().signal }, ports);
  assert.deepEqual(received, [["request-1", '"v2"'], ["request-2", '"v3"']]);
});

test("request identity is isolated by workspace, project, connection, and run", async () => {
  let sequence = 0;
  const keys = new RepublishOperationKeys(() => `request-${++sequence}`);
  const received: string[] = [];
  const ports = { keys,
    accept: async (_scope: typeof scope, _run: string, _etag: string, key: string) => {
      received.push(key); throw new Error("Retain request");
    }, refresh: async () => activity };
  for (const selected of [input, { ...input, scope: { ...scope, workspaceId: "w2" } },
    { ...input, scope: { ...scope, projectId: "p2" } }, { ...input, connectionId: "c2" }, { ...input, runId: "r2" }, input]) {
    await assert.rejects(republishReport({ ...selected, signal: new AbortController().signal }, ports));
  }
  assert.deepEqual(received, ["request-1", "request-2", "request-3", "request-4", "request-5", "request-1"]);
});
