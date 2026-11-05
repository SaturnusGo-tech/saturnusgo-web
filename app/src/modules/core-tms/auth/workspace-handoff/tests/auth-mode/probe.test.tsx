import assert from "node:assert/strict";
import {test} from "node:test";
import React from "react";
import {act,create,type ReactTestRenderer} from "react-test-renderer";
import {useVerifiedWorkspaceAuthMode} from "../../application/useVerifiedWorkspaceAuthMode";
import type {CompanySession} from "../../../managed/domain/managed-access";
let state:ReturnType<typeof useVerifiedWorkspaceAuthMode>;
function Probe({read,workspaceId="space",managedHint=false}:{read:(signal:AbortSignal)=>Promise<CompanySession>;workspaceId?:string|null;managedHint?:boolean}){state=useVerifiedWorkspaceAuthMode({read,workspaceId,managedHint,enabled:true});return null;}
const session=(workspaceId="space")=>({authenticated:true,audience:"tenant",workspaceId,stage:"authenticated"}) as CompanySession;
test("public origin chooses managed access only from an authenticated exact-workspace proof",async()=>{
 for(const [value,expected] of [[session(),"managed"],[{authenticated:false,stage:"anonymous"},"personal"],[session("other"),"denied"]] as const){let view!:ReactTestRenderer;await act(async()=>{view=create(<Probe read={async()=>value as CompanySession}/>);});assert.equal(state.mode,expected);await act(async()=>view.unmount());}
});
test("missing explicit workspace does not infer a company from a hostname, cookie hint or session kind",async()=>{
 let reads=0,view!:ReactTestRenderer;await act(async()=>{view=create(<Probe workspaceId={null} read={async()=>{reads++;return session();}}/>);});assert.equal(reads,0);assert.equal(state.mode,"personal");await act(async()=>view.unmount());
});
test("late session proofs are canceled on workspace changes and unavailable auth never silently changes mode",async()=>{
 let finish!:(value:CompanySession)=>void,signal:AbortSignal|undefined,view!:ReactTestRenderer;
 const read=async(input:AbortSignal)=>{signal=input;return new Promise<CompanySession>(resolve=>{finish=resolve;});};
 await act(async()=>{view=create(<Probe read={read}/>);});await act(async()=>view.update(<Probe read={read} workspaceId={null}/>));assert.equal(signal?.aborted,true);await act(async()=>finish(session()));assert.equal(state.mode,"personal");await act(async()=>view.unmount());
 await act(async()=>{view=create(<Probe read={async()=>{throw new Error("Unavailable");}}/>);});assert.equal(state.mode,"error");await act(async()=>view.unmount());
});
test("a verified cloud owner may use a company host without being recast as a managed employee",async()=>{
 let current:ReturnType<typeof useVerifiedWorkspaceAuthMode>,view!:ReactTestRenderer;
 const read=async()=>({authenticated:false,stage:"anonymous"}) as CompanySession,readCloud=async()=>({authenticated:true,workspace:{id:"space"}} as never);
 function CloudProbe(){current=useVerifiedWorkspaceAuthMode({read,readCloud,workspaceId:"space",managedHint:true,enabled:true});return null;}
 await act(async()=>{view=create(<CloudProbe/>);});assert.equal(current!.mode,"personal");assert.equal(current!.cloudSession?.workspace.id,"space");await act(async()=>view.unmount());
});
