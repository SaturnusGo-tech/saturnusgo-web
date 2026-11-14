import assert from "node:assert/strict";
import test from "node:test";
import { createTmsHttpClient, TmsApiError } from "../../http";

async function validationFailure(details: unknown): Promise<TmsApiError> {
  const client = createTmsHttpClient({
    apiBase: "https://api.example.test/api/v1",
    production: true,
    credentials: "include",
    fetch: async () => Response.json({
      error: { code: "VALIDATION_ERROR", message: "Request validation failed", requestId: "validation-request", details },
    }, { status: 400 }),
  });
  try {
    await client.mutate("/projects/project/test-data/bindings:validate", "POST", {});
    assert.fail("Expected validation failure");
  } catch (error) {
    assert.ok(error instanceof TmsApiError);
    return error;
  }
}

test("preserves the field from production validation issues without retaining issue payloads", async () => {
  const error = await validationFailure([{
    field: "bindings.0.alias", code: "invalid_format", message: "synthetic-sensitive-input", input: "synthetic-sensitive-input",
  }]);
  assert.equal(error.validationField, "bindings.0.alias");
  assert.equal(error.code, "VALIDATION_ERROR");
  assert.equal(error.requestId, "validation-request");
  assert.equal(error.details, null);
  assert.equal(JSON.stringify(error).includes("synthetic-sensitive-input"), false);
});

test("keeps existing structured application error details compatible", async () => {
  const details = { field: " customFields ", reason: "requiredCustomField" };
  const error = await validationFailure(details);
  assert.equal(error.validationField, "customFields");
  assert.deepEqual(error.details, details);
});

test("ignores malformed or unbounded issue fields rather than exposing issue messages", async () => {
  const cases = [null, [], [null], [{ message: "bindings.0.alias" }], [{ field: 7 }],
    [{ field: "a".repeat(129) }], [{ field: "bindings.0.alias\nraw-input" }]];
  for (const details of cases) {
    const error = await validationFailure(details);
    assert.equal(error.validationField, null);
    assert.equal(error.details, null);
  }
});
