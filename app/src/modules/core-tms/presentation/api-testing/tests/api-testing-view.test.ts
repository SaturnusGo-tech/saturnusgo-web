import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import {
  UMBRELLA_API_SWAGGER_LOGOUT_URL,
  UMBRELLA_API_SWAGGER_URL,
} from "../model";

const source = readFileSync(fileURLToPath(new URL("../ApiTestingView.tsx", import.meta.url)), "utf8");

test("embeds only the approved Swagger origin without TMS credentials", () => {
  const target = new URL(UMBRELLA_API_SWAGGER_URL);
  assert.equal(target.origin, "https://sieger-assistente-production.up.railway.app");
  assert.equal(target.pathname, "/docs");
  assert.match(source, /referrerPolicy="no-referrer"/);
  assert.doesNotMatch(source, /Authorization|accessToken|Bearer|credentials=/);
});

test("uses the server-owned Swagger logout endpoint", () => {
  const logout = new URL(UMBRELLA_API_SWAGGER_LOGOUT_URL);
  assert.equal(logout.origin, new URL(UMBRELLA_API_SWAGGER_URL).origin);
  assert.equal(logout.pathname, "/docs/logout");
  assert.match(source, /setFrameUrl\(UMBRELLA_API_SWAGGER_LOGOUT_URL\)/);
  assert.match(source, /apiTesting\.signOut/);
});

test("uses the shared Saturn loading state and a constrained iframe", () => {
  assert.match(source, /<SaturnLoader pane/);
  assert.match(source, /sandbox="allow-downloads allow-forms allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts"/);
  assert.match(source, /title=\{t\("apiTesting\.frameTitle"\)\}/);
});
