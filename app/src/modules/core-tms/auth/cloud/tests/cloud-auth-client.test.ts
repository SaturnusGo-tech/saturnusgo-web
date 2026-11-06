import assert from "node:assert/strict";
import test from "node:test";
import {
  cloudWorkspacePath,
  cloudWorkspacePathFromLocation,
  loginCloudAccount,
  logoutCloudSession,
  readCloudSession,
  registerCloudAccount,
  type CloudSession,
} from "../cloud-auth-client";

const session: CloudSession = {
  authenticated: true,
  identity: {
    id: "identity-1",
    givenName: "Анна",
    familyName: "Соколова",
    email: "anna@example.test",
    phone: "+79990000000", emailVerificationStatus: "unverified", phoneVerificationStatus: "unverified",
  },
  workspace: { id: "workspace-1", name: "Пространство Анны", slug: "anna" },
  membership: { role: "workspace_admin" },
  defaultProject: { id: "project-1", name: "Первый проект", slug: "first" },
  defaultEnvironment: { id: "environment-1", name: "Основное" },
};

test("cloud account requests use the private session cookie and stable workspace shell", async () => {
  const originalFetch = globalThis.fetch;
  const originalBase = process.env.NEXT_PUBLIC_TMS_API_BASE;
  const calls: Array<{ url: string; init: RequestInit }> = [];
  process.env.NEXT_PUBLIC_TMS_API_BASE = "https://api.example.test/api/v1/";
  globalThis.fetch = (async (input, init = {}) => {
    calls.push({ url: String(input), init });
    return new Response(JSON.stringify({ data: session }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }) as typeof fetch;

  try {
    await registerCloudAccount({
      givenName: "Анна",
      familyName: "Соколова",
      email: "anna@example.test",
      phone: "+79990000000",
      password: "длинная парольная фраза",
      termsAccepted: true,
    }, "operation-1");
    await loginCloudAccount("anna@example.test", "длинная парольная фраза");
    await readCloudSession();
    await logoutCloudSession();

    assert.equal(calls[0].url, "https://api.example.test/api/v1/cloud-auth/register");
    assert.equal(calls[0].init.credentials, "include");
    assert.equal(calls[0].init.redirect, "error");
    assert.equal(new Headers(calls[0].init.headers).get("Idempotency-Key"), "operation-1");
    assert.equal(JSON.parse(String(calls[0].init.body)).termsAccepted, true);
    assert.equal(calls[1].url, "https://api.example.test/api/v1/cloud-auth/login");
    assert.equal(calls[1].init.credentials, "include");
    assert.deepEqual(JSON.parse(String(calls[1].init.body)), {
      email: "anna@example.test",
      password: "длинная парольная фраза",
    });
    assert.equal(calls[2].url, "/api/v1/cloud-auth/session");
    assert.equal(calls[3].url, "/api/v1/cloud-auth/logout");
    assert.equal(calls[3].init.credentials, "include");
    assert.equal(calls[2].init.method, "GET");
    assert.equal(
      cloudWorkspacePath(session),
      "/testcases/umbrella-home/work/?workspaceId=workspace-1&projectId=project-1",
    );
    assert.equal(
      cloudWorkspacePathFromLocation({
        pathname: "/testcases/umbrella-home/work/",
        search: "?caseId=case-1",
        hash: "#overview",
      } as Location, session),
      "/testcases/umbrella-home/work/?caseId=case-1&workspaceId=workspace-1&projectId=project-1#overview",
    );
  } finally {
    globalThis.fetch = originalFetch;
    if (originalBase === undefined) delete process.env.NEXT_PUBLIC_TMS_API_BASE;
    else process.env.NEXT_PUBLIC_TMS_API_BASE = originalBase;
  }
});
test("cloud session accepts boolean or absent handoff capability and rejects a malformed discriminator",async()=>{
 const previous=globalThis.fetch;
 try{
  for(const capability of [undefined,false,true]){
   globalThis.fetch=async()=>Response.json({data:{...session,...(capability===undefined?{}:{workspaceHandoff:capability})}});
   const result=await readCloudSession();assert.equal(result.authenticated,true);
   if(result.authenticated)assert.equal(result.workspaceHandoff,capability);
  }
  for(const capability of ["true",null,{},1]){
   globalThis.fetch=async()=>Response.json({data:{...session,workspaceHandoff:capability}});
   await assert.rejects(readCloudSession(),{status:502});
  }
 }finally{globalThis.fetch=previous;}
});
