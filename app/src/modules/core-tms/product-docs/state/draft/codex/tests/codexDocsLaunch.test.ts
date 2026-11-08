import assert from "node:assert/strict";
import test from "node:test";
import { createTmsHttpClient } from "../../../../../../../core/tms/transport/http";
import { createCodexEmployeeApi } from "../../../../../codex-employee/data/http/codex-employee-api";
import type { PersonalCodexConnection } from "../../../../../codex-employee/domain/model/codex-employee";
import { codexBrowserAddress, codexSetupAddress, projectCodexStatus } from "../codexDocsLaunch";

const expiry = "2026-12-31T00:00:00.000Z";
const now = Date.parse("2026-11-08T00:00:00.000Z");
const grant: PersonalCodexConnection = { id: "codex", projectIds: ["project-1"], scopes: ["falcon:read"],
  createdAt: "2026-01-01T00:00:00.000Z", expiresAt: expiry, revokedAt: null };

test("the Codex editor action uses a live grant for this project", () => {
  assert.equal(projectCodexStatus([grant], "project-1", now), "read-only");
  const writer: PersonalCodexConnection = { ...grant, scopes: [...grant.scopes, "falcon:product-docs:write"] };
  assert.equal(projectCodexStatus([grant, writer], "project-1", now), "connected");
  assert.equal(projectCodexStatus([writer], "other-project", now), "available");
  assert.equal(projectCodexStatus([{ ...writer, revokedAt: expiry }], "project-1", now), "available");
  assert.equal(projectCodexStatus([{ ...writer, expiresAt: "2026-01-02T00:00:00Z" }], "project-1", now), "available");
  assert.equal(projectCodexStatus([{ ...writer, scopes: ["falcon:cases:create"] }], "project-1", now), "available");
});

test("launch opens an unsent generic prompt while setup keeps the current workspace scope", () => {
  const launch = new URL(codexBrowserAddress("ru"));
  assert.equal(launch.protocol, "codex:");
  assert.equal(launch.host, "threads");
  assert.equal(launch.pathname, "/new");
  assert.match(launch.searchParams.get("prompt") ?? "", /manage-product-docs/);
  const setup = new URL(codexSetupAddress(
    "https://acme-falcon.saturnusgo.com/work/?view=product-docs&docId=private-doc#private-heading",
    { workspaceId: "w", projectId: "p" }, "ru",
  ));
  assert.equal(setup.search, "?workspaceId=w&projectId=p&view=hooks&integration=codex&lang=ru");
  assert.equal(setup.hash, "");
});

test("grant discovery follows the scoped connection cursor until all projects are checked", async () => {
  const calls: URL[] = [];
  const http = createTmsHttpClient({ apiBase: "https://tenant.example/api/v1", credentials: "include", fetch: async (input) => {
    const url = new URL(String(input));
    calls.push(url);
    return url.searchParams.has("cursor")
      ? Response.json({ data: [grant], meta: { nextCursor: null } })
      : Response.json({ data: [], meta: { nextCursor: "second+page" } });
  } });
  const result = await createCodexEmployeeApi(http).connections(new AbortController().signal, "workspace-test");
  assert.equal(projectCodexStatus(result, "project-1", now), "read-only");
  assert.deepEqual(calls.map((url) => [url.pathname, url.searchParams.get("workspaceId"), url.searchParams.get("cursor")]), [
    ["/api/v1/profile/mcp-connections", "workspace-test", null],
    ["/api/v1/profile/mcp-connections", "workspace-test", "second+page"],
  ]);
});
