import assert from 'node:assert/strict';
import test from 'node:test';
import worker from '../../../worker.mjs';
const env={FALCON_PUBLIC_AUTH_ENABLED:'true',FALCON_MANAGED_AUTH_ENABLED:'true',FALCON_COMPANY_DOMAIN_SUFFIX:'saturnusgo.com',FALCON_PLATFORM_HOSTNAME:'sandbox-falcon.saturnusgo.com',FALCON_MANAGED_GATEWAY_KEY:'07'.repeat(32),FALCON_API_ORIGIN:'https://api.example.test'};
const source='https://tms.saturnusgo.com',target='https://team-falcon.saturnusgo.com';
const policy=`default-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self' ${target}; script-src 'nonce-${'a'.repeat(32)}'`;
test('only handoff start relay preserves the exact nonce and target CSP without a wildcard',async t=>{
 const original=globalThis.fetch;t.after(()=>globalThis.fetch=original);
 globalThis.fetch=async()=>new Response('<form></form>',{headers:{'content-type':'text/html','content-security-policy':policy}});
 const request=path=>new Request(source+'/api/v1/'+path,{method:'POST',body:'workspaceId=space',headers:{origin:source,accept:'text/html','content-type':'application/x-www-form-urlencoded'}});
 const response=await worker.fetch(request('auth/workspace-handoffs'),env);
 assert.equal(response.status,200);assert.equal(response.headers.get('content-security-policy'),policy);assert.equal(response.headers.get('referrer-policy'),'no-referrer');
 const other=await worker.fetch(request('billing/checkout'),env);assert.doesNotMatch(other.headers.get('content-security-policy'),/nonce-/);
 for(const unsafe of [policy.replace(target,'https://evil.test'),policy.replace(target,'https://*.saturnusgo.com'),policy.replace("base-uri 'none'","base-uri *"),policy.replace("'nonce-"+'a'.repeat(32)+"'","'unsafe-inline'")]) {
  globalThis.fetch=async()=>new Response('<form></form>',{headers:{'content-type':'text/html','content-security-policy':unsafe}});
  assert.doesNotMatch((await worker.fetch(request('auth/workspace-handoffs'),env)).headers.get('content-security-policy'),/nonce-/);
 }
});
test('consume allows only same-target application redirect and sets/clears host-only target cookies',async t=>{
 const original=globalThis.fetch;t.after(()=>globalThis.fetch=original);
 const headers=new Headers({location:target+'/testcases/umbrella-home/work/?workspaceId=space&lang=ru'});
 headers.append('set-cookie',`__Host-falcon_cloud_session=${'a'.repeat(43)}; Path=/; HttpOnly; Secure; SameSite=Lax`);
 headers.append('set-cookie','__Host-falcon_tenant_session=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax');
 globalThis.fetch=async()=>new Response(null,{status:303,headers});
 const request=()=>new Request(target+'/api/v1/auth/workspace-handoffs/consume',{method:'POST',body:'code=once',headers:{origin:source,accept:'text/html'}});
 const response=await worker.fetch(request(),env);assert.equal(response.status,303);assert.equal(response.headers.get('location'),headers.get('location'));assert.equal(response.headers.getSetCookie().length,2);
 for(const location of ['https://evil.test/','https://other-falcon.saturnusgo.com/testcases/umbrella-home/work/',target+'/',target+'/testcases/umbrella-home/work/?token=secret']) {
  globalThis.fetch=async()=>new Response(null,{status:303,headers:{location}});assert.equal((await worker.fetch(request(),env)).status,502);
 }
});
test('the same exact relay policy survives verified SAML and Google callback documents only',async t=>{
 const original=globalThis.fetch;t.after(()=>globalThis.fetch=original);
 globalThis.fetch=async()=>new Response('<form></form>',{headers:{'content-type':'text/html','content-security-policy':policy}});
 for(const [method,path]of [['POST','auth/saml/space/acs'],['GET','auth/google/callback'],['GET','auth/google/finish']]){
  const response=await worker.fetch(new Request(source+'/api/v1/'+path,{method,headers:{origin:method==='POST'?'https://idp.example':source},...(method==='POST'?{body:'SAMLResponse=verified'}:{})}),env);
  assert.equal(response.status,200,path);assert.equal(response.headers.get('content-security-policy'),policy,path);
 }
});
test('partial central SAML completion preserves its exact MFA redirect and replaces conflicting source session kind',async t=>{
 const original=globalThis.fetch;t.after(()=>globalThis.fetch=original);
 const headers=new Headers({location:source+'/cloud-login/?workspaceId=space&workspaceHandoff=1'});
 headers.append('set-cookie',`__Host-falcon_tenant_session=${'m'.repeat(43)}; Path=/; HttpOnly; Secure; SameSite=Lax`);
 headers.append('set-cookie','__Host-falcon_cloud_session=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax');
 globalThis.fetch=async()=>new Response(null,{status:303,headers});
 const response=await worker.fetch(new Request(source+'/api/v1/auth/saml/space/acs',{method:'POST',body:'SAMLResponse=verified',headers:{origin:'https://idp.example'}}),env);
 assert.equal(response.status,303);assert.equal(response.headers.get('location'),headers.get('location'));assert.equal(response.headers.getSetCookie().length,2);
});
