import assert from "node:assert/strict";
import test from "node:test";
import type { TmsHttpClient } from "../../../../../core/tms/transport/http";
import { requestMemberName } from "../data/names/request-member-name";
import { requestWorkspaceActor } from "../data/actors/request-workspace-actor";

function deferredDirectory() {
  const pending: { path: string; signal: AbortSignal; resolve: (value: unknown) => void }[] = [];
  const http = { get: (path: string, signal: AbortSignal) => new Promise((resolve) => pending.push({ path, signal, resolve })) } as unknown as TmsHttpClient;
  return { http, pending };
}
const directory = { data: [{ identityId: "member-1", kind: "human", name: "Alex", email: null }], meta: { limit: 100, hasMore: false, nextCursor: null } };

test("repeated responsible labels share a request and one unmount cannot cancel another row", async () => {
  const { http, pending } = deferredDirectory();
  const first = new AbortController();
  const second = new AbortController();
  const firstName = requestMemberName(http, "workspace-1", "member-1", first.signal);
  const secondName = requestMemberName(http, "workspace-1", "member-1", second.signal);
  assert.equal(pending.length, 1);
  const cancelled = assert.rejects(firstName, { name: "AbortError" });
  first.abort();
  await cancelled;
  assert.equal(pending[0].signal.aborted, false);
  pending[0].resolve(directory);
  assert.equal(await secondName, "Alex");
});

test("member lookup scope is isolated and the last unmount aborts its request", async () => {
  const { http, pending } = deferredDirectory();
  const first = new AbortController();
  const second = new AbortController();
  const firstName = requestMemberName(http, "workspace-1", "member-1", first.signal);
  const secondName = requestMemberName(http, "workspace-2", "member-1", second.signal);
  assert.equal(pending.length, 2);
  const cancelled = assert.rejects(firstName, { name: "AbortError" });
  first.abort();
  await cancelled;
  assert.equal(pending[0].signal.aborted, true);
  assert.equal(pending[1].signal.aborted, false);
  pending[1].resolve(directory);
  assert.equal(await secondName, "Alex");
  const next = requestMemberName(http, "workspace-2", "member-1", new AbortController().signal);
  assert.equal(pending.length, 3, "completed results are not retained across later reads");
  pending[2].resolve(directory);
  assert.equal(await next, "Alex");
});

test("profile sign-in and ordinary name lookup have separate request scopes", async () => {
  const { http, pending } = deferredDirectory();
  const signal = new AbortController().signal;
  const name = requestMemberName(http, "workspace-1", "member-1", signal);
  const profile = requestWorkspaceActor(http, "workspace-1", "member-1", signal, true);
  const simultaneousProfile = requestWorkspaceActor(http, "workspace-1", "member-1", signal, true);
  assert.equal(pending.length, 2);
  assert.doesNotMatch(pending[0].path, /includeSignIn/);
  assert.match(pending[1].path, /includeSignIn=true/);
  pending[0].resolve(directory);
  const lastSignedInAt = "2026-11-09T04:58:00.000Z";
  pending[1].resolve({ ...directory, data: [{ ...directory.data[0], lastSignedInAt }] });
  assert.equal(await name, "Alex");
  assert.deepEqual(await profile, { ...directory.data[0], lastSignedInAt });
  assert.deepEqual(await simultaneousProfile, await profile);
});
