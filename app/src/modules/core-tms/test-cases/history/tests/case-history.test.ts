import assert from "node:assert/strict";
import test from "node:test";
import { listCaseHistory } from "../data/case-history-api";
import type { TmsHttpClient } from "../../../../../core/tms/transport/http";
test("history queries the exact case and preserves author identity across pages", async () => {
 const urls: string[] = []; const controller = new AbortController();
 const event = { id:"event-1",workspaceId:"workspace",projectId:"project",entityType:"test_case",entityId:"case",entityKey:"CASE-1",actor:"QA",actorIdentityId:"identity-qa",action:"test_case.revised",createdAt:"2026-09-10T00:00:00Z" };
 const http = { get: async (url: string, signal: AbortSignal) => { urls.push(url); assert.equal(signal,controller.signal); return { data:[event],meta:{hasMore:urls.length===1,nextCursor:urls.length===1?"next":null} }; } } as unknown as TmsHttpClient;
 const first = await listCaseHistory(http,"workspace","project","case",null,controller.signal);
 assert.equal(first.items[0]?.actorIdentityId,"identity-qa"); assert.equal(first.nextCursor,"next");
 const second = await listCaseHistory(http,"workspace","project","case",first.nextCursor,controller.signal);
 assert.equal(second.nextCursor,null);
 const query = new URL(urls[0]!,"https://falcon.test").searchParams;
 assert.equal(query.get("entityType"),"test_case");assert.equal(query.get("entityId"),"case");assert.equal(query.get("workspaceId"),"workspace");assert.equal(query.get("projectId"),"project");
 assert.equal(new URL(urls[1]!,"https://falcon.test").searchParams.get("cursor"),"next");
 const wrong = { get: async()=>({data:[{...event,workspaceId:"another-company"}],meta:{hasMore:false}}) } as unknown as TmsHttpClient;
 await assert.rejects(listCaseHistory(wrong,"workspace","project","case",null,controller.signal),/scope/);
});
