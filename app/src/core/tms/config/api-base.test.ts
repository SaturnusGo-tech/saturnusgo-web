import assert from "node:assert/strict";
import test from "node:test";
import { resolveTmsApiBase } from "./api-base";

test("production requires an explicit absolute HTTPS endpoint", () => {
  assert.throws(() => resolveTmsApiBase(undefined, true), /required/);
  assert.throws(() => resolveTmsApiBase("/api/v1", true), /absolute/);
  assert.throws(
    () => resolveTmsApiBase("http://api.example.test/api/v1", true),
    /HTTPS/,
  );
});

test("production rejects every localhost spelling", () => {
  for (const endpoint of [
    "https://localhost/api/v1",
    "https://api.localhost./api/v1",
    "https://127.0.0.42/api/v1",
    "https://0.0.0.0/api/v1",
    "https://[::1]/api/v1",
  ]) {
    assert.throws(() => resolveTmsApiBase(endpoint, true), /localhost/);
  }
});

test("production normalizes a valid endpoint", () => {
  assert.equal(
    resolveTmsApiBase(" https://tms-api.example.com/api/v1/ ", true),
    "https://tms-api.example.com/api/v1",
  );
});

test("development keeps the explicit localhost default", () => {
  assert.equal(
    resolveTmsApiBase(undefined, false, "http://localhost:4100/api/v1"),
    "http://localhost:4100/api/v1",
  );
});
