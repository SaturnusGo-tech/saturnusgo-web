import assert from "node:assert/strict";
import test from "node:test";
import { createTmsHttpClient } from "../../../../../core/tms/transport/http";
import { createLayoutSource } from "../data/layout-source";
import { createBoardWidget, widgetCatalog, widgetKey } from "../model/widget-catalog";
import { defaultPreferences, parsePreferences, preferenceKey } from "../preferences/preferences";
import { dashboardSections, widgetSection } from "../sections/widget-sections";
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

test("catalog exposes 29 widgets in four meaningful sections without obsolete freshness signals",()=>{
  assert.equal(widgetCatalog.length,29);
  assert.deepEqual(dashboardSections.map(section=>widgetCatalog.filter(item=>widgetSection(item.key)===section).length),[3,7,11,8]);
  for(const key of ["activeRuns","blockedItems","openDefects","notRunItems","inProgressItems","outdatedItems","runsWithoutBuild"])
    assert.ok(!widgetCatalog.some(item=>item.key===key));
});

test("malformed preference payloads cannot replace safe defaults",()=>{
  for(const raw of [null,"","broken","null","42","true",'"runs"',"[]","[{}]"])
    assert.deepEqual(parsePreferences(raw),defaultPreferences);
  assert.deepEqual(parsePreferences(JSON.stringify({section:"unknown",period:"14d",filtersOpen:"true",
    environmentId:{id:"env"},buildReference:99,queueTab:"unknown",freshnessPage:-1})),defaultPreferences);
  assert.deepEqual(parsePreferences(JSON.stringify({section:["runs"],period:["7d"]})),defaultPreferences);
  assert.deepEqual(parsePreferences(JSON.stringify({section:{value:"runs"},period:{value:"7d"}})),defaultPreferences);
  assert.deepEqual(parsePreferences(JSON.stringify({environmentId:"x".repeat(201),buildReference:"x".repeat(501)})),defaultPreferences);
  const restored=parsePreferences(null);restored.section="all";assert.equal(defaultPreferences.section,"overview");
});

test("valid preferences round-trip while unknown properties and coercible values are discarded",()=>{
  const valid={section:"defects" as const,period:"90d" as const,filtersOpen:true,environmentId:"e".repeat(200),
    buildReference:"b".repeat(500),queueTab:"readyForRetest" as const,freshnessPage:1};
  assert.deepEqual(parsePreferences(JSON.stringify({...valid,untrusted:"ignored"})),valid);
  assert.deepEqual(parsePreferences(JSON.stringify({...valid,filtersOpen:1,freshnessPage:"1"})),
    {...valid,filtersOpen:false,freshnessPage:0});
  for(const section of ["all",...dashboardSections])
    assert.equal(parsePreferences(JSON.stringify({section})).section,section);
});

test("preferences use separate account, workspace and project keys, including delimiter-like IDs",()=>{
  const keys=[];
  for(const subject of [null,"null","","alice","bob","a:b"])
    for(const workspace of ["w","w:p","w/other"])
      for(const project of ["p","p:w",'p"other']) keys.push(preferenceKey(subject,workspace,project));
  assert.equal(new Set(keys).size,keys.length);
  assert.notEqual(preferenceKey("a:b","c","d"),preferenceKey("a","b:c","d"));
  assert.equal(preferenceKey("alice","workspace","project"),preferenceKey("alice","workspace","project"));
});
