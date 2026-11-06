import { TmsLocaleContext } from "../../../../localization/context/TmsLocaleProvider";
import { clearBrowserDesktopAttempt } from "../../../continuation/desktop/browser-desktop-attempt";
import { DESKTOP_ATTEMPT_KEY } from "../../../continuation/desktop/attempt-storage";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { test } from "node:test";
import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { signInCopy } from "../../presentation/copy/sign-in-copy";
import type { useSignIn } from "../../application/useSignIn";

void test("desktop shows each login method and sends its provider and language to the same-origin broker", async t => {
  const require = createRequire(import.meta.url);
  const css = require.extensions[".css"];
  require.extensions[".css"] = module => { module.exports = {}; };
  const prior = ["React", "navigator", "window"].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)] as const);
  const destinations: string[] = [];
  const location = (path: string) => Object.assign(new URL(path, "https://tms.example.test"), { assign: (path: string) => destinations.push(path) });
  const browser = { location: location("/cloud-login/"), history: { state: {}, replaceState(_state: unknown, _title: string, path: string) { browser.location = location(path); } } };
  Object.defineProperty(globalThis, "window", { configurable: true, value: browser });
  Object.defineProperty(globalThis, "navigator", { configurable: true, value: { userAgent: "Electron/45 FalconDesktop/0.2.5" } });
  Object.assign(globalThis, { React });
  t.after(() => {
    if (css) require.extensions[".css"] = css; else delete require.extensions[".css"];
    for (const [key, descriptor] of prior) { if (descriptor) Object.defineProperty(globalThis, key, descriptor); else Reflect.deleteProperty(globalThis, key); }
  });
  const { SignInMethods } = await import("../../presentation/methods/SignInMethods");
  const signIn = { state: { methods: { google: true, email: true, saml: true, signup: true }, pending: false, loading: false },
    google() { throw new Error("Provider must open through the desktop broker"); }, select() { throw new Error("Proof must be collected in the system browser"); } } as unknown as ReturnType<typeof useSignIn>;
  let renderer!: ReactTestRenderer;
  await act(async () => { renderer = create(<SignInMethods signIn={signIn} copy={signInCopy("ru")} signup={false} locale="ru" />); });
  const buttons = renderer.root.findAllByType("button");
  assert.equal(buttons.length, 4);
  for (const label of ["Продолжить с Google", "Продолжить с email", "Продолжить с SAML SSO", "Рабочее пространство компании"]) assert.ok(buttons.some(button => button.children.includes(label)));
  await act(async () => { for (const button of buttons) button.props.onClick(); });
  assert.deepEqual(destinations, ["/desktop-sign-in/?method=google&lang=ru", "/desktop-sign-in/?method=email&lang=ru", "/desktop-sign-in/?method=saml&lang=ru", "/desktop-sign-in/?method=company&lang=ru"]);
  Object.assign(window.location,{search:"?workspaceId=company-space"});
  await act(async () => buttons[1].props.onClick());
  assert.equal(destinations.pop(),"/desktop-sign-in/?method=email&lang=ru&workspaceId=company-space");
  Object.defineProperty(globalThis, "navigator", { configurable: true, value: { userAgent: "Electron/45 FalconDesktop/0.2.3" } });
  await act(async () => { for (const button of buttons) button.props.onClick(); });
  assert.deepEqual(destinations.slice(4), ["/desktop-sign-in/", "/desktop-sign-in/", "/desktop-sign-in/", "/desktop-sign-in/"], "existing installers must retain their supported browser command");
  await act(async () => renderer.unmount());
});

