import assert from "node:assert/strict";
import test from "node:test";
import { createTmsHttpClient } from "../../../../../core/tms/transport/http";
import { listWorkspaceMembers } from "../../../workspace/members/data/member-api";
import { requestWorkspaceActor } from "../../../workspace/members/data/actors/request-workspace-actor";
test("active assignment and historical resolution share typed catalog, including renamed inactive Codex", async () => {
    const paths: string[] = [];
    const agent = { identityId: "agent", kind: "agent", provider: "codex", name: "Codex", status: "inactive" };
    const human = { identityId: "human", kind: "human", name: "Codex", email: "human@test" };
    const http = createTmsHttpClient({ apiBase: "https://company.test/api/v1", credentials: "include", fetch: async (input) => {
            paths.push(String(input));
            const q = new URL(String(input)).searchParams;
            return Response.json({ data: q.get("identityId") ? [agent] : [human, { ...agent, status: "active" }], meta: { hasMore: false, nextCursor: null, limit: 100 } });
        } });
    const historical = await requestWorkspaceActor(http, "workspace", "agent", new AbortController().signal);
    assert.equal(historical?.kind, "agent");
    assert.equal(historical?.provider, "codex");
    const members = await listWorkspaceMembers(http, "workspace", "", null);
    assert.equal(members.items[0].kind, "human");
    assert.equal(members.items[1].kind, "agent");
    assert.equal("email" in members.items[1], false);
    assert.ok(paths.every(path => new URL(path).pathname.endsWith("/actors")));
    assert.equal(new URL(paths[1]).searchParams.get("eligible"), "true");
});
