import { test } from "node:test";
import assert from "node:assert/strict";
import { createTmsHttpClient, TmsApiError } from "../../http";

test("binary uploads retain authentication, cancellation and raw image bytes", async () => {
  const controller = new AbortController(), body = new Blob([new Uint8Array([1, 2, 3])], {type:"image/heic"});
  const client = createTmsHttpClient({ apiBase:"https://api.example.com/api/v1", accessToken:async()=>"test-token",
    fetch:async (url, init) => {
      assert.equal(String(url),"https://api.example.com/api/v1/images");
      assert.equal(init?.body,body); assert.equal(init?.signal,controller.signal);
      assert.equal(new Headers(init?.headers).get("authorization"),"Bearer test-token");
      assert.equal(new Headers(init?.headers).get("content-type"),"image/heic");
      assert.equal(init?.redirect,"error"); assert.equal(init?.cache,"no-store");
      return new Response(body,{headers:{"content-type":"image/png","x-content-sha256":"digest"}});
    } });
  const response=await client.binary!("/images",body,controller.signal);
  assert.equal(response.headers.get("x-content-sha256"),"digest");
  assert.deepEqual([...new Uint8Array(await response.arrayBuffer())],[1,2,3]);
});
test("binary failures use the same typed API error path", async () => {
  const client=createTmsHttpClient({apiBase:"https://api.example.com/api/v1",credentials:"include",fetch:async()=>
    new Response(JSON.stringify({error:{code:"VALIDATION_ERROR",message:"Unsupported image",requestId:"request-1"}}),{status:422})});
  await assert.rejects(()=>client.binary!("/images",new Blob()), (error:unknown)=>
    error instanceof TmsApiError && error.status===422 && error.requestId==="request-1");
});
