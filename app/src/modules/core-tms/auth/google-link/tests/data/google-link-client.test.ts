import assert from "node:assert/strict";
import { test } from "node:test";
import { createSignInClient } from "../../../sign-in/data/sign-in-client";
void test("company linking sends only explicit link intent with the existing session cookie", async () => {
  let path = ""; let request: RequestInit | undefined;
  const client = createSignInClient(async (url, init) => {
    path = String(url); request = init;
    return Response.json({ data: { authorizationUrl: "https://accounts.google.com/o/oauth2/v2/auth?state=opaque" } });
  });
  await client.startGoogle("link");
  assert.equal(path, "/api/v1/auth/google/start");
  assert.equal(request?.method, "POST"); assert.equal(request?.credentials, "include");
  assert.equal(request?.cache, "no-store"); assert.equal(request?.redirect, "error");
  assert.deepEqual(JSON.parse(String(request?.body)), { intent: "link" });
});
