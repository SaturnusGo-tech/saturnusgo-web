import assert from "node:assert/strict";
import test from "node:test";
import {createTmsHttpClient} from "../../../../../core/tms/transport/http";
import {supportClient} from "../../data/support-client";
import type {SupportInput} from "../../domain/support";
const input:SupportInput={kind:"question",topic:"other",subject:"Support question",description:"Describe the problem",pageUrl:"https://falcon.example/",files:[]};
test("support uses the production transport's unwrapped receipt and upload responses",async()=>{
 const calls:string[]=[];let accepted=false;
 const http=createTmsHttpClient({apiBase:"https://api.example.test/api/v1",production:true,credentials:"include",fetch:async(url,init)=>{
  const path=String(url);calls.push(path);
  if(path.includes("/uploads"))return Response.json({data:{files:[]}});
  if(path.includes("/submit")){accepted=true;return Response.json({data:{id:"request-id",state:"queued",reference:null}});}
  assert.equal(new Headers(init?.headers).get("Idempotency-Key"),"request-id");
  return Response.json({data:{id:"request-id",state:accepted?"queued":"draft",reference:null}});
 }});
 const client=supportClient(http,"tenant-a");
 assert.deepEqual(await client.send("request-id",input,[],()=>{}),{id:"request-id",state:"queued",reference:null});
 assert.equal(calls.length,3);assert.ok(calls.every(path=>path.includes("workspaceId=tenant-a")));
 await client.send("request-id",input,[],()=>{});assert.equal(calls.length,4);
});
