import assert from "node:assert/strict";
import test from "node:test";
import { createSecurityPreviewClient } from "../security-preview-client";
import { createAdministrationClient } from "../../../company-administration/data/administration-client";
import { AdministrationError } from "../../../company-administration/domain/administration";
import { createSignInClient } from "../../../auth/sign-in/data/sign-in-client";

void test("sample security data reaches the production clients without an external request", async () => {
  const fixture = createSecurityPreviewClient(true);
  const profile = await createAdministrationClient(fixture.http).profile(new AbortController().signal);
  assert.equal(profile.id, "sample-security-person"); assert.equal(profile.mfaEnabled, true);
  const sessions = await createAdministrationClient(fixture.http).sessions(null, new AbortController().signal);
  assert.equal(sessions.items.length, 4); assert.equal(sessions.items.filter(item => item.current).length, 1);
  assert.equal(sessions.nextCursor, null);
  const methods = await createSignInClient(fixture.fetch, undefined, { scopeWorkspace: false }).methods();
  assert.equal(methods.google, true);
  assert.equal((await createAdministrationClient(createSecurityPreviewClient(false).http).profile(new AbortController().signal)).mfaEnabled, false);
});

void test("preview rejects credential changes, revocation and OAuth redirects and keeps sample data unchanged", async () => {
  const fixture = createSecurityPreviewClient(false), client = createAdministrationClient(fixture.http);
  await assert.rejects(client.password({ currentPassword: "sample-current", newPassword: "sample-next-password" }, new AbortController().signal),
    error => error instanceof AdministrationError && error.code === "ACCESS_DENIED");
  await assert.rejects(client.revokeSession("sample-old-desktop", new AbortController().signal));
  await assert.rejects(createSignInClient(fixture.fetch, undefined, { scopeWorkspace: false }).startGoogle("link"));
  assert.equal((await client.sessions(null, new AbortController().signal)).items.length, 4);
  assert.equal((await fixture.fetch("https://real.example/api/v1/profile")).status, 403);
  assert.equal((await fixture.fetch("/api/v1/company")).status, 403);
});

void test("aborted preview reads never return sample protected data", async () => {
  const fixture = createSecurityPreviewClient(false), controller = new AbortController(); controller.abort();
  await assert.rejects(fixture.fetch("/api/v1/profile", { signal: controller.signal }), { name: "AbortError" });
});
