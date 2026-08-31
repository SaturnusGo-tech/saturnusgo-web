import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { POSTMAN_WEB_URL, swaggerFrameUrl, UMBRELLA_API_SWAGGER_URL } from "../model";

const source = readFileSync(fileURLToPath(new URL("../ApiTestingView.tsx", import.meta.url)), "utf8");

test("embeds only the approved Swagger origin without TMS credentials", () => {
  const target = new URL(UMBRELLA_API_SWAGGER_URL);
  assert.equal(target.origin, "https://sieger-assistente-production.up.railway.app");
  assert.equal(target.pathname, "/docs");
  assert.match(source, /referrerPolicy="no-referrer"/);
  assert.doesNotMatch(source, /Authorization|accessToken|Bearer|credentials=/);
});

test("uses the shared TESSIQ loading state and a constrained iframe", () => {
  assert.match(source, /<TessiqLoader pane/);
  assert.match(source, /swaggerFrameUrl\(theme, locale\)/);
  assert.match(source, /sandbox="allow-downloads allow-forms allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts"/);
  assert.match(source, /title=\{t\("apiTesting\.frameTitle"\)\}/);
});

test("synchronizes the embedded access screen with TESSIQ theme and language", () => {
  const darkRussian = new URL(swaggerFrameUrl("dark", "ru"));
  assert.equal(darkRussian.searchParams.get("theme"), "dark");
  assert.equal(darkRussian.searchParams.get("lang"), "ru");
  assert.equal(darkRussian.hash, "#/");

  const unresolvedEnglish = new URL(swaggerFrameUrl(undefined, "en"));
  assert.equal(unresolvedEnglish.searchParams.has("theme"), false);
  assert.equal(unresolvedEnglish.searchParams.get("lang"), "en");
});

test("opens Postman in a separate tab without sharing TMS credentials", () => {
  const postman = new URL(POSTMAN_WEB_URL);
  assert.equal(postman.origin, "https://web.postman.co");
  assert.match(source, /href=\{POSTMAN_WEB_URL\} target="_blank" rel="noopener noreferrer"/);
  assert.doesNotMatch(source, /<iframe[^>]+POSTMAN_WEB_URL/);
  assert.doesNotMatch(source, /Authorization|accessToken|Bearer|credentials=/);
});

test("keeps the API testing chrome compact", () => {
  assert.doesNotMatch(source, /apiTesting\.(description|authHint|postmanDescription|postmanAuthHint|postmanExternalOnly)/);
  assert.doesNotMatch(source, /apiTesting\.(reload|signOut|openExternal)/);
});
