import assert from 'node:assert/strict';
import test from 'node:test';
import { memberProfileUrl,readMemberProfileIdentity } from '../../../navigation/member-profile-route';
import { buildWorkspaceDeepLink } from '../../../../state/navigation/workspace-deep-link';
test('member profile route preserves stable workspace/project scope and drops unrelated document state',()=>{
 const href=memberProfileUrl('https://falcon.test/work/?workspaceId=one&projectId=p&view=product-docs&docId=secret','one','agent:codex');
 assert.equal(href,'/work/?workspaceId=one&projectId=p&view=profile&memberId=agent%3Acodex');
 assert.equal(readMemberProfileIdentity('https://falcon.test'+href,'one'),'agent:codex');
 assert.equal(readMemberProfileIdentity('https://falcon.test'+href,'foreign'),null);
 const canonical=buildWorkspaceDeepLink('https://falcon.test'+href,{workspaceId:'one',projectId:'p',view:'profile',runId:null});
 assert.equal(new URL(canonical).searchParams.get('memberId'),'agent:codex');
 const changed=buildWorkspaceDeepLink(canonical,{workspaceId:'foreign',projectId:'p',view:'profile',runId:null});
 assert.equal(new URL(changed).searchParams.has('memberId'),false);
});
