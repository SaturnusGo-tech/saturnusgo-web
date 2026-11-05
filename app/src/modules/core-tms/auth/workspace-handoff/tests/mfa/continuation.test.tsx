import assert from "node:assert/strict";
import {test} from "node:test";
import {componentHarness,nodes} from "../../../../portfolios/tests/support/component-harness";
import type {WorkspaceMfaHandoff} from "../../composition/WorkspaceMfaHandoff";
function draw(session:unknown,recoveryCodes:string[]=[]) {
 const h=componentHarness("https://tms.saturnusgo.com/cloud-login/?workspaceId=space&workspaceHandoff=1");
 const {WorkspaceMfaHandoff:View}=h.load<{WorkspaceMfaHandoff:typeof WorkspaceMfaHandoff}>(new URL("../../composition/WorkspaceMfaHandoff.tsx",import.meta.url),name=>{
  if(name.endsWith("useTmsLocale"))return{useTmsLocale:()=>({locale:"ru"})};
  if(name.endsWith("managed-access-client"))return{createManagedAccessClient:()=>({})};
  if(name.endsWith("useManagedAccess"))return{useManagedAccess:()=>({state:{session,loading:false,recoveryCodes}})};
 });return nodes(h.render(()=>View({workspaceId:"space"})));
}
test("pending MFA never starts a workspace handoff or renders business content",()=>{
 const all=draw({authenticated:false,stage:"mfa_challenge"});assert.ok(all.some(node=>node.type==="ManagedAccessScreen"));assert.equal(all.some(node=>node.type==="AuthContinuation"),false);
});
test("the exact authenticated workspace retains desktop PKCE continuation priority before transfer",()=>{
 const all=draw({authenticated:true,stage:"authenticated",audience:"tenant",workspaceId:"space"});
 const continuation=all.find(node=>node.type==="AuthContinuation")!;assert.ok(continuation);assert.equal(continuation.props.workspaceId,"space");assert.equal(continuation.props.managedWorkspace,true);
 assert.ok(all.some(node=>node.type==="AuthenticatedWorkspaceHandoff"));
});
test("foreign workspace hints and unacknowledged recovery codes never trigger transfer",()=>{
 assert.ok(draw({authenticated:true,stage:"authenticated",audience:"tenant",workspaceId:"other"}).some(node=>node.props.role==="alert"));
 assert.equal(draw({authenticated:true,stage:"authenticated",audience:"tenant",workspaceId:"space"},["recovery"]).some(node=>node.type==="AuthContinuation"),false);
});
