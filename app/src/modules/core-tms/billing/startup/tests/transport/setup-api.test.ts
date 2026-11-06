import assert from "node:assert/strict";
import { test } from "node:test";
import { createTmsHttpClient } from "../../../../../../core/tms/transport/http";
import { createStartupSetupApi } from "../../data/startup-setup-api";
import { createBillingApi } from "../../../data/http/billing-api";
test("setup saves use PUT with explicit scope, version and retry identity; checkout binds the confirmed setup", async () => {
  const calls: { path: string; method: string; body: Record<string, unknown>; headers: Headers }[] = [];
  const http = createTmsHttpClient({ apiBase: "https://tms.test/api/v1", credentials: "include", fetch: async (input, init) => {
    calls.push({ path: new URL(String(input)).pathname, method: init!.method!, body: JSON.parse(String(init!.body)), headers: new Headers(init!.headers) });
    return Response.json({ data: { setup: { id: "setup", version: 3, status: "ready" } } });
  } });
  const setup = createStartupSetupApi(http), signal = new AbortController().signal;
  await setup.save("space", { displayName: "Team", slug: "team" }, 2, "same-save", signal);
  assert.equal(calls[0].method, "PUT"); assert.equal(calls[0].body.expectedVersion, 2); assert.equal(calls[0].body.workspaceId, "space");
  assert.equal(calls[0].body.idempotencyKey, "same-save"); assert.equal(calls[0].headers.get("idempotency-key"), "same-save");
  await createBillingApi(http).execute("space", { kind: "checkout", planId: "startup", startupSetupId: "setup", startupSetupVersion: 3, confirmWorkspaceConversion: true }, { idempotencyKey: "checkout" });
  assert.deepEqual(calls[1].body, { workspaceId: "space", planId: "startup", startupSetupId: "setup", startupSetupVersion: 3, confirmWorkspaceConversion: true });
});
test("company setup explicitly sends the Falcon language captured when its flow began",async()=>{
 let body:Record<string,unknown>|undefined;
 const http=createTmsHttpClient({apiBase:"https://tms.test/api/v1",credentials:"include",fetch:async(_input,init)=>{
  body=JSON.parse(String(init?.body));return Response.json({data:{setup:{id:"setup",version:1,status:"reserved"}}});
 }});
 await createStartupSetupApi(http,"ru").save("space",{displayName:"Team",slug:"team"},null,"save",new AbortController().signal);
 assert.equal(body?.locale,"ru");
});
