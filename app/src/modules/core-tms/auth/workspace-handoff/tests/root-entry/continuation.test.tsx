import assert from "node:assert/strict";
import {createRequire} from "node:module";
import {test,type TestContext} from "node:test";
import React from "react";
import {act,create,type ReactTestRenderer} from "react-test-renderer";
import {TmsLocaleContext} from "../../../../localization/context/TmsLocaleProvider";
import {CONTINUATION_KEY} from "../../../continuation/application/continuation-storage";
import {DESKTOP_ATTEMPT_KEY} from "../../../continuation/desktop/attempt-storage";
import {clearBrowserDesktopAttempt} from "../../../continuation/desktop/browser-desktop-attempt";
import type {CloudSession} from "../../../cloud/cloud-auth-client";

async function page(t:TestContext,mode:"company"|"preparing"|"personal"|"denied"|"legacy"|"reauth",{saved=true,desktop=false,entryPath="/testcases/umbrella-home/work/",legacyCapability="",savedPath="/testcases/umbrella-home/work/?workspaceId=space&view=config&settings=billing"}={}) {
 const require=createRequire(import.meta.url),css=require.extensions[".css"];
 require.extensions[".css"]=module=>{module.exports={};};
 const reactDom=require("react-dom"),portal=Object.getOwnPropertyDescriptor(reactDom,"createPortal")!;
 Object.defineProperty(reactDom,"createPortal",{configurable:true,value:(content:React.ReactNode)=>content});
 const previous=["window","document","React","fetch"].map(key=>[key,Object.getOwnPropertyDescriptor(globalThis,key)] as const);
 const origin="https://tms.saturnusgo.com",billing="/work/?workspaceId=space&view=config&settings=billing";
 const destinations:string[]=[],requests:string[]=[],forms:{action:string;method:string;fields:Record<string,string>}[]=[],values=new Map<string,string>();
 if(saved)values.set(CONTINUATION_KEY,JSON.stringify({version:1,origin,createdAt:Date.now(),path:savedPath}));
 if(desktop)values.set(DESKTOP_ATTEMPT_KEY,JSON.stringify({version:1,origin,createdAt:Date.now(),attempt:"a".repeat(43)}));
 const location=(path:string)=>Object.assign(new URL(path,origin),{replace:(path:string)=>destinations.push(path),assign:(path:string)=>destinations.push(path)});
 const browser=Object.assign(new EventTarget(),{location:location(entryPath),
  history:{replaceState(_state:unknown,_title:string,path:string){browser.location=location(path);}},
  sessionStorage:{getItem:(key:string)=>values.get(key)??null,removeItem:(key:string)=>values.delete(key)}});
 const document={title:"Falcon",body:{style:{overflow:""},append(){}},createElement(tag:string){
  if(tag==="input")return {type:"",name:"",value:""};
  const fields:Record<string,string>={};return {action:"",method:"",hidden:false,
   append(input:{name:string;value:string}){fields[input.name]=input.value;},remove(){},
   submit(){forms.push({action:this.action,method:this.method,fields});}};
 }};
 Object.assign(globalThis,{React,window:browser,document});
 globalThis.fetch=async input=>{
  const path=String(input);requests.push(path);
  if(path.includes("/auth/workspace-target?")&&(mode==="legacy"||mode==="reauth"))return Response.json({error:{code:"HANDOFF_REAUTHENTICATION_REQUIRED"}},{status:401});
  if(path.includes("/auth/workspace-target?"))return mode==="preparing"||mode==="denied"
   ?Response.json({error:{code:mode==="preparing"?"HANDOFF_TARGET_PREPARING":"HANDOFF_DENIED"}},{status:mode==="preparing"?409:403})
   :Response.json({data:{workspaceId:"space",generation:8,destinationOrigin:mode==="company"?"https://jev-falcon.saturnusgo.com":origin}});
  if(path.endsWith("/me/profile"))return Response.json({data:{id:"owner",name:"Owner",hasAvatar:false,version:1,accountKind:"personal"}});
  if(path.endsWith("/auth/trial"))return Response.json({data:{kind:mode==="personal"?"personal":"company",startsAt:null,expiresAt:null,readOnly:false}});
  return Response.json({data:{}});
 };
 const {LegacyTmsAuthBoundary}=await import("../../../presentation/boundary/LegacyTmsAuthBoundary");
 const session:CloudSession={authenticated:true,identity:{id:"owner",givenName:"Owner",familyName:"",email:"owner@example.test",phone:"",emailVerificationStatus:"verified",phoneVerificationStatus:"unverified"},
  workspace:{id:"space",name:"Company",slug:"company"},membership:{role:"workspace_admin"},
  defaultProject:{id:"project",name:"Project",slug:"project"},defaultEnvironment:{id:"env",name:"Default"}};
 if(legacyCapability!=="missing")Object.assign(session,{workspaceHandoff:legacyCapability!=="false"});
 let view!:ReactTestRenderer,mounted=0;
 function Business(){React.useEffect(()=>{mounted++;},[]);return <div data-business/>;}
 t.after(async()=>{await act(async()=>view?.unmount());clearBrowserDesktopAttempt();
  Object.defineProperty(reactDom,"createPortal",portal);
  if(css)require.extensions[".css"]=css;else delete require.extensions[".css"];
  for(const [key,descriptor]of previous){if(descriptor)Object.defineProperty(globalThis,key,descriptor);else Reflect.deleteProperty(globalThis,key);}
 });
 await act(async()=>{view=create(<TmsLocaleContext.Provider value={{locale:"en",languageTag:"en-US",setLocale(){},t:key=>key}}>
  <LegacyTmsAuthBoundary verifiedSession={session}><Business/></LegacyTmsAuthBoundary></TmsLocaleContext.Provider>);});
 return {view,forms,values,destinations,billing,mounted:()=>mounted,targets:()=>requests.filter(path=>path.includes("/auth/workspace-target?")).length};
}

