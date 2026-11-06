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
test('consume admits only the same-target scoped desktop authorization with a bounded attempt',async t=>{
 const original=globalThis.fetch;t.after(()=>globalThis.fetch=original);
 const attempt='d'.repeat(43),exact=target+`/api/v1/auth/desktop/authorize?attempt=${attempt}&workspaceId=space`;
 const request=(path='workspace-handoffs/consume')=>new Request(target+'/api/v1/auth/'+path,{method:'POST',body:'code=once',headers:{origin:path==='workspace-handoffs/consume'?source:target,accept:'text/html'}});
 globalThis.fetch=async()=>new Response(null,{status:303,headers:{location:exact}});
 const response=await worker.fetch(request(),env);assert.equal(response.status,303);assert.equal(response.headers.get('location'),exact);
 assert.equal((await worker.fetch(request('workspace-handoffs'),env)).status,502);
 for(const location of [exact.replace(target,source),exact.replace(target,'https://other-falcon.saturnusgo.com'),
  exact.replace('/authorize?','/authorize/child?'),exact.replace(attempt,'bad'),exact+'&workspaceId=other',exact+'&attempt='+attempt,
  exact+'&lang=en',exact+'&returnTo=/admin/',exact.replace('workspaceId=space','workspaceId=..%2Fspace'),exact+'#secret']){
  globalThis.fetch=async()=>new Response(null,{status:303,headers:{location}});assert.equal((await worker.fetch(request(),env)).status,502,location);
 }
});
test('HTML handoff start and consume permit only the fixed central preparation continuation without cookies',async t=>{
 const original=globalThis.fetch;t.after(()=>globalThis.fetch=original);
 const location=source+'/cloud-login/?workspaceId=personal_314b9ea2-2888-4d23-9757-95d88260ab7d&workspaceHandoff=1';
 globalThis.fetch=async()=>new Response(null,{status:303,headers:{location}});
 for(const [host,path,origin]of [[source,'workspace-handoffs',source],[target,'workspace-handoffs',target],[target,'workspace-handoffs/consume',source]]){
  const response=await worker.fetch(new Request(host+'/api/v1/auth/'+path,{method:'POST',body:'workspaceId=space',headers:{origin,accept:'text/html','content-type':'application/x-www-form-urlencoded'}}),env);
  assert.equal(response.status,303,path);assert.equal(response.headers.get('location'),location);
  assert.equal(response.headers.get('cache-control'),'private, no-store, no-transform');assert.equal(response.headers.has('set-cookie'),false);
 }
});
test('preparation redirect allowance rejects foreign paths, malformed scopes, non-HTML requests and cookie issuance',async t=>{
 const original=globalThis.fetch;t.after(()=>globalThis.fetch=original);
 const exact=source+'/cloud-login/?workspaceId=space&workspaceHandoff=1';
 const request=(path='auth/workspace-handoffs/consume',accept='text/html',origin=source)=>new Request(target+'/api/v1/'+path,{method:'POST',body:'workspaceId=space',headers:{origin,accept}});
 const locations=['https://foreign.example/cloud-login/?workspaceId=space&workspaceHandoff=1',target+'/cloud-login/?workspaceId=space&workspaceHandoff=1',
  source+'/cloud-login?workspaceId=space&workspaceHandoff=1',source+'/testcases/umbrella-home/work/?workspaceId=space&workspaceHandoff=1',
  source+'/cloud-login/?workspaceHandoff=1',source+'/cloud-login/?workspaceId=../space&workspaceHandoff=1',
  source+'/cloud-login/?workspaceId=space&workspaceHandoff=0',exact+'&workspaceId=other',exact+'&workspaceHandoff=1',exact+'&returnTo=/admin/',
  exact+'&code=secret',exact+'#secret',source.replace('https:','http:')+'/cloud-login/?workspaceId=space&workspaceHandoff=1',
  source.replace('https://','https://user@')+'/cloud-login/?workspaceId=space&workspaceHandoff=1',exact+'%0a',exact+'&lang=ru'];
 for(const location of locations){
  globalThis.fetch=async()=>new Response(null,{status:303,headers:{location}});
  assert.equal((await worker.fetch(request(),env)).status,502,location);
 }
 globalThis.fetch=async()=>new Response(null,{status:303,headers:{location:exact}});
 assert.equal((await worker.fetch(request('billing/checkout','text/html',target),env)).status,502);
 assert.equal((await worker.fetch(request('auth/workspace-handoffs/consume','application/json'),env)).status,502);
 for(const origin of ['','null','https://foreign.example'])assert.equal((await worker.fetch(request(undefined,undefined,origin),env)).status,403);
 for(const cookie of [`__Host-falcon_cloud_session=${'a'.repeat(43)}; Path=/; HttpOnly; Secure; SameSite=Lax`,
  '__Host-falcon_tenant_session=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax']){
  globalThis.fetch=async()=>new Response(null,{status:303,headers:{location:exact,'set-cookie':cookie}});
  assert.equal((await worker.fetch(request(),env)).status,502);
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
