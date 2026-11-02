import assert from "node:assert/strict";
import test from "node:test";
import { act } from "react-test-renderer";
import { TmsApiError } from "../../../../../../core/tms/transport/http";
import type { Connection, Provider } from "../../../model/connector-types";
import { connection, deferred, toggleHarness } from "./toggle-harness";

test("provider toggles load the exact CAS resource, retain settings and empty secrets, then update server truth", async t => {
  const h = await toggleHarness(); t.after(h.dispose); const original = connection();
  let result: boolean | undefined; await act(async () => { result = await h.current.toggle("linear", false); });
  assert.equal(result, true); assert.equal(h.reads.length, 1); assert.equal(h.writes.length, 1);
  assert.equal(h.reads[0].path, "/integrations/connectors/linear/configuration?workspaceId=w&projectId=p");
  assert.equal(h.writes[0].path, h.reads[0].path); assert.equal(h.writes[0].options.ifMatch, '"v3"');
  assert.deepEqual(h.writes[0].body, { enabled: false, settings: original.settings, secrets: {} });
  assert.equal(h.updates.length, 1); assert.equal(h.updates[0].enabled, false);
  assert.equal(h.catalog.connections[0].enabled, false); assert.equal(h.current.pending, null); assert.equal(h.current.error, null);
});
test("missing configuration never creates a connection and malformed scope or missing ETag never writes", async t => {
  const missing = await toggleHarness({ load: async () => ({ data: null, etag: null }) }); t.after(missing.dispose);
  await act(async () => assert.equal(await missing.current.toggle("linear", true), false));
  assert.equal(missing.writes.length, 0); assert.equal(missing.current.error, null);
  await missing.dispose();
  const mismatch = await toggleHarness({ load: async () => ({ data: connection("other"), etag: '"x"' }) });
  await act(async () => assert.equal(await mismatch.current.toggle("linear", false), false));
  assert.equal(mismatch.writes.length, 0); assert.equal(mismatch.current.error, "REMOTE_SCOPE_MISMATCH"); await mismatch.dispose();
  const noEtag = await toggleHarness({ load: async () => ({ data: connection(), etag: null }) });
  await act(async () => assert.equal(await noEtag.current.toggle("linear", false), false));
  assert.equal(noEtag.writes.length, 0); assert.equal(noEtag.current.error, "PRECONDITION_REQUIRED"); await noEtag.dispose();
});
test("pending mutations serialize and the checked catalog does not change before authoritative save", async t => {
  const read = deferred<{ data: Connection; etag: string }>(), save = deferred<{ data: Connection; etag: string }>();
  const h = await toggleHarness({ load: () => read.promise, save: () => save.promise }); t.after(h.dispose);
  let task!: Promise<boolean>; await act(async () => { task = h.current.toggle("linear", false); });
  assert.equal(h.current.pending, "linear"); assert.equal(h.catalog.connections[0].enabled, true);
  await act(async () => assert.equal(await h.current.toggle("slack", false), false)); assert.equal(h.reads.length, 1);
  await act(async () => read.resolve({ data: connection(), etag: '"v3"' }));
  assert.equal(h.current.pending, "linear"); assert.equal(h.catalog.connections[0].enabled, true);
  await act(async () => save.resolve({ data: { ...connection(), enabled: false }, etag: '"v4"' }));
  assert.equal(await task, true); assert.equal(h.catalog.connections[0].enabled, false); assert.equal(h.current.pending, null);
});
test("authorization and supported-provider guards perform no configuration request", async t => {
  const h = await toggleHarness(); t.after(h.dispose);
  await h.rerender({ enabled: false });
  await act(async () => assert.equal(await h.current.toggle("linear", false), false));
  await h.rerender({ enabled: true, projectId: "" });
  await act(async () => assert.equal(await h.current.toggle("linear", false), false));
  await h.rerender({ projectId: "p" });
  await act(async () => assert.equal(await h.current.toggle("youtrack" as Provider, true), false));
  await act(async () => assert.equal(await h.current.toggle("gitlab" as Provider, true), false));
  assert.equal(h.reads.length, 0); assert.equal(h.writes.length, 0);
});
test("tenant ABA and identity changes abort old operations without publishing their late replies", async t => {
  const read = deferred<{ data: Connection; etag: string }>();
  const h = await toggleHarness({ load: () => read.promise }); t.after(h.dispose);
  let task!: Promise<boolean>; await act(async () => { task = h.current.toggle("linear", false); });
  const signal = h.reads[0].signal;
  await h.rerender({ workspaceId: "other" }); await h.rerender({ workspaceId: "w" });
  assert.equal(signal.aborted, true); assert.equal(h.current.pending, null);
  await act(async () => read.resolve({ data: connection(), etag: '"v3"' }));
  assert.equal(await task, false); assert.equal(h.writes.length, 0); assert.equal(h.updates.length, 0);
  const read2 = deferred<{ data: Connection; etag: string }>();
  const second = await toggleHarness({ load: () => read2.promise });
  let secondTask!: Promise<boolean>; await act(async () => { secondTask = second.current.toggle("linear", false); });
  await second.rerender({ subject: "qa-2" }); assert.equal(second.reads[0].signal.aborted, true);
  await act(async () => read2.resolve({ data: connection(), etag: '"v3"' }));
  assert.equal(await secondTask, false); assert.equal(second.writes.length, 0); await second.dispose();
});
test("CAS and SSO failures leave the previous enabled state intact and expose only safe error codes", async t => {
  const h = await toggleHarness({ save: async () => { throw new TmsApiError("private-token-never-render", 412, "trace", "PRECONDITION_FAILED"); } }); t.after(h.dispose);
  await act(async () => assert.equal(await h.current.toggle("linear", false), false));
  assert.equal(h.current.error, "PRECONDITION_FAILED"); assert.equal(h.current.pending, null);
  assert.equal(h.catalog.connections[0].enabled, true); assert.equal(h.updates.length, 0);
  const denied = await toggleHarness({ load: async () => { throw new TmsApiError("private-token", 403, "trace", "FORBIDDEN"); } });
  await act(async () => assert.equal(await denied.current.toggle("linear", false), false));
  assert.equal(denied.current.error, "FORBIDDEN"); assert.equal(denied.writes.length, 0); await denied.dispose();
});
test("a late save after a project switch cannot update the new project's catalog or callback", async t => {
  const save = deferred<{ data: Connection; etag: string }>();
  const h = await toggleHarness({ save: () => save.promise }); t.after(h.dispose);
  let task!: Promise<boolean>; await act(async () => { task = h.current.toggle("linear", false); });
  assert.equal(h.writes.length, 1); const signal = h.writes[0].options.signal;
  await h.rerender({ projectId: "new-project" }); assert.equal(signal.aborted, true);
  assert.equal(h.current.pending, null);
  await act(async () => save.resolve({ data: { ...connection(), enabled: false }, etag: '"v4"' }));
  assert.equal(await task, false); assert.equal(h.updates.length, 0); assert.equal(h.current.error, null);
});
