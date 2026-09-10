import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

test("push only displays for the signed-in owner and an enabled destination on this tenant origin",async()=>{
 const source=await readFile("public/falcon/notifications/worker.js","utf8");
 const shown:unknown[]=[];const handlers:Record<string,(event:unknown)=>void>={};
 let current={identityId:"anna",browsers:[{id:"browser-a"}]};
 vm.runInNewContext(source,{URL,URLSearchParams,fetch:async()=>({ok:true,json:async()=>({data:current})}),
  self:{location:{origin:"https://a.example.com"},addEventListener:(name:string,fn:(e:unknown)=>void)=>{handlers[name]=fn;},
   registration:{showNotification:async(...args:unknown[])=>{shown.push(args);}}}});
 const message={workspaceId:"a",identityId:"anna",destinationId:"browser-a",title:"Run started",body:"Smoke",tag:"event-1",url:"https://a.example.com/testcases/umbrella-home/work/?workspaceId=a"};
 async function push(value:unknown){let pending:Promise<void>|undefined;handlers.push({data:{json:()=>value},waitUntil:(p:Promise<void>)=>{pending=p;}});await pending;}
 await push(message);assert.equal(shown.length,1);
 current={identityId:"bob",browsers:[{id:"browser-a"}]};await push(message);assert.equal(shown.length,1);
 current={identityId:"anna",browsers:[]};await push(message);assert.equal(shown.length,1);
 current={identityId:"anna",browsers:[{id:"browser-a"}]};await push({...message,url:"https://evil.example.com/testcases/"});assert.equal(shown.length,1);
});
