import assert from "node:assert/strict";
import test from "node:test";
import { createTmsHttpClient } from "../../../../../core/tms/transport/http";
import { createLayoutSource } from "../data/layout-source";
import { createBoardWidget, widgetCatalog, widgetKey } from "../model/widget-catalog";
import { LayoutError } from "../model/layout";

const scope={workspaceId:"w",projectId:"p"};
const widget=createBoardWidget(widgetCatalog[0],"en","widget");
const dto={...scope,id:"board",name:"QA",description:"",isDefault:true,status:"active",widgets:[widget]};
function client(handler:(url:string,init:RequestInit)=>Response|Promise<Response>) {
  return createTmsHttpClient({apiBase:"https://tms.example/api/v1",credentials:"include",fetch:async(url,init)=>handler(String(url),init!)});
}
test("loads project-owned dashboard with explicit server scope, full layout and ETag",async()=>{
  const paths:string[]=[];
  const source=createLayoutSource(client((url)=>{paths.push(url);return new Response(JSON.stringify(url.includes("?") ?
    {data:[dto],meta:{nextCursor:null}}:{data:dto}),{headers:{etag:'"dashboard:board:3"'}});}));
  const board=await source.load(scope,new AbortController().signal);
  assert.match(paths[0],/projectOnly=true/);assert.match(paths[0],/projectId=p/);
  assert.equal(board?.etag,'"dashboard:board:3"');assert.deepEqual(board?.widgets[0],widget);
});
test("rejects another project and does not silently treat denied access as an empty dashboard",async()=>{
  const wrong=createLayoutSource(client(()=>new Response(JSON.stringify({data:[{...dto,projectId:"other"}],meta:{nextCursor:null}}))));
  await assert.rejects(wrong.load(scope,new AbortController().signal),(e:unknown)=>e instanceof LayoutError&&e.kind==="invalid");
  const denied=createLayoutSource(client(()=>new Response(JSON.stringify({error:{code:"FORBIDDEN"}}),{status:403})));
  await assert.rejects(denied.load(scope,new AbortController().signal),(e:unknown)=>e instanceof LayoutError&&e.kind==="permission");
});
test("writes the project binding only at creation and protects updates with ETag and idempotency",async()=>{
  const requests:RequestInit[]=[];
  const source=createLayoutSource(client((_,init)=>{requests.push(init);return new Response(JSON.stringify({data:dto}),{headers:{etag:'"dashboard:board:1"'}});}));
  const saved=await source.save(scope,null,{name:"QA",widgets:[widget]},"create-key");
  await source.save(scope,saved,{name:"Changed",widgets:[]},"update-key");
  assert.equal(JSON.parse(String(requests[0].body)).projectId,"p");
  assert.equal(JSON.parse(String(requests[1].body)).projectId,undefined);
  assert.equal(new Headers(requests[1].headers).get("if-match"),'"dashboard:board:1"');
  assert.equal(new Headers(requests[1].headers).get("idempotency-key"),"update-key");
});
test("every catalog entry is independently serializable with a stable identity",()=>{
  assert.equal(new Set(widgetCatalog.map(w=>w.key)).size,widgetCatalog.length);
  for(const entry of widgetCatalog) {
    const widget=createBoardWidget(entry,"ru",entry.key);
    assert.equal(widgetKey(widget),entry.key);assert.equal(widget.title,entry.ru);
    assert.ok(entry.ru && entry.en && entry.hintRu && entry.hintEn);
  }
});
