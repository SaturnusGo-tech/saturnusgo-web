import assert from "node:assert/strict";
import { test } from "node:test";
import type { TmsHttpClient, TmsMutationOptions } from "../../../../../../core/tms/transport/http";
import { createSelfProfileClient } from "../../data/profile-client";
import { profile } from "../helpers/profile-fixtures";

void test("profile details preserve explicit clearing and use the current version precondition", async () => {
  const controller = new AbortController(), calls: unknown[][] = [];
  const updated = { ...profile, name: "Pat Updated", contactUrl: null, version: 4 };
  const http = {
    getResource: async (path: string, signal?: AbortSignal) => { calls.push([path, signal]); return { data: profile }; },
    mutateResource: async (...args: unknown[]) => { calls.push(args); return { data: updated }; },
  } as unknown as TmsHttpClient;
  const client = createSelfProfileClient(http);
  assert.equal(await client.read(controller.signal), profile);
  const details = { name: "Pat Updated", phone: "", introduction: "", bio: "", location: "", contactUrl: null };
  assert.equal(await client.update(profile, details, controller.signal), updated);
  assert.deepEqual(calls[0], ["/me/profile", controller.signal]);
  assert.deepEqual(calls[1], ["/me/profile", "PATCH", details,
    { signal: controller.signal, ifMatch: '"3"', idempotencyKey: undefined }]);
});

void test("media writes resolve the full refreshed profile after the version-only response", async () => {
  const controller = new AbortController(), calls: unknown[][] = [];
  const updated = { ...profile, hasAvatar: true, version: 4 };
  const http = {
    getResource: async (path: string, signal?: AbortSignal) => { calls.push([path, signal]); return { data: updated }; },
    mutateResource: async (path: string, method: string, body: unknown, options: TmsMutationOptions) => {
      calls.push([path, method, body, options]); return { data: { version: 4 } };
    },
  } as unknown as TmsHttpClient;
  const client = createSelfProfileClient(http);
  const file = new Blob([new Uint8Array(12)], { type: "image/png" }) as File;
  assert.deepEqual(await client.upload(profile, "avatar", file, "avatar-operation", controller.signal), updated);
  assert.deepEqual(calls[0], ["/me/profile/avatar", "POST", { imageBase64: "AAAAAAAAAAAAAAAA" },
    { signal: controller.signal, ifMatch: '"3"', idempotencyKey: "avatar-operation" }]);
  assert.deepEqual(calls[1], ["/me/profile", controller.signal]);
  calls.length = 0;
  assert.deepEqual(await client.remove(profile, "banner", controller.signal), updated);
  assert.deepEqual(calls[0], ["/me/profile/banner", "DELETE", undefined,
    { signal: controller.signal, ifMatch: '"3"', idempotencyKey: undefined }]);
  assert.deepEqual(calls[1], ["/me/profile", controller.signal]);
});

void test("activity is explicitly scoped and failed writes do not trigger a success read", async () => {
  const signal = new AbortController().signal, failure = new Error("Conflict");
  const reads: unknown[][] = [];
  const http = {
    getResource: async (...args: unknown[]) => { reads.push(args); return { data: { period: 90 } }; },
    mutateResource: async () => { throw failure; },
  } as unknown as TmsHttpClient;
  const client = createSelfProfileClient(http);
  assert.deepEqual(await client.activity("company & space", 90, signal), { period: 90 });
  assert.deepEqual(reads[0], ["/me/profile/activity?workspaceId=company+%26+space&days=90", signal]);
  await assert.rejects(client.remove(profile, "avatar", signal), error => error === failure);
  assert.equal(reads.length, 1);
});

void test("calendar and achievements requests preserve workspace scope and never combine year with days", async () => {
  const signal = new AbortController().signal, reads: unknown[][] = [];
  const http = { getResource: async (...args: unknown[]) => { reads.push(args); return { data: { items: [] } }; } } as unknown as TmsHttpClient;
  const client = createSelfProfileClient(http);
  await client.calendar("company & space", 2024, signal);
  await client.achievements("company & space", signal);
  assert.deepEqual(reads, [
    ["/me/profile/activity?workspaceId=company+%26+space&year=2024", signal],
    ["/me/profile/achievements?workspaceId=company+%26+space", signal],
  ]);
});