test("an existing central cloud session discovers its purchased company before rendering the personal shell",async t=>{
 const h=await page(t,"company");
 assert.equal(h.targets(),1);assert.equal(h.mounted(),0);assert.deepEqual(h.destinations,[]);
 assert.deepEqual(h.forms,[{action:"https://tms.saturnusgo.com/api/v1/auth/workspace-handoffs",method:"post",
  fields:{workspaceId:"space",destinationOrigin:"https://jev-falcon.saturnusgo.com",route:"/work/?workspaceId=space&projectId=project&lang=en",locale:"en"}}]);
 assert.equal(h.values.has(CONTINUATION_KEY),false);
});
test("an existing cloud session with a preparing company opens the loader and email notice before the personal shell",async t=>{
 const h=await page(t,"preparing");assert.equal(h.targets(),1);assert.equal(h.mounted(),0);
 assert.equal(h.view.root.findByProps({"data-company-wizard":true}).props["data-stage"],"preparing");
 assert.match(JSON.stringify(h.view.toJSON()),/email/);assert.deepEqual(h.destinations,[]);assert.equal(h.values.has(CONTINUATION_KEY),false);
});
test("a denied company target never falls through to a personal shell or restores billing",async t=>{
 const h=await page(t,"denied");assert.equal(h.targets(),1);assert.equal(h.mounted(),0);assert.deepEqual(h.destinations,[]);
 assert.equal(h.values.has(CONTINUATION_KEY),true);
});
test("an ordinary personal workspace retains its saved checkout continuation",async t=>{
 const h=await page(t,"personal");assert.equal(h.targets(),1);assert.deepEqual(h.destinations,[h.billing]);assert.equal(h.mounted(),0);
});
test("an ordinary personal workspace without a saved return opens normally after target verification",async t=>{
 const h=await page(t,"personal",{saved:false});assert.equal(h.targets(),1);assert.equal(h.mounted(),1);assert.deepEqual(h.destinations,[]);
});
test("an explicit current case keeps priority over a saved checkout after root discovery",async t=>{
 const h=await page(t,"personal",{entryPath:"/testcases/umbrella-home/work/?caseId=current-case"});
 assert.equal(h.targets(),1);assert.equal(h.mounted(),1);assert.deepEqual(h.destinations,[]);assert.equal(h.values.has(CONTINUATION_KEY),false);
});
test("an explicit company case follows its verified alias without restoring the previous billing page",async t=>{
 const h=await page(t,"company",{entryPath:"/testcases/umbrella-home/work/?caseId=current-case"});
 assert.equal(h.targets(),1);assert.equal(h.mounted(),0);assert.deepEqual(h.destinations,[]);
 assert.equal(h.forms[0]?.fields.route,"/work/?workspaceId=space&projectId=project&caseId=current-case&lang=en");
 assert.equal(h.values.has(CONTINUATION_KEY),false);
});
test("desktop proof returns before root workspace discovery and preserves the browser continuation",async t=>{
 const h=await page(t,"company",{desktop:true});assert.equal(h.targets(),0);assert.equal(h.mounted(),0);
 assert.deepEqual(h.destinations,[`/api/v1/auth/desktop/authorize?attempt=${"a".repeat(43)}`]);assert.equal(h.values.has(CONTINUATION_KEY),true);
});
for(const legacyCapability of ["missing","false"])test(`a verified legacy migration session keeps its ordinary shell without handoff capability: ${legacyCapability}`,async t=>{
 const h=await page(t,"legacy",{saved:false,legacyCapability});
 assert.equal(h.targets(),0);assert.equal(h.mounted(),1);assert.deepEqual(h.destinations,[]);
});
test("a handoff-capable personal session never falls through after authoritative401",async t=>{
 const h=await page(t,"reauth");assert.equal(h.targets(),1);assert.equal(h.mounted(),0);assert.deepEqual(h.destinations,[]);
 assert.equal(h.values.has(CONTINUATION_KEY),true);assert.ok(h.view.root.findAllByProps({role:"alert"}).length);
});
test("an explicit help article follows the purchased company instead of becoming a generic help page",async t=>{
 const h=await page(t,"company",{entryPath:"/testcases/umbrella-home/work/?view=help&article=falcon-ai-chat"});
 assert.equal(h.forms[0]?.fields.route,"/work/?workspaceId=space&projectId=project&view=help&article=falcon-ai-chat&lang=en");
});


