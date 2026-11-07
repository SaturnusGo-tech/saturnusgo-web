import assert from "node:assert/strict";
import { test } from "node:test";
import { continuationFromLocation, safeContinuationPath } from "../../../auth/continuation/domain/continuation-path";
import { planRequestGmailUrl, readPlanRequestIntent } from "../../requests/domain/plan-request";

const origin = "https://tms.saturnusgo.com";
const login = (search: string) => continuationFromLocation({ origin, pathname: "/cloud-login/", search, hash: "" });

test("the requested plan and approved request retain their safe billing destination after login", () => {
  assert.equal(login("?requestPlan=startup&lang=en"), "/work/?view=config&settings=billing&requestPlan=startup&lang=en");
  assert.equal(login("?planRequest=req_123&workspaceId=personal_123&lang=ru"), "/work/?view=config&settings=billing&planRequest=req_123&workspaceId=personal_123&lang=ru");
  assert.equal(safeContinuationPath("/work/?view=config&settings=billing&planRequest=req_123&workspaceId=personal_123&next=https://foreign.example", origin), "/work/?view=config&settings=billing&workspaceId=personal_123&planRequest=req_123");
});

test("billing deep links reject duplicates, invalid IDs and unsupported plans", () => {
  assert.equal(login("?requestPlan=startup&requestPlan=individual"), null);
  assert.equal(login("?planRequest=../a&workspaceId=personal_123"), null);
  assert.equal(login("?requestPlan=other"), null);
  assert.equal(safeContinuationPath("/work/?view=config&settings=billing&planRequest=req_123", origin), "/work/?view=config&settings=billing");
  assert.equal(safeContinuationPath("/work/?view=config&settings=billing&planRequest=req_123&workspaceId=one&workspaceId=two", origin), "/work/?view=config&settings=billing");
  assert.equal(readPlanRequestIntent("?planRequest=req_123&workspaceId=personal_123&requestPlan=enterprise")?.kind, "request");
});

test("Gmail draft includes the support address, plan and optional reference", () => {
  const draft = new URL(planRequestGmailUrl("startup", true, "FR-7"));
  assert.equal(draft.origin, "https://mail.google.com");
  assert.equal(draft.searchParams.get("view"), "cm");
  assert.equal(draft.searchParams.get("to"), "falcon@saturnusgo.com");
  assert.match(draft.searchParams.get("su")!, /Startup.*FR-7/);
  assert.match(draft.searchParams.get("body")!, /обсудить подключение/);
  assert.doesNotMatch(planRequestGmailUrl("enterprise", false), /undefined|null/);
});