void test("browser handoff opens the selected method once after loading without collecting proof for other methods", async t => {
 const require=createRequire(import.meta.url),css=require.extensions[".css"];
 require.extensions[".css"]=module=>{module.exports={};};
 const prior=["window","document","React","fetch","navigator"].map(key=>[key,Object.getOwnPropertyDescriptor(globalThis,key)] as const);
 const origin="https://tms.example.test",attempt="a".repeat(43),values=new Map<string,string>(),destinations:string[]=[],requests:string[]=[];
 const location=(path:string)=>Object.assign(new URL(path,origin),{assign:(path:string)=>destinations.push(path),replace() {}});
 const browser={location:location("/cloud-login/"),history:{state:{},replaceState(_state:unknown,_title:string,path:string){browser.location=location(path);}},
  sessionStorage:{getItem:(key:string)=>values.get(key)??null,setItem:(key:string,value:string)=>values.set(key,value),removeItem:(key:string)=>values.delete(key)}};
 Object.assign(globalThis,{React,window:browser,document:{title:"Falcon"}});
 Object.defineProperty(globalThis,"navigator",{configurable:true,value:{userAgent:"Browser"}});
 let view:ReactTestRenderer|undefined,finishMethods:((response:Response)=>void)|undefined;
 globalThis.fetch=async input=>{const path=String(input);requests.push(path);
  if(path.endsWith("/methods"))return new Promise<Response>(resolve=>{finishMethods=resolve;});
  if(path.endsWith("/google/start"))return Response.json({data:{authorizationUrl:"https://accounts.google.com/authorize"}});
  throw new Error(`Unexpected proof request ${path}`);
 };
 t.after(async()=>{await act(async()=>view?.unmount());clearBrowserDesktopAttempt();
  for(const [key,descriptor]of prior){if(descriptor)Object.defineProperty(globalThis,key,descriptor);else Reflect.deleteProperty(globalThis,key);}
  if(css)require.extensions[".css"]=css;else delete require.extensions[".css"];
 });
 const {SignInFeature}=await import("../../composition/SignInFeature");
 const context={locale:"en" as const,languageTag:"en-US" as const,setLocale(){},t:()=>"Loading"};
 for(const method of ["google","email","saml","company","unknown","email&method=saml"]){
  await act(async()=>view?.unmount());clearBrowserDesktopAttempt();values.clear();requests.length=0;destinations.length=0;
  browser.location=location(`/cloud-login/?desktopAttempt=${attempt}&method=${method}&lang=en`);
  await act(async()=>{view=create(<TmsLocaleContext.Provider value={context}><SignInFeature/></TmsLocaleContext.Provider>);});
  assert.deepEqual(requests,["/api/v1/auth/methods"]);assert.deepEqual(destinations,[]);
  await act(async()=>finishMethods!(Response.json({data:{google:true,email:true,saml:true,signup:true}})));
  if(method==="google"){
   assert.deepEqual(destinations,["https://accounts.google.com/authorize"]);
   assert.equal(requests.filter(path=>path.endsWith("/google/start")).length,1);
  }else if(method==="email"){
   assert.equal(view!.root.findByType("input").props.type,"email");assert.equal(requests.length,1);
  }else if(method==="saml"||method==="company"){
   assert.equal(view!.root.findByType("input").props.autoComplete,"organization");assert.equal(requests.length,1);
  }else{assert.equal(view!.root.findAllByType("input").length,0);assert.equal(requests.length,1);}
 }
});
void test("company discovery and SAML requests preserve only the active desktop return attempt", async t => {
 const prior=Object.getOwnPropertyDescriptor(globalThis,"window"),origin="https://tms.saturnusgo.com",attempt="a".repeat(43),values=new Map<string,string>(),bodies:unknown[]=[];
 Object.defineProperty(globalThis,"window",{configurable:true,value:{location:new URL(`${origin}/cloud-login/`),
  sessionStorage:{getItem:(key:string)=>values.get(key)??null,setItem:(key:string,value:string)=>values.set(key,value),removeItem:(key:string)=>values.delete(key)}}});
 t.after(()=>{clearBrowserDesktopAttempt();if(prior)Object.defineProperty(globalThis,"window",prior);else Reflect.deleteProperty(globalThis,"window");});
 values.set(DESKTOP_ATTEMPT_KEY,JSON.stringify({version:1,origin,attempt,createdAt:Date.now()}));
 const {createSignInClient}=await import("../../data/sign-in-client");
 const client=createSignInClient(async(_input,init)=>{bodies.push(JSON.parse(String(init?.body)));return Response.json({data:{redirectUrl:`${origin}/cloud-login/`,authorizationUrl:"https://idp.example/authorize"}});},()=>"ru");
 await client.resolveCompany("fixture-company");await client.startSaml("fixture-company");await client.startGoogle("login");
 assert.deepEqual(bodies,[{organization:"fixture-company",desktopAttempt:attempt},{organization:"fixture-company",locale:"ru",desktopAttempt:attempt},{intent:"login",desktopAttempt:attempt}]);
});
