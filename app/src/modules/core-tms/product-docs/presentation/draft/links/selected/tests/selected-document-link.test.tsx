import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test, {type TestContext} from "node:test";
import React from "react";
import {act, create, type ReactTestRenderer} from "react-test-renderer";
import {$createLinkNode, LinkNode} from "@lexical/link";
import {$createParagraphNode, $createTextNode, $getNodeByKey, $getRoot, createEditor} from "lexical";
import {TmsHttpClientProvider} from "../../../../../../auth/http/TmsHttpClientContext";
import {TmsLocaleContext} from "../../../../../../localization/context/TmsLocaleProvider";
import {ProductDocsContext} from "../../../../../composition/context/ProductDocsContext";
import type {ProductDocsApi, ProductDocSelection} from "../../../../../domain/product-docs";

const require=createRequire(import.meta.url), css=require.extensions[".css"];
require.extensions[".css"]=module=>{module.exports={};};
const {ProductDocSelectedLinkPreview}=require("../ProductDocSelectedLinkPreview") as typeof import("../ProductDocSelectedLinkPreview");
if(css)require.extensions[".css"]=css;else delete require.extensions[".css"];
const href="/work/?workspaceId=w&projectId=p&view=product-docs&docId=refunds&docVersion=3&docSection=scope";

async function renderSelected(t:TestContext,mode:"notfound"|"null"|"blank"|"resolved") {
 const previousWindow=globalThis.window, previousDocument=globalThis.document, previousReact=Object.getOwnPropertyDescriptor(globalThis,"React"), previousNavigator=Object.getOwnPropertyDescriptor(globalThis,"navigator"), previousHTMLElement=Object.getOwnPropertyDescriptor(globalThis,"HTMLElement"), previousSVGElement=Object.getOwnPropertyDescriptor(globalThis,"SVGElement");
 const browser=new EventTarget() as Window & typeof globalThis;
 Object.assign(browser,{HTMLElement:class {focus(){}},location:{href:"https://team-falcon.saturnusgo.com/work/?workspaceId=w&projectId=p&view=product-docs"}});
 const documentTarget=Object.assign(new EventTarget(),{defaultView:browser}) as unknown as Document;
 Object.assign(globalThis,{window:browser,document:documentTarget,HTMLElement:browser.HTMLElement,SVGElement:class {},React});
 const copied:string[]=[];
 Object.defineProperty(globalThis,"navigator",{configurable:true,value:{clipboard:{async writeText(value:string){copied.push(value);}}}});
 const editor=createEditor({nodes:[LinkNode],onError:error=>{throw error;}});let linkKey="";
 editor.update(()=>{const link=$createLinkNode(href,{title:"Tooltip is not the authored document title"});linkKey=link.getKey();
  link.append($createTextNode("План регрессии: "),$createTextNode("возвраты оплаты").setFormat("bold"));
  $getRoot().append($createParagraphNode().append(link));},{discrete:true});
 const authoredText=editor.getEditorState().read(()=>$getNodeByKey(linkKey)?.getTextContent());
 const chosen:ProductDocSelection[]=[];
 const client={async mutateResource(path:string,method:string,body:unknown){
  assert.equal(path,"/workspaces/w/projects/p/product-docs/link-preview");assert.equal(method,"POST");
  assert.deepEqual(body,{kind:"document",id:"refunds",version:3,sectionId:"scope"});
  if(mode==="notfound")throw new Error("NOT_FOUND");
  return {data:mode==="null"?null:{kind:"document",title:mode==="blank"?" \n ":"Опубликованные правила возвратов",description:null,host:null,path:[],status:"published"}};
 }} as unknown as React.ComponentProps<typeof TmsHttpClientProvider>["client"];
 let renderer!:ReactTestRenderer;
 t.after(()=>{act(()=>renderer?.unmount());browser.dispatchEvent(new Event("beforeunload"));globalThis.window=previousWindow;globalThis.document=previousDocument;
  for(const [key,previous] of [["React",previousReact],["navigator",previousNavigator],["HTMLElement",previousHTMLElement],["SVGElement",previousSVGElement]] as const){if(previous)Object.defineProperty(globalThis,key,previous);else Reflect.deleteProperty(globalThis,key);}});
 await act(async()=>{renderer=create(<TmsLocaleContext.Provider value={{locale:"en",languageTag:"en-US",setLocale(){},t:()=>""}}>
  <TmsHttpClientProvider client={client}><ProductDocsContext.Provider value={{scope:{workspaceId:"w",projectId:"p"},api:{} as ProductDocsApi,open(){},openDocument(selection){chosen.push(selection);}}}>
   <ProductDocSelectedLinkPreview {...{href,url:href,ru:false,authoredText,onEdit(){},onRemove(){}}}/>
  </ProductDocsContext.Provider></TmsHttpClientProvider>
 </TmsLocaleContext.Provider>);});
 return {renderer,chosen,copied};
}

for(const mode of ["notfound","null","blank"] as const)test(`selected document keeps the authored link label when metadata is ${mode}`,async t=>{
 const {renderer,chosen}=await renderSelected(t,mode);
 assert.equal(renderer.root.findByType("strong").children.join(""),"План регрессии: возвраты оплаты");
 const anchor=renderer.root.findByType("a");assert.equal(anchor.props.href,href);
 let prevented=false;act(()=>anchor.props.onClick({button:0,currentTarget:{},preventDefault(){prevented=true;}}));
 assert.equal(prevented,true);assert.deepEqual(chosen,[{docId:"refunds",version:3,sectionId:"scope"}]);
});

test("selected document prefers resolved metadata and copies the canonical URL instead of its label",async t=>{
 const {renderer,copied}=await renderSelected(t,"resolved");
 assert.equal(renderer.root.findByType("strong").children.join(""),"Опубликованные правила возвратов");
 const copy=renderer.root.findAll(node=>node.props["aria-label"]==="Copy link"&&typeof node.props.onPress==="function")[0];
 assert.ok(copy);await act(async()=>copy.props.onPress());assert.deepEqual(copied,[href]);
 assert.equal(renderer.root.findByType("a").props.href,href);
});
