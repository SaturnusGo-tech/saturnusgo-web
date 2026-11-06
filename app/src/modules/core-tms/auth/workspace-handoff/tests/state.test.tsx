import assert from "node:assert/strict";
import { test } from "node:test";
import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { useWorkspaceHandoff } from "../application/useWorkspaceHandoff";
import type { WorkspaceHandoffNavigation, WorkspaceHandoffPort, WorkspaceTransitionTarget } from "../domain/handoff-port";
const target={workspaceId:"space",destinationOrigin:"https://team-falcon.saturnusgo.com",generation:3};
let state: ReturnType<typeof useWorkspaceHandoff>;
const navigations: WorkspaceHandoffNavigation[]=[];
function Probe({port,completionId="paid",workspaceId="space"}:{port:WorkspaceHandoffPort;completionId?:string|null;workspaceId?:string}) {
 state=useWorkspaceHandoff({port,completionId,workspaceId,href:"https://tms.saturnusgo.com/testcases/umbrella-home/work/?workspaceId=space",locale:"ru",desktop:false,navigate:value=>navigations.push(value)});return null;
}
test("draft, declined and unpaid flows never discover or transfer a workspace",async()=>{
 let reads=0,view!:ReactTestRenderer;const port={target:async()=>{reads++;return target;}};
 await act(async()=>{view=create(<Probe port={port} completionId={null}/>);});assert.equal(reads,0);assert.equal(state.phase,"idle");await act(async()=>view.unmount());
});
test("confirmed activation opens one scoped server target and rerenders do not loop",async()=>{
 let reads=0,view!:ReactTestRenderer;const before=navigations.length,port={target:async()=>{reads++;return target;}};
 await act(async()=>{view=create(<Probe port={port}/>);});assert.equal(reads,1);assert.equal(state.phase,"opening");assert.equal(navigations.length,before+1);
 await act(async()=>view.update(<Probe port={port}/>));assert.equal(reads,1);assert.equal(navigations.length,before+1);await act(async()=>view.unmount());
});
test("workspace changes cancel discovery and its late reply cannot move the new workspace",async()=>{
 let finish!:(value:WorkspaceTransitionTarget)=>void,signal:AbortSignal|undefined,view!:ReactTestRenderer;
 const before=navigations.length,port={target:async(_id:string,input:AbortSignal)=>{signal=input;return new Promise<WorkspaceTransitionTarget>(resolve=>{finish=resolve;});}};
 await act(async()=>{view=create(<Probe port={port}/>);});await act(async()=>view.update(<Probe port={port} completionId={null} workspaceId="other"/>));
 assert.equal(signal?.aborted,true);await act(async()=>finish(target));assert.equal(navigations.length,before);await act(async()=>view.unmount());
});
test("repair or permission failure leaves the current paid workspace and exposes explicit retry",async()=>{
 let reads=0,view!:ReactTestRenderer;const port={target:async()=>{if(++reads===1)throw {code:"HANDOFF_DENIED"};return target;}};
 await act(async()=>{view=create(<Probe port={port}/>);});assert.equal(state.phase,"error");
 await act(async()=>state.retry());assert.equal(reads,2);assert.equal(state.phase,"opening");await act(async()=>view.unmount());
});
test("an authoritative preparing target polls until the verified company address is ready without asking for checkout",async()=>{
 let reads=0,view!:ReactTestRenderer,finish!:(value:WorkspaceTransitionTarget)=>void;const before=navigations.length;
 const port={target:async()=>{if(++reads===1)throw {code:"HANDOFF_TARGET_PREPARING",status:409};return new Promise<WorkspaceTransitionTarget>(resolve=>{finish=resolve;});}};
 try {
  await act(async()=>{view=create(<Probe port={port}/>);});assert.equal(state.phase,"preparing");assert.equal(navigations.length,before);
  await act(async()=>{await new Promise(resolve=>setTimeout(resolve,2600));});
  assert.equal(reads,2);assert.equal(state.phase,"preparing","background polling must retain the preparing screen and email notice");
  await act(async()=>finish(target));assert.equal(state.phase,"opening");assert.equal(navigations.length,before+1);
 } finally {await act(async()=>view?.unmount());}
});
