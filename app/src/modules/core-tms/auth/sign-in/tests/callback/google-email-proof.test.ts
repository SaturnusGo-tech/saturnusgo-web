import assert from "node:assert/strict";
import { test } from "node:test";
import { googleEmailProof } from "../../composition/callback/google-email-proof";
void test("Google signup resumes the exact server email challenge without accepting redirect URLs", () => {
  const proof = googleEmailProof("?challengeId=proof-1&email=qa%40example.test&expiresAt=2030-01-01T00%3A00%3A00Z&retryAfterSeconds=60&intent=signup&returnTo=https://evil.test");
  assert.deepEqual(proof, { intent: "signup", email: "qa@example.test", challenge: { challengeId: "proof-1", expiresAt: "2030-01-01T00:00:00Z", retryAfterSeconds: 60 } });
});
void test("incomplete, malformed or out-of-range proof queries cannot skip method selection", () => {
  for (const query of ["", "?challengeId=x&email=qa@example.test", "?challengeId=x&email=invalid&expiresAt=2030-01-01&retryAfterSeconds=0&intent=signup", "?challengeId=x&email=qa@example.test&expiresAt=2030-01-01&retryAfterSeconds=-1&intent=signup"]) {
    assert.equal(googleEmailProof(query), null);
  }
});
