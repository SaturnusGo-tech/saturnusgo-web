import assert from "node:assert/strict";
import test from "node:test";
import { createTmsHttpClient } from "../../../../../core/tms/transport/http";
import { listExecutionHistory } from "../../execution-history/data/execution-history-api";
const scope = { workspaceId: "w", projectId: "p", runId: "r", itemId: "i", attemptNo: 2 };
test("execution history rejects another attempt/step/run and keeps load-more explicit", async () => {
    let path = "";
    let event = { id: "e", ...scope, kind: "retest_started", status: "not_run", actor: "Codex", actorIdentityId: "agent", actorKind: "agent", actorProvider: "codex", createdAt: "2026-11-01T00:00:00Z", initiatedBy: { identityId: "human", name: "Alex" } };
    const http = createTmsHttpClient({ apiBase: "https://company.test/api/v1", credentials: "include", fetch: async (input) => { path = String(input); return Response.json({ data: [event], meta: { hasMore: true, nextCursor: "opaque", limit: 30 } }); } });
    const page = await listExecutionHistory(http, scope, null, new AbortController().signal);
    assert.equal(page.nextCursor, "opaque");
    assert.equal(page.items[0].kind, "retest_started");
    assert.equal(new URL(path).searchParams.get("attemptNo"), "2");
    event = { ...event, attemptNo: 1 };
    await assert.rejects(listExecutionHistory(http, scope, null, new AbortController().signal));
});
