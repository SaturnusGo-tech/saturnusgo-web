import assert from "node:assert/strict";
import test from "node:test";
import type { TmsHttpClient } from "../../../../../../core/tms/transport/http";
import { createSelfProfileClient } from "../../data/profile-client";
import { profile } from "../helpers/profile-fixtures";

test("avatar selection uses the version and idempotency key, then reads the persisted profile", async () => {
  const signal = new AbortController().signal, calls: unknown[][] = [];
  const saved = { ...profile, avatarCharacterId: "nora", avatar: null, hasAvatar: false, version: 4 };
  const http = { getResource: async (...args: unknown[]) => { calls.push(args); return { data: saved }; },
    mutateResource: async (...args: unknown[]) => { calls.push(args); return { data: { version: 4 } }; } } as unknown as TmsHttpClient;
  const client = createSelfProfileClient(http);
  assert.equal(typeof client.chooseCharacter, "function");
  assert.equal(await client.chooseCharacter(profile, "nora", "choose-avatar-operation", signal), saved);
  assert.deepEqual(calls, [["/me/profile/avatar-character", "POST", { characterId: "nora" },
    { signal, ifMatch: '"3"', idempotencyKey: "choose-avatar-operation" }], ["/me/profile", signal]]);
});

test("rejected avatar selection does not refetch or claim the chosen portrait was saved", async () => {
  let reads = 0;
  const conflict = new Error("VERSION_CONFLICT"), signal = new AbortController().signal;
  const http = { getResource: async () => { reads++; }, mutateResource: async () => { throw conflict; } } as unknown as TmsHttpClient;
  const client = createSelfProfileClient(http);
  assert.equal(typeof client.chooseCharacter, "function");
  await assert.rejects(client.chooseCharacter(profile, "nora", "choose-avatar-operation", signal), error => error === conflict);
  assert.equal(reads, 0);
});
