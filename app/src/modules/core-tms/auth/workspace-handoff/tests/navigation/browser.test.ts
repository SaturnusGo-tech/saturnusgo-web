import assert from "node:assert/strict";
import { test } from "node:test";
import { navigateWorkspaceHandoff } from "../../data/browser-navigation";
test("browser delivery posts only non-secret start fields to its current origin and native delivery uses its navigation bridge",()=>{
 const oldWindow=Object.getOwnPropertyDescriptor(globalThis,"window"),oldDocument=Object.getOwnPropertyDescriptor(globalThis,"document");
 const inputs:{type?:string;name?:string;value?:string}[]=[],addresses:string[]=[];let submitted=false,removed=false;
 const form={method:"",action:"",hidden:false,append:(input:typeof inputs[number])=>inputs.push(input),submit(){submitted=true;},remove(){removed=true;}};
 Object.defineProperty(globalThis,"window",{configurable:true,value:{location:{origin:"https://tms.saturnusgo.com",assign:(url:string)=>addresses.push(url)}}});
 Object.defineProperty(globalThis,"document",{configurable:true,value:{createElement:(tag:string)=>tag==="form"?form:{},body:{append(){}}}});
 try {
  navigateWorkspaceHandoff({kind:"browser",action:"https://tms.saturnusgo.com/api/v1/auth/workspace-handoffs",fields:{workspaceId:"space",destinationOrigin:"https://team-falcon.saturnusgo.com",route:"/testcases/umbrella-home/work/?workspaceId=space&lang=ru",locale:"ru"}});
  assert.equal(form.method,"post");assert.equal(form.action,"https://tms.saturnusgo.com/api/v1/auth/workspace-handoffs");assert.equal(submitted,true);assert.equal(removed,true);assert.deepEqual(inputs.map(input=>input.name).sort(),["destinationOrigin","locale","route","workspaceId"]);
  assert.throws(()=>navigateWorkspaceHandoff({kind:"browser",action:"https://evil.test/api/v1/auth/workspace-handoffs",fields:{} as never}));
  navigateWorkspaceHandoff({kind:"desktop",url:"https://tms.saturnusgo.com/desktop-workspace-transition/?workspaceId=space"});assert.equal(addresses.length,1);
 } finally {for(const [key,descriptor] of [["window",oldWindow],["document",oldDocument]] as const){if(descriptor)Object.defineProperty(globalThis,key,descriptor);else Reflect.deleteProperty(globalThis,key);}}
});
