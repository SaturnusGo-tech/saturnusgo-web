import assert from "node:assert/strict";
import test from "node:test";
import { requestDemo, DemoRequestError, validateDemoEmail } from "../data/request";

const input = { email: "  User@example.com  ", locale: "es" as const, consent: true, website: "" };
const signal = new AbortController().signal;

test("email validation rejects malformed and oversized addresses, preserving valid international domains", () => {
  for (const email of ["", "abc", "a@", "a b@example.com", "a@b", "a..b@example.com", ".a@example.com", "a@-domain.com", `${"a".repeat(65)}@example.com`]) {
    assert.equal(validateDemoEmail(email), false, email);
  }
  for (const email of ["a+b@example.com", " user@example.com ", "a@exämple.com"]) assert.equal(validateDemoEmail(email), true);
});

test("adapter sends normalized email and explicit versioned consent to only the demo endpoint", async () => {
  const fetcher: typeof fetch = async (url, options) => {
    assert.equal(url, "/api/falcon-demo/request");
    assert.equal(options?.method, "POST");
    assert.equal(options?.signal, signal);
    assert.equal(options?.credentials, "same-origin");
    assert.deepEqual(JSON.parse(String(options?.body)), { ...input, email: "User@example.com", consentVersion: "2026-10-15" });
    return Response.json({ status: "accepted" });
  };
  await requestDemo(input, signal, fetcher);
});

test("adapter refuses invalid input and unchecked consent without a network call", async () => {
  const fetcher: typeof fetch = async () => { assert.fail("must not fetch"); };
  for (const data of [{ ...input, consent: false }, { ...input, email: "broken" }]) {
    await assert.rejects(requestDemo(data, signal, fetcher), (error: unknown) => error instanceof DemoRequestError && error.kind === "invalid");
  }
});

test("only a confirmed accepted response counts as success", async () => {
  for (const response of [new Response("<html>fallback</html>"), Response.json({}), Response.json({ status: "error" }), new Response(null, { status: 204 }), Response.json({ status: "accepted" }, { status: 503 })]) {
    await assert.rejects(requestDemo(input, signal, async () => response), DemoRequestError);
  }
});

test("rate limits and validation errors are distinguishable from unavailable service", async () => {
  for (const [status, kind] of [[400, "invalid"], [429, "rate"], [401, "unavailable"], [503, "unavailable"]] as const) {
    await assert.rejects(requestDemo(input, signal, async () => new Response(null, { status })), (error: unknown) => error instanceof DemoRequestError && error.kind === kind);
  }
});

test("cancellation propagates and cannot become a successful request", async () => {
  const aborted = new DOMException("Aborted", "AbortError");
  await assert.rejects(requestDemo(input, signal, async () => { throw aborted; }), error => error === aborted);
});
