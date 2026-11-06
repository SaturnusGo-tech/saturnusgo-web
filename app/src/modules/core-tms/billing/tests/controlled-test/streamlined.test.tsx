import assert from "node:assert/strict";
import {test} from "node:test";
import React from "react";
import {act,create,type ReactTestRenderer} from "react-test-renderer";
import {TmsHttpClientProvider} from "../../../auth/http/TmsHttpClientContext";
import {TmsSessionProvider} from "../../../auth/presentation/session/TmsSessionContext";
import {TmsLocaleContext} from "../../../localization/context/TmsLocaleProvider";
import {storeIdentityCheckout} from "../../application/commands/reauthentication-checkout";
import {account,deferred,subscription,summary} from "../fixtures/billing-fixtures";

(globalThis as typeof globalThis&{React:typeof React}).React=React;
const previousCss=require.extensions[".css"];require.extensions[".css"]=module=>{module.exports={};};
const {ConnectedBillingFeature}=require("../../composition/ConnectedBillingFeature") as typeof import("../../composition/ConnectedBillingFeature");
if(previousCss)require.extensions[".css"]=previousCss;else delete require.extensions[".css"];
const setup={id:"setup",version:4,displayName:"Team",slug:"team",hostname:"team-falcon.saturnusgo.com",status:"ready",expiresAt:"2027-11-06T12:00:00Z"};
function fixture({saved=false,pendingDomain=false,delaySummary=false}={}) {
 const previousWindow=Object.getOwnPropertyDescriptor(globalThis,"window"),previousStorage=Object.getOwnPropertyDescriptor(globalThis,"sessionStorage");
 const values=new Map<string,string>(),storage={getItem:(key:string)=>values.get(key)??null,setItem:(key:string,value:string)=>values.set(key,value),removeItem:(key:string)=>values.delete(key)};
 const destinations:string[]=[],writes:{path:string;body:Record<string,unknown>;key:string}[]=[];
 Object.defineProperty(globalThis,"sessionStorage",{configurable:true,value:storage});
 Object.defineProperty(globalThis,"window",{configurable:true,value:{sessionStorage:storage,location:{href:"https://tms.saturnusgo.com/testcases/umbrella-home/work/?workspaceId=workspace&projectId=project&lang=en&view=config&settings=billing",origin:"https://tms.saturnusgo.com",assign:(url:string)=>destinations.push(url)},addEventListener(){},removeEventListener(){},dispatchEvent(){}}});
 if(saved)storeIdentityCheckout("cloud:owner","workspace",{intent:{kind:"checkout",planId:"startup",startupSetupId:"setup",startupSetupVersion:4,confirmWorkspaceConversion:true},options:{idempotencyKey:"original-key"}});
 let completed=false,targets=0;
 const activation=deferred<void>(),policy={suggestedPlanId:"startup",allowedCheckoutPlanIds:["startup"],allowedChangePlanIds:[],teamAdministration:false,checkoutMode:"controlled_test",enabled:true};
 const plan={id:"startup",seats:5,amount:5900,currency:"USD",workspaceKind:"company"},quote={planId:"startup",subtotal:5900,currency:"USD",periodEnd:null,prorated:false};
 const http={async getResource(path:string){
  if(path.startsWith("/billing/summary")){if(completed&&delaySummary)await activation.promise;return {data:completed?{...summary,checkoutMode:"controlled_test"}:{...summary,...policy,workspaceKind:"personal",planId:null,status:"unsubscribed"}};}
  if(path.startsWith("/billing/startup-setup"))return {data:{setup}};
  if(path.startsWith("/auth/workspace-target")){targets++;if(pendingDomain)throw {code:"HANDOFF_TARGET_PREPARING",status:409};return {data:{workspaceId:"workspace",generation:1,destinationOrigin:"https://tms.saturnusgo.com"}};}
  return {data:{...account,plans:[plan],checkoutQuotes:[quote],subscription:completed?subscription:null,checkout:null,...(completed?{}:policy),enabled:true,checkoutMode:"controlled_test"}};
 },async get(){return {data:[],meta:{limit:30}};},async mutateResource(path:string,_method:string,body:Record<string,unknown>,options:{idempotencyKey:string}){
  writes.push({path,body,key:options.idempotencyKey});if(path==="/billing/startup-setup")return {data:{setup:{...setup,displayName:body.displayName,slug:body.slug}}};
  assert.equal(path,"/billing/checkout","the browser must not issue a separate simulated confirm");completed=true;
  return {data:{subscription,checkout:{id:"checkout",workspaceId:"workspace",...quote,provider:"mock",testMode:true,status:"completed",createdAt:"2026-11-06T12:00:00Z",expiresAt:"2027-11-06T12:30:00Z"},invoice:null,provider:"mock",testMode:true,checkoutMode:"controlled_test"}};
 }};
 const tree=(locale:"en"|"ru"="en",workspaceKind:"personal"|"company"="personal")=><TmsLocaleContext.Provider value={{locale,languageTag:locale==="ru"?"ru-RU":"en-US",setLocale(){},t:key=>key}}><TmsSessionProvider value={{kind:"cloud",subject:"cloud:owner",workspaceId:"workspace",workspaceKind,workspaceRole:"workspace_admin",label:"Owner",signOut:async()=>{}}}><TmsHttpClientProvider client={http as never}><ConnectedBillingFeature workspaceId="workspace"/></TmsHttpClientProvider></TmsSessionProvider></TmsLocaleContext.Provider>;
 return {tree,writes,destinations,targets:()=>targets,activate:()=>activation.resolve(),restore(){if(previousWindow)Object.defineProperty(globalThis,"window",previousWindow);else Reflect.deleteProperty(globalThis,"window");if(previousStorage)Object.defineProperty(globalThis,"sessionStorage",previousStorage);else Reflect.deleteProperty(globalThis,"sessionStorage");}};
}
async function consent(view:ReactTestRenderer) {
 await act(async()=>view.root.findByProps({"data-plan":"startup"}).props.onClick());
 await act(async()=>view.root.findByProps({"data-wizard-next":"name"}).props.onClick());
 await act(async()=>view.root.findByProps({"data-wizard-next":"address"}).props.onClick());
 await act(async()=>view.root.findByProps({id:"startup-consent"}).props.onChange({target:{checked:true}}));
}
test("server-completed controlled checkout opens the company automatically after fresh activation, with no second confirmation",async()=>{
 const h=fixture({delaySummary:true});let view!:ReactTestRenderer;
 try {await act(async()=>{view=create(h.tree());});await consent(view);
  await act(async()=>view.root.findByProps({"data-wizard-checkout":true}).props.onClick());
  assert.equal(h.writes.length,1);assert.equal(view.root.findAllByProps({name:"billing-outcome"}).length,0);assert.equal(h.targets(),0,"receipt alone must wait for current server activation");
  await act(async()=>{view.update(h.tree("en","company"));});
  await act(async()=>h.activate());assert.equal(h.targets(),1);assert.deepEqual(h.destinations,["/admin/?account=personal&workspaceId=workspace&lang=en&projectId=project&page=company"]);
 } finally {await act(async()=>view?.unmount());h.restore();}
});
test("restored controlled checkout goes directly to company preparation and email notice, never back to subscription confirmation",async()=>{
 const h=fixture({saved:true,pendingDomain:true});let view!:ReactTestRenderer;
 try {await act(async()=>{view=create(h.tree());});
  assert.equal(h.writes.length,1);assert.equal(h.writes[0].key,"original-key");
  assert.equal(view.root.findByProps({"data-company-wizard":true}).props["data-stage"],"preparing");
  assert.match(JSON.stringify(view.toJSON()),/email/);assert.equal(view.root.findAllByProps({"aria-label":"Falcon plans"}).length,0);
  assert.equal(view.root.findAllByProps({name:"billing-outcome"}).length,0);assert.deepEqual(h.destinations,[]);
 } finally {await act(async()=>view?.unmount());h.restore();}
});
test("setup notification language is captured at wizard opening even if the UI language changes before save",async()=>{
 const h=fixture();let view!:ReactTestRenderer;
 try {await act(async()=>{view=create(h.tree("ru"));});await act(async()=>view.root.findByProps({"data-plan":"startup"}).props.onClick());
  await act(async()=>{view.update(h.tree("en"));});await act(async()=>view.root.findByProps({id:"startup-name"}).props.onChange({target:{value:"New company"}}));
  await act(async()=>view.root.findByProps({"data-wizard-next":"name"}).props.onClick());await act(async()=>view.root.findByProps({"data-wizard-next":"address"}).props.onClick());
  assert.equal(h.writes[0].path,"/billing/startup-setup");assert.equal(h.writes[0].body.locale,"ru");
 } finally {await act(async()=>view?.unmount());h.restore();}
});
