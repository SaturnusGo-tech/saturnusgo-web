import assert from "node:assert/strict";
import test from "node:test";
import { readTmsAuth0Configuration } from "./auth0-config";

const validEnvironment = () => ({
  NEXT_PUBLIC_AUTH0_DOMAIN: "dev-4v1srvqwzp1m7cdl.us.auth0.com",
  NEXT_PUBLIC_AUTH0_CLIENT_ID: "CQjoUKhO0f73Cb80jmWNiGXuyZt1TviC",
  NEXT_PUBLIC_AUTH0_AUDIENCE: "https://api.tms.saturnusgo.com",
});

test("accepts the exact public Auth0 SPA configuration", () => {
  assert.deepEqual(readTmsAuth0Configuration(validEnvironment()), {
    ok: true,
    value: {
      domain: "dev-4v1srvqwzp1m7cdl.us.auth0.com",
      clientId: "CQjoUKhO0f73Cb80jmWNiGXuyZt1TviC",
      audience: "https://api.tms.saturnusgo.com",
    },
  });
});

test("fails closed when any required public setting is absent", () => {
  for (const key of Object.keys(validEnvironment())) {
    const environment: Record<string, string | undefined> = validEnvironment();
    delete environment[key];
    assert.deepEqual(readTmsAuth0Configuration(environment), {
      ok: false,
      reason: "missing",
    });
  }
});

test("rejects unsafe domains, identifiers, and surrounding whitespace", () => {
  for (const patch of [
    { NEXT_PUBLIC_AUTH0_DOMAIN: "https://tenant.auth0.com" },
    { NEXT_PUBLIC_AUTH0_DOMAIN: "tenant.auth0.com/path" },
    { NEXT_PUBLIC_AUTH0_CLIENT_ID: "client id" },
    { NEXT_PUBLIC_AUTH0_AUDIENCE: " https://api.example.test" },
  ]) {
    assert.deepEqual(readTmsAuth0Configuration({
      ...validEnvironment(),
      ...patch,
    }), { ok: false, reason: patch.NEXT_PUBLIC_AUTH0_AUDIENCE ? "missing" : "invalid" });
  }
});
