import assert from "node:assert/strict";
import test from "node:test";
import { createTmsHttpClient } from "../../../../core/tms/transport/http";
import { createProject, updateProject } from "./createProject";

const project = { id: "project-1", workspaceId: "workspace-1", key: "PAY", name: "Payments", description: "Payment checks", status: "active" as const,
  testingPlan: "Acceptance criteria", portfolioId: "portfolio-1", responsibleIdentityId: "identity-1", rowVersion: 2, createdAt: "2026-09-09T00:00:00Z", updatedAt: "2026-09-09T00:00:00Z" };

function client(requests: { url: string; init?: RequestInit }[]) {
  return createTmsHttpClient({ apiBase: "https://api.example.test/api/v1", accessToken: async () => "test.token.value",
    fetch: (async (url, init) => { requests.push({ url: String(url), init });
      return new Response(JSON.stringify({ data: project }), { status: 200, headers: { "content-type": "application/json", etag: '"project:project-1:2"' } });
    }) as typeof fetch });
}

test("creating a project is one command and does not require or create an environment", async () => {
  const requests: { url: string; init?: RequestInit }[] = [];
  const result = await createProject({ http: client(requests), workspaceId: "workspace-1", name: " Payments ", key: " pay ",
    description: " Payment checks ", testingPlan: " Acceptance criteria ", portfolioId: "portfolio-1", responsibleIdentityId: "identity-1", offline: false, operationKey: "stable-project-operation" });
  assert.equal(result.ok, true);
  assert.equal(requests.length, 1);
  assert.ok(requests[0].url.endsWith("/projects"));
  assert.deepEqual(JSON.parse(String(requests[0].init?.body)), { workspaceId: "workspace-1", name: "Payments", key: "PAY", description: "Payment checks", testingPlan: "Acceptance criteria", portfolioId: "portfolio-1", responsibleIdentityId: "identity-1" });
  assert.equal(new Headers(requests[0].init?.headers).get("Idempotency-Key"), "stable-project-operation");
  if (result.ok) { assert.equal(result.project.portfolioId, "portfolio-1"); assert.equal(result.etag, '"project:project-1:2"'); }
});

test("standalone projects send explicit unassigned metadata", async () => {
  const requests: { url: string; init?: RequestInit }[] = [];
  await createProject({ http: client(requests), workspaceId: "workspace-1", name: "Payments", key: "PAY", description: "", offline: false, operationKey: "stable-project-operation" });
  const body = JSON.parse(String(requests[0].init?.body));
  assert.equal(body.portfolioId, null); assert.equal(body.responsibleIdentityId, null);
});

test("offline project creation cannot fabricate a local production project", async () => {
  const requests: { url: string; init?: RequestInit }[] = [];
  const result = await createProject({ http: client(requests), workspaceId: "workspace-1", name: "Payments", key: "PAY", description: "", offline: true, operationKey: "stable-project-operation" });
  assert.equal(result.ok, false); assert.equal(requests.length, 0);
});

test("editing metadata retains the immutable key and protects concurrent changes", async () => {
  const requests: { url: string; init?: RequestInit }[] = [];
  const result = await updateProject({ http: client(requests), project, etag: '"project:project-1:1"', offline: false,
    name: " Updated ", key: "IGNORED", description: " Checks ", portfolioId: null, responsibleIdentityId: null, operationKey: "stable-project-update" });
  assert.deepEqual(JSON.parse(String(requests[0].init?.body)), { name: "Updated", description: "Checks", portfolioId: null, responsibleIdentityId: null });
  assert.equal(new Headers(requests[0].init?.headers).get("If-Match"), '"project:project-1:1"');
  assert.equal(result.etag, '"project:project-1:2"');
});

test("editing can clear the testing plan independently from the description", async () => {
  const requests: { url: string; init?: RequestInit }[] = [];
  await updateProject({ http: client(requests), project, etag: '"project:project-1:1"', offline: false,
    name: project.name, key: project.key, description: project.description, testingPlan: " ", operationKey: "stable-project-update" });
  const body = JSON.parse(String(requests[0].init?.body));
  assert.equal(body.description, project.description); assert.equal(body.testingPlan, "");
  assert.equal(new Headers(requests[0].init?.headers).get("If-Match"), '"project:project-1:1"');
});

test("missing update version never sends a mutation", async () => {
  const requests: { url: string; init?: RequestInit }[] = [];
  await assert.rejects(updateProject({ http: client(requests), project, etag: null, offline: false,
    name: "Updated", key: "PAY", description: "Checks", operationKey: "stable-project-update" }), /ETag/);
  assert.equal(requests.length, 0);
});
