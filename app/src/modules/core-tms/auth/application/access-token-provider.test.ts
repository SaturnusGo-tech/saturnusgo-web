import assert from "node:assert/strict";
import test from "node:test";
import { createTmsAccessTokenProvider } from "./access-token-provider";

test("requests a fresh SDK result for each bearer-token consumer", async () => {
  let calls = 0;
  const provider = createTmsAccessTokenProvider(async () => `token-${++calls}`);
  assert.equal(await provider(), "token-1");
  assert.equal(await provider(), "token-2");
});

test("does not start Auth0 work after cancellation", async () => {
  let calls = 0;
  const controller = new AbortController();
  const reason = new DOMException("Navigation cancelled", "AbortError");
  controller.abort(reason);
  const provider = createTmsAccessTokenProvider(async () => {
    calls += 1;
    return "unused";
  });
  await assert.rejects(() => provider(controller.signal), (error) => error === reason);
  assert.equal(calls, 0);
});

test("preserves cancellation while Auth0 is resolving", async () => {
  const controller = new AbortController();
  const reason = new DOMException("Route changed", "AbortError");
  const provider = createTmsAccessTokenProvider(
    () => new Promise<string>(() => undefined),
  );
  const pending = provider(controller.signal);
  controller.abort(reason);
  await assert.rejects(() => pending, (error) => error === reason);
});

test("preserves Auth0 errors for the transport boundary to classify", async () => {
  const failure = new Error("login_required");
  const provider = createTmsAccessTokenProvider(async () => { throw failure; });
  await assert.rejects(() => provider(), (error) => error === failure);
});
