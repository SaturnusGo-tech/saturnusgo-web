import assert from "node:assert/strict";
import { test } from "node:test";
import { workspaceHandoffNavigation } from "../domain/handoff-policy";
const href="https://tms.saturnusgo.com/testcases/umbrella-home/work/?workspaceId=space&projectId=project&view=config&settings=billing&token=secret#fragment";
const target={workspaceId:"space",generation:4,destinationOrigin:"https://team-falcon.saturnusgo.com"};
test("browser handoff starts with a same-origin form and preserves only scoped route and locale",()=>{
 const result=workspaceHandoffNavigation(target,"space",href,"ru",false)!;
 assert.equal(result.kind,"browser"); if(result.kind!=="browser")return;
 assert.equal(result.action,"https://tms.saturnusgo.com/api/v1/auth/workspace-handoffs");
 assert.deepEqual(result.fields,{workspaceId:"space",destinationOrigin:target.destinationOrigin,locale:"ru",route:"/testcases/umbrella-home/work/?workspaceId=space&projectId=project&view=config&settings=billing&lang=ru"});
 assert.equal(JSON.stringify(result).includes("secret"),false); assert.equal(JSON.stringify(result).includes("code"),false);
});
test("desktop hands only the exact scoped request to its same-origin native navigation bridge",()=>{
 const result=workspaceHandoffNavigation(target,"space",href,"ru",true)!;assert.equal(result.kind,"desktop");if(result.kind!=="desktop")return;
 const command=new URL(result.url);assert.equal(command.origin,"https://tms.saturnusgo.com");assert.equal(command.pathname,"/desktop-workspace-transition/");
 assert.equal(command.searchParams.get("destinationOrigin"),target.destinationOrigin);assert.equal(command.searchParams.get("workspaceId"),"space");
 assert.equal(command.searchParams.get("locale"),"ru");assert.equal(command.searchParams.has("code"),false);
});
test("foreign workspace, forged origin and invalid generations fail closed; the current origin never loops",()=>{
 for(const change of [{workspaceId:"other"},{generation:0},{generation:1.5},{destinationOrigin:"https://evil.test"},{destinationOrigin:"https://team-falcon.saturnusgo.com/path"},{destinationOrigin:"https://user@team-falcon.saturnusgo.com"}]) assert.throws(()=>workspaceHandoffNavigation({...target,...change},"space",href,"en",false));
 assert.equal(workspaceHandoffNavigation({...target,destinationOrigin:"https://tms.saturnusgo.com"},"space",href,"en",false),null);
});
test("company setup handoff opens scoped company administration through the same verified browser and desktop transfer",()=>{
 for(const desktop of [false,true]) {
  const result=workspaceHandoffNavigation(target,"space",href,"ru",desktop,"company_admin")!;
  const fields=result.kind==="browser"?result.fields:Object.fromEntries(new URL(result.url).searchParams);
  assert.equal(fields.route,"/admin/?account=personal&workspaceId=space&page=company&projectId=project&lang=ru");
  assert.equal(fields.destinationOrigin,"https://team-falcon.saturnusgo.com");
 }
});
