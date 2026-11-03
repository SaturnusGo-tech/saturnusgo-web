import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import {act,create,type ReactTestRenderer} from "react-test-renderer";
import {TmsHttpClientProvider} from "../../../../auth/http/TmsHttpClientContext";
import {TmsLocaleContext} from "../../../../localization/context/TmsLocaleProvider";
import type {TmsHttpClient} from "../../../../../../core/tms/transport/http";
import type {useExecutionHistory} from "../../../execution-history/application/useExecutionHistory";
(globalThis as typeof globalThis & {React:typeof React}).React=React;
require.extensions[".css"]=module=>{module.exports={};};
const {ExecutionHistory}=require("../../../execution-history/presentation/ExecutionHistory") as typeof import("../../../execution-history/presentation/ExecutionHistory");
test("individual event authors survive later human updates; initial not_run invents no author",async()=>{
  const http={get:async(path:string)=>({data:[new URL(`https://test${path}`).searchParams.get("identityId")==="agent"
    ?{identityId:"agent",kind:"agent",provider:"codex",name:"Codex",status:"inactive"}
    :{identityId:"human",kind:"human",name:"Ada",email:"ada@example.test"}],meta:{hasMore:false,nextCursor:null}})} as unknown as TmsHttpClient;
  const common={workspaceId:"w",projectId:"p",runId:"r",itemId:"i",createdAt:"2026-11-01T00:00:00Z"};
  const state:ReturnType<typeof useExecutionHistory>={owner:http,key:"scope",items:[
    {...common,id:"human-step",attemptNo:2,stepId:"b",kind:"step_result_recorded",status:"passed",actor:"Ada",actorIdentityId:"human",actorKind:"human"},
    {...common,id:"codex-step",attemptNo:1,stepId:"a",kind:"step_result_recorded",status:"failed",actor:"Codex",actorIdentityId:"agent",actorKind:"agent",actorProvider:"codex",initiatedBy:{identityId:"human",name:"Ada"}}],nextCursor:"more",loading:false,pending:false,error:false,refresh:()=>{},more:async()=>{}};
  const render=(empty=false)=><TmsHttpClientProvider client={http}><TmsLocaleContext.Provider value={{locale:"en",languageTag:"en-US",setLocale:()=>{},t:key=>key}}>
    <ExecutionHistory workspaceId="w" locale="en" state={empty?{...state,items:[],nextCursor:null}:state} steps={[{id:"a",order:1},{id:"b",order:2}]}/>
  </TmsLocaleContext.Provider></TmsHttpClientProvider>;
  let view!:ReactTestRenderer;await act(async()=>{view=create(render());});
  const html=JSON.stringify(view.toJSON());assert.match(html,/Codex/);assert.match(html,/Ada/);assert.match(html,/Initiated by/);assert.match(html,/Load more records/);
  assert.equal(view.root.findAllByType("li").length,2);assert.equal(view.root.findAllByType("time").length,2);
  assert.deepEqual(view.root.findAllByType("strong").map(node=>node.children.join("")),["Step result recorded by","Step result recorded by"]);
  await act(async()=>view.update(render(true)));const initial=JSON.stringify(view.toJSON());
  assert.match(initial,/No execution activity yet./);assert.doesNotMatch(initial,/Codex|Ada|recorded by/);
  await act(async()=>view.unmount());
});
