import assert from "node:assert/strict";
import test from "node:test";
import type { TmsHttpClient } from "../../../../../core/tms/transport/http";
import { requestMemberName } from "../data/names/request-member-name";

function deferredDirectory() {
  const pending: { path: string; signal: AbortSignal; resolve: (value: unknown) => void }[] = [];
  const http = { get: (path: string, signal: AbortSignal) => new Promise((resolve) => pending.push({ path, signal, resolve })) } as unknown as TmsHttpClient;
  return { http, pending };
}
const directory = { data: [{ identityId: "member-1", displayName: "Alex", email: null }], meta: { limit: 100, hasMore: false, nextCursor: null } };

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
