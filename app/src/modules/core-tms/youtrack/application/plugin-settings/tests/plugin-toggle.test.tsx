import assert from "node:assert/strict";
import test from "node:test";
import { act } from "react-test-renderer";
import { TmsApiError } from "../../../../../../core/tms/transport/http";
import type { YouTrackConfiguration } from "../../../model/youtrack-settings";
import { configuration, deferred, toggleHarness, type Resource } from "./toggle-harness";

test("YouTrack toggle preserves server-held credentials and v2 routing while using the freshly loaded CAS ETag", async t => {
  const h = await toggleHarness(); t.after(h.dispose);
  await act(async () => assert.equal(await h.current.toggle(false), true));
  assert.equal(h.reads.length, 1); assert.equal(h.writes.length, 1);
  assert.equal(h.reads[0].path, "/integrations/youtrack/configuration?workspaceId=w");
  assert.equal(h.writes[0].path, h.reads[0].path); assert.equal(h.writes[0].method, "PATCH"); assert.equal(h.writes[0].options.ifMatch, '"v3"');
  const body = h.writes[0].body;
  assert.equal(body.enabled, false); assert.equal(body.configurationVersion, 2); assert.equal(body.baseUrl, "https://youtrack.example/youtrack/");
  assert.equal("apiToken" in body, false); assert.equal(body.routes.length, 2);
  assert.deepEqual(body.routes.map(route => ({ id: route.id, project: route.project.id, match: route.match })),
    [{ id: "default", project: "main-project", match: null }, { id: "web-rule", project: "web-project", match: { field: "component", value: "Web" } }]);
  assert.deepEqual(body.routes[1].workflow.inbound.readyForRetest, ["test"]); assert.equal(body.routes[1].workflow.outbound.verified, "done");
  assert.equal("statuses" in body.routes[1].workflow, false);
  assert.equal(h.updates.length, 1); assert.equal(h.updates[0].enabled, false); assert.equal(h.current.pending, false); assert.equal(h.current.error, null);
});
test("missing credentials, runtime or legacy configuration and invalid routing open Manage without inventing an update", async () => {
  const base = configuration();
  const variants: YouTrackConfiguration[] = [{ ...base, baseUrl: null }, { ...base, tokenConfigured: false }, { ...base, source: "runtime" },
    { ...base, source: "tenant_default" }, { ...base, configurationVersion: 1 }, { ...base, routes: [] }];
  for (const data of variants) {
    const h = await toggleHarness({ load: async () => ({ data, etag: '"v3"' }) });
    await act(async () => assert.equal(await h.current.toggle(false), false));
    assert.equal(h.writes.length, 0); assert.equal(h.updates.length, 0); assert.equal(h.current.error, null); await h.dispose();
  }
});
test("missing ETag and a response from another workspace never write or publish a toggle", async () => {
  for (const data of [{ data: configuration(), etag: null }, { data: { ...configuration(), workspaceId: "other" }, etag: '"v3"' }]) {
    const h = await toggleHarness({ load: async () => data });
    await act(async () => assert.equal(await h.current.toggle(false), false)); assert.equal(h.writes.length, 0); assert.equal(h.updates.length, 0);
    assert.equal(h.current.error, data.etag ? "REMOTE_SCOPE_MISMATCH" : "PRECONDITION_REQUIRED"); await h.dispose();
  }
});
test("pending toggles serialize and cannot change the visible server state before a successful save", async t => {
  const read = deferred<Resource>(), save = deferred<Resource>();
  const h = await toggleHarness({ load: () => read.promise, save: () => save.promise }); t.after(h.dispose);
  let task!: Promise<boolean>; await act(async () => { task = h.current.toggle(false); });
  assert.equal(h.current.pending, true); assert.equal(h.updates.length, 0);
  await act(async () => assert.equal(await h.current.toggle(true), false)); assert.equal(h.reads.length, 1);
  await act(async () => read.resolve({ data: configuration(), etag: '"v3"' })); assert.equal(h.writes.length, 1); assert.equal(h.updates.length, 0);
  await act(async () => save.resolve({ data: { ...configuration(), enabled: false, rowVersion: 4 }, etag: '"v4"' }));
  assert.equal(await task, true); assert.equal(h.updates[0].enabled, false); assert.equal(h.current.pending, false);
});
test("role, workspace, account, HTTP owner and unmount cancel late replies, including tenant ABA", async () => {
  for (const change of ["disabled", "workspace", "subject", "http", "unmount", "aba"]) {
    const read = deferred<Resource>(), h = await toggleHarness({ load: () => read.promise });
    let task!: Promise<boolean>; await act(async () => { task = h.current.toggle(false); }); const signal = h.reads[0].signal;
    if (change === "unmount") await h.dispose();
    else if (change === "http") await h.rerender({}, true);
    else if (change === "disabled") await h.rerender({ enabled: false });
    else if (change === "subject") await h.rerender({ subject: "qa-two" });
    else { await h.rerender({ workspaceId: "other" }); if (change === "aba") await h.rerender({ workspaceId: "w" }); }
    assert.equal(signal.aborted, true);
    await act(async () => read.resolve({ data: configuration(), etag: '"v3"' }));
    assert.equal(await task, false); assert.equal(h.writes.length, 0); assert.equal(h.updates.length, 0);
    if (change !== "unmount") { assert.equal(h.current.pending, false); await h.dispose(); }
  }
});
test("CAS and SSO errors keep the old state and expose codes without private failure details", async () => {
  for (const readError of [false, true]) {
    const error = new TmsApiError("private-token-never-render", readError ? 403 : 412, "trace", readError ? "FORBIDDEN" : "PRECONDITION_FAILED");
    const h = await toggleHarness(readError ? { load: async () => { throw error; } } : { save: async () => { throw error; } });
    await act(async () => assert.equal(await h.current.toggle(false), false));
    assert.equal(h.current.error, readError ? "FORBIDDEN" : "PRECONDITION_FAILED"); assert.equal(h.current.pending, false); assert.equal(h.updates.length, 0); await h.dispose();
  }
});
test("late saves cannot update a new scope, and requests for the existing state avoid unnecessary writes", async () => {
  const save = deferred<Resource>(), h = await toggleHarness({ save: () => save.promise }); let task!: Promise<boolean>;
  await act(async () => { task = h.current.toggle(false); }); assert.equal(h.writes.length, 1);
  await h.rerender({ subject: "qa-two" }); assert.equal(h.writes[0].options.signal.aborted, true);
  await act(async () => save.resolve({ data: { ...configuration(), enabled: false }, etag: '"v4"' }));
  assert.equal(await task, false); assert.equal(h.updates.length, 0); await h.dispose();
  const same = await toggleHarness(); await act(async () => assert.equal(await same.current.toggle(true), true));
  assert.equal(same.writes.length, 0); assert.equal(same.updates[0].enabled, true);
  await same.rerender({ enabled: false }); await act(async () => assert.equal(await same.current.toggle(false), false));
  assert.equal(same.reads.length, 1); await same.dispose();
});
