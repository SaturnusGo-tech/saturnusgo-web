import assert from "node:assert/strict";
import test from "node:test";
import { safeTmsReturnPath, TMS_AUTH_ROUTE_PATH } from "./tms-auth-route";

test("keeps Auth0 redirects inside the stable lowercase TMS route", () => {
  assert.equal(safeTmsReturnPath(TMS_AUTH_ROUTE_PATH), TMS_AUTH_ROUTE_PATH);
  assert.equal(
    safeTmsReturnPath(`${TMS_AUTH_ROUTE_PATH}?view=runs`),
    `${TMS_AUTH_ROUTE_PATH}?view=runs`,
  );
});

test("rejects external, mixed-case, and malformed return targets", () => {
  for (const candidate of [
    "https://attacker.example/testcases/umbrella-home/work/",
    "//attacker.example/testcases/umbrella-home/work/",
    "/testcases/UmbrellaHome/Work/",
    "/testcases/umbrella-home/work/\\attacker.example",
    null,
  ]) {
    assert.equal(safeTmsReturnPath(candidate), TMS_AUTH_ROUTE_PATH);
  }
});
