import assert from 'node:assert/strict';
import test from 'node:test';
import {readWorkspaceHandoffPolicy} from '../relay-policy.mjs';
const env={FALCON_PUBLIC_AUTH_ENABLED:'true',FALCON_MANAGED_AUTH_ENABLED:'true',FALCON_COMPANY_DOMAIN_SUFFIX:'saturnusgo.com',FALCON_PLATFORM_HOSTNAME:'sandbox-falcon.saturnusgo.com'};
const nonce='a'.repeat(32),target='https://team-falcon.saturnusgo.com';
const base=`default-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self' ${target}; script-src 'nonce-${nonce}'`;
const request=new Request('https://tms.saturnusgo.com/api/v1/auth/workspace-handoffs',{method:'POST'});
const read=policy=>readWorkspaceHandoffPolicy(request,new Response('',{headers:{'content-type':'text/html','content-security-policy':policy}}),'personal',env);
test('handoff accepts only same-nonce presentation styles while retaining old relay compatibility',()=>{
 assert.equal(read(base),base);
 const styled=base+`; style-src 'nonce-${nonce}'`;
 assert.equal(read(styled),styled);
 for(const suffix of [`; style-src 'nonce-${'b'.repeat(32)}'`,"; style-src 'unsafe-inline'",'; style-src *',`; style-src 'nonce-${nonce}' https://evil.test`,`; style-src 'nonce-${nonce}'; img-src *`])assert.equal(read(base+suffix),null);
 assert.equal(read(styled.replace(target,'https://evil.test')),null);
});
