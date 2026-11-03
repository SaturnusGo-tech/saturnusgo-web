import assert from "node:assert/strict";
import test from "node:test";
import * as model from "../../model";
const specification = { openapi: "3.0.3", components: { schemas: { Booking: { type: "object" } } },
  paths: { "/bookings": { parameters: [{ name: "hotel", in: "query" }], get: { summary: "List guest bookings", tags: ["Bookings"] }, post: { summary: "Create reservation", tags: ["Bookings"] } },
    "/payments": { get: { summary: "List payments", tags: ["Billing"] } } } };
test("endpoint search filters methods without removing references or path parameters", () => {
  assert.equal(typeof model.filterApiOperations, "function");
  const result = model.filterApiOperations(specification, "guest");
  assert.deepEqual(result.paths, { "/bookings": { parameters: specification.paths["/bookings"].parameters, get: specification.paths["/bookings"].get } });
  assert.equal(result.components, specification.components);
  assert.ok(specification.paths["/bookings"].post, "search never mutates the source specification");
});
test("endpoint search matches path, method and tag, and clearing restores the source", () => {
  assert.equal(typeof model.filterApiOperations, "function");
  assert.equal(model.filterApiOperations(specification, ""), specification);
  assert.ok(model.filterApiOperations(specification, "POST").paths["/bookings"].post);
  assert.deepEqual(Object.keys(model.filterApiOperations(specification, "billing").paths), ["/payments"]);
  assert.equal(Object.keys(model.filterApiOperations(specification, "not-found").paths).length, 0);
});
test("a matching referenced path stays intact with its component target", () => {
  const document = { openapi: "3.1.0", paths: { "/bookings": { $ref: "#/components/pathItems/Bookings" } },
    components: { pathItems: { Bookings: { get: { summary: "List guest reservations", tags: ["Travel"] } } } } };
  const result = model.filterApiOperations(document, "bookings");
  assert.equal(result.paths["/bookings"], document.paths["/bookings"]);
  assert.equal(result.components, document.components);
});
test("local path item references can be searched by method, title and tag without rewriting refs", () => {
  const document = { openapi: "3.1.0", paths: { "/v1/reservations": { $ref: "#/components/pathItems/Bookings~1guest" } },
    components: { pathItems: { "Bookings/guest": { $ref: "#/components/pathItems/Actual" }, Actual: { get: { summary: "List guests", tags: ["Travel"] } } } } };
  for (const query of ["GET", "guest", "travel"]) {
    const result = model.filterApiOperations(document, query);
    assert.equal(result.paths["/v1/reservations"], document.paths["/v1/reservations"]);
    assert.equal(result.components, document.components);
  }
});
test("unresolved and cyclic refs are bounded, and malformed null operations do not crash search", () => {
  const document = { paths: { "/remote": { $ref: "https://api.company.com/path.json" }, "/cycle": { $ref: "#/components/pathItems/Cycle" },
    "/invalid": null, "/nullable": { get: null, post: { summary: "Create guest" } } },
    components: { pathItems: { Cycle: { $ref: "#/components/pathItems/Cycle" } } } };
  const result = model.filterApiOperations(document, "guest");
  assert.deepEqual(Object.keys(result.paths), ["/nullable"]);
  assert.deepEqual(result.paths["/nullable"], { post: { summary: "Create guest" } });
  assert.equal(model.filterApiOperations(document, "remote").paths["/remote"], document.paths["/remote"]);
  assert.equal(model.filterApiOperations(document, "cycle").paths["/cycle"], document.paths["/cycle"]);
});
