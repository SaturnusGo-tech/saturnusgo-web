import assert from 'node:assert/strict';
import test from 'node:test';
import worker from '../../../worker.mjs';
import {captureRelayPost} from './browser/https-form-post.mjs';
const env={FALCON_PUBLIC_AUTH_ENABLED:'true',FALCON_MANAGED_AUTH_ENABLED:'true',FALCON_COMPANY_DOMAIN_SUFFIX:'saturnusgo.com',FALCON_PLATFORM_HOSTNAME:'sandbox-falcon.saturnusgo.com',FALCON_MANAGED_GATEWAY_KEY:'07'.repeat(32),FALCON_API_ORIGIN:'https://api.example.test'};
const source='https://tms.saturnusgo.com',target='https://team-falcon.saturnusgo.com';
const policy=`default-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self' ${target}; script-src 'nonce-${'a'.repeat(32)}'`;
test('only handoff start relay preserves the exact nonce and target CSP without a wildcard',async t=>{
 const original=globalThis.fetch;t.after(()=>globalThis.fetch=original);
 globalThis.fetch=async()=>new Response('<form></form>',{headers:{'content-type':'text/html','content-security-policy':policy}});
 const request=path=>new Request(source+'/api/v1/'+path,{method:'POST',body:'workspaceId=space',headers:{origin:source,accept:'text/html','content-type':'application/x-www-form-urlencoded'}});
 const response=await worker.fetch(request('auth/workspace-handoffs'),env);
 assert.equal(response.status,200);assert.equal(response.headers.get('content-security-policy'),policy);assert.equal(response.headers.get('referrer-policy'),'strict-origin');
 const other=await worker.fetch(request('billing/checkout'),env);assert.doesNotMatch(other.headers.get('content-security-policy'),/nonce-/);
 for(const unsafe of [policy.replace(target,'https://evil.test'),policy.replace(target,'https://*.saturnusgo.com'),policy.replace("base-uri 'none'","base-uri *"),policy.replace("'nonce-"+'a'.repeat(32)+"'","'unsafe-inline'")]) {
  globalThis.fetch=async()=>new Response('<form></form>',{headers:{'content-type':'text/html','content-security-policy':unsafe}});
  assert.doesNotMatch((await worker.fetch(request('auth/workspace-handoffs'),env)).headers.get('content-security-policy'),/nonce-/);
 }
});
test('relay policy preserves the real browser form origin across HTTPS origins without leaking a URL path',async t=>{
 const original=globalThis.fetch;t.after(()=>globalThis.fetch=original);
 globalThis.fetch=async()=>new Response('<form></form>',{headers:{'content-type':'text/html','content-security-policy':policy}});
 const response=await worker.fetch(new Request(source+'/api/v1/auth/workspace-handoffs',{method:'POST',body:'workspaceId=space',headers:{origin:source,accept:'text/html'}}),env);
 const observed=await captureRelayPost(response.headers.get('referrer-policy'));
 if(!observed){t.skip('A local Chrome/Chromium installation is required for the browser navigation contract.');return;}
 assert.equal(observed.origin,observed.sourceOrigin);
 assert.equal(observed.referer,observed.sourceOrigin+'/');
 assert.equal(observed.method,'POST');
 assert.equal(observed.body,'code=local-test-only');
});
test('consume permits only exact company administration redirects and preserves host-only session cookies',async t=>{
 const original=globalThis.fetch;t.after(()=>globalThis.fetch=original);
 const cookie=`__Host-falcon_cloud_session=${'a'.repeat(43)}; Path=/; HttpOnly; Secure; SameSite=Lax`;
 const request=()=>new Request(target+'/api/v1/auth/workspace-handoffs/consume',{method:'POST',body:'code=once',headers:{origin:source,accept:'text/html'}});
 for(const path of ['/admin/?account=personal&workspaceId=space&page=company','/admin/?account=personal&workspaceId=space&page=company&projectId=project-1&lang=ru']){
  const location=target+path;globalThis.fetch=async()=>new Response(null,{status:303,headers:{location,'set-cookie':cookie}});
  const response=await worker.fetch(request(),env);assert.equal(response.status,303,path);assert.equal(response.headers.get('location'),location);assert.equal(response.headers.getSetCookie()[0],cookie);
 }
 for(const path of ['/admin/','/admin/?account=platform&workspaceId=space&page=company','/admin/?account=personal&workspaceId=space&page=audit',
  '/admin/?account=personal&page=company','/admin/?account=personal&workspaceId=../space&page=company',
  '/admin/?account=personal&workspaceId=space&page=company&workspaceId=other','/admin/?account=personal&workspaceId=space&page=company&lang=de',
  '/admin/?account=personal&workspaceId=space&page=company&lang=en&lang=ru','/admin/?account=personal&workspaceId=space&page=company&projectId=one&projectId=two',
  '/admin/?account=personal&workspaceId=space&page=company&projectId=../other','/admin/?account=personal&workspaceId=space&page=company&returnTo=evil',
  '/admin/?account=personal&workspaceId=space&page=company#secret']){
  globalThis.fetch=async()=>new Response(null,{status:303,headers:{location:target+path}});assert.equal((await worker.fetch(request(),env)).status,502,path);
 }
 for(const origin of ['https://evil.test','https://other-falcon.saturnusgo.com']){
  globalThis.fetch=async()=>new Response(null,{status:303,headers:{location:origin+'/admin/?account=personal&workspaceId=space&page=company'}});
  assert.equal((await worker.fetch(request(),env)).status,502,origin);
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
