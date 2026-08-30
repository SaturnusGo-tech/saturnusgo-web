import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { POSTMAN_WEB_URL, UMBRELLA_API_SWAGGER_URL } from "../model";

const source = readFileSync(fileURLToPath(new URL("../ApiTestingView.tsx", import.meta.url)), "utf8");

test("embeds only the approved Swagger origin without TMS credentials", () => {
  const target = new URL(UMBRELLA_API_SWAGGER_URL);
  assert.equal(target.origin, "https://sieger-assistente-production.up.railway.app");
  assert.equal(target.pathname, "/docs");
  assert.match(source, /referrerPolicy="no-referrer"/);
  assert.doesNotMatch(source, /Authorization|accessToken|Bearer|credentials=/);
});

test("uses the shared Saturn loading state and a constrained iframe", () => {
  assert.match(source, /<SaturnLoader pane/);
  assert.match(source, /sandbox="allow-downloads allow-forms allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts"/);
  assert.match(source, /title=\{t\("apiTesting\.frameTitle"\)\}/);
});

test("navigates the current tab to Postman without sharing TMS credentials", () => {
  const postman = new URL(POSTMAN_WEB_URL);
  assert.equal(postman.origin, "https://web.postman.co");
  assert.match(source, /href=\{POSTMAN_WEB_URL\} rel="noreferrer"/);
  assert.doesNotMatch(source, /target="_blank"/);
  assert.doesNotMatch(source, /<iframe[^>]+POSTMAN_WEB_URL/);
  assert.doesNotMatch(source, /Authorization|accessToken|Bearer|credentials=/);
});

test("keeps the API testing chrome compact", () => {
  assert.doesNotMatch(source, /apiTesting\.(description|authHint|postmanDescription|postmanAuthHint|postmanExternalOnly)/);
  assert.doesNotMatch(source, /apiTesting\.(reload|signOut|openExternal)/);
});