test("a verified approval link follows its workspace to the company alias", async t => {
 const h = await page(t, "company", {savedPath:"/work/?view=config&settings=billing&planRequest=req_1&workspaceId=space"});
 assert.equal(h.forms[0]?.fields.route,"/work/?workspaceId=space&projectId=project&view=config&settings=billing&planRequest=req_1&lang=en");
 assert.equal(h.values.has(CONTINUATION_KEY),true, "the browser retry can still recover the scoped plan route");
});
test("a company handoff never forwards another workspace's approval link", async t => {
 const h = await page(t, "company", {savedPath:"/work/?view=config&settings=billing&planRequest=req_1&workspaceId=other"});
 assert.equal(h.forms[0]?.fields.route,"/work/?workspaceId=space&projectId=project&lang=en");
});
test("a pending company retains its approval link across refresh", async t => {
 const h = await page(t, "preparing", {savedPath:"/work/?view=config&settings=billing&planRequest=req_1&workspaceId=space"});
 assert.equal(h.values.has(CONTINUATION_KEY),true);
});
test("an explicit case still wins over a saved approval link", async t => {
 const h = await page(t, "company", {entryPath:"/work/?caseId=current-case",savedPath:"/work/?view=config&settings=billing&planRequest=req_1&workspaceId=space"});
 assert.equal(h.forms[0]?.fields.route,"/work/?workspaceId=space&projectId=project&caseId=current-case&lang=en");
});
