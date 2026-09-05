import assert from "node:assert/strict";
import test from "node:test";
import type { CloudSession } from "../cloud-auth-client";
import { resolveCloudSessionProbe } from "../cloud-session-probe";

const cloudSession: CloudSession = {
  authenticated: true,
  identity: { id: "identity-1", givenName: "Анна", familyName: "Соколова", email: "anna@example.test", phone: "+79990000000" },
  workspace: { id: "workspace-1", name: "Анна", slug: "anna" },
  membership: { role: "workspace_admin" },
  defaultProject: { id: "project-1", name: "Первый проект", slug: "first" },
  defaultEnvironment: { id: "environment-1", name: "Основное" },
};

test("uses the cloud gate only for an authenticated cloud session", async () => {
  assert.deepEqual(await resolveCloudSessionProbe(async () => cloudSession), {
    stage: "cloud",
    session: cloudSession,
  });
});

test("preserves the legacy admin path for an explicit unauthenticated response", async () => {
  assert.deepEqual(await resolveCloudSessionProbe(async () => ({ authenticated: false })), {
    stage: "admin",
  });
});

test("keeps probe failures recoverable instead of misrouting them to Auth0", async () => {
  assert.deepEqual(await resolveCloudSessionProbe(async () => {
    throw new Error("network unavailable");
  }), { stage: "unavailable" });
});
