import assert from "node:assert/strict";
import { test } from "node:test";
import { apiServers, documentForServer, requireSelectedServer } from "../execution/api-servers";
import { chooseApiSource, keepsSourceCredentials, sourceDraft, type ApiSource } from "../model/api-source";
test("server selection supports monolith, operation servers, relative paths, variables and Swagger 2", () => {
  const document = { openapi: "3.1.0", servers: [{ url: "/v1" }], paths: { "/orders": { get: { servers: [{ url: "https://{stage}.example.org/v2", variables: { stage: { default: "qa" } } }] } } } };
  assert.deepEqual(apiServers(document, "https://api.example.org/docs/openapi.json"), ["https://api.example.org/v1", "https://qa.example.org/v2"]);
  assert.deepEqual(apiServers({ swagger: "2.0", host: "api.example.org", schemes: ["https"], basePath: "/v1" }, "https://example.org/docs"), ["https://api.example.org/v1"]);
  const selected = documentForServer(document, "https://qa.example.org/v2");
  assert.equal(JSON.stringify(selected).includes("stage"), false); assert.equal(JSON.stringify(document).includes("stage"), true);
  assert.throws(() => requireSelectedServer("https://qa.example.org/v2/orders", ""));
  assert.throws(() => requireSelectedServer("https://prod.example.org/v2/orders", "https://qa.example.org/v2"));
  assert.throws(() => requireSelectedServer("https://qa.example.org/v20/orders", "https://qa.example.org/v2"));
  assert.doesNotThrow(() => requireSelectedServer("https://qa.example.org/v2/orders", "https://qa.example.org/v2"));
});
test("shared selection stays selected, otherwise restores context memory, sole API or asks", () => {
  const sources = [{ id: "shared" }, { id: "orders" }] as ApiSource[];
  assert.equal(chooseApiSource(sources, "shared", "orders"), "shared");
  assert.equal(chooseApiSource(sources, "missing", "orders"), "orders");
  assert.equal(chooseApiSource(sources, null, null), null);
  assert.equal(chooseApiSource(sources.slice(0, 1), "missing", null), "shared");
  assert.equal(chooseApiSource([], "shared", "orders"), null);
});

test("saved documentation credentials are retained only for the same origin and auth mode", () => {
  const source = { sourceUrl: "https://docs.example.org/a", credentialsConfigured: true, authMode: "basic", projectIds: [] } as unknown as ApiSource;
  const draft = sourceDraft(source, "");
  assert.equal(keepsSourceCredentials(source, { ...draft, sourceUrl: "https://docs.example.org/b" }), true);
  for (const sourceUrl of ["https://other.example.org/a", "http://docs.example.org/a", "invalid"]) {
    assert.equal(keepsSourceCredentials(source, { ...draft, sourceUrl }), false);
  }
  assert.equal(keepsSourceCredentials(source, { ...draft, authMode: "bearer" }), false);
});
