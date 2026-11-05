import assert from 'node:assert/strict';
import test from 'node:test';
import worker from '../../../worker.mjs';
const env={FALCON_PUBLIC_AUTH_ENABLED:'true',FALCON_MANAGED_AUTH_ENABLED:'true',FALCON_COMPANY_DOMAIN_SUFFIX:'saturnusgo.com',FALCON_PLATFORM_HOSTNAME:'sandbox-falcon.saturnusgo.com',FALCON_MANAGED_GATEWAY_KEY:'07'.repeat(32),FALCON_API_ORIGIN:'https://api.example.test'};
const source='https://tms.saturnusgo.com',target='https://team-falcon.saturnusgo.com';
test('new personal billing/setup/capability/recovery routes pass only their exact methods',async t=>{
 const original=globalThis.fetch;t.after(()=>globalThis.fetch=original);let calls=0;
 globalThis.fetch=async()=>{calls++;return Response.json({data:{ok:true}});};
 for(const [method,path] of [['GET','billing'],['GET','billing/summary'],['GET','billing/invoices'],['POST','billing/checkout'],['POST','billing/confirm'],['GET','billing/startup-setup'],['PUT','billing/startup-setup'],['POST','billing/startup-setup/retry'],['GET','codex/setup'],['GET','auth/workspace-target'],['POST','auth/workspace-handoffs'],['POST','auth/workspace-handoffs/consume'],['GET','company/domain'],['POST','company/domain/restore'],['GET','company'],['GET','company/members'],['GET','company/agents/codex']]) {
  const response=await worker.fetch(new Request(`${source}/api/v1/${path}`,{method,headers:{origin:source},...(['POST','PUT'].includes(method)?{body:'{}'}:{})}),env);
  assert.equal(response.status,200,`${method} ${path}`);
 }
 const before=calls;
 for(const [method,path] of [['GET','auth/workspace-handoffs/consume'],['POST','codex/setup'],['DELETE','billing/startup-setup'],['POST','platform/company-domains/release'],['GET','company/unknown'],['GET','billing/mock/refund']]) {
  assert.equal((await worker.fetch(new Request(`${source}/api/v1/${path}`,{method,headers:{origin:source}}),env)).status,404,`${method} ${path}`);
 }assert.equal(calls,before);
});
test('cross-origin form consumption is limited to known Falcon sources and the exact consume endpoint',async t=>{
 const original=globalThis.fetch;t.after(()=>globalThis.fetch=original);let forwarded;
 globalThis.fetch=async request=>{forwarded=request;return Response.json({data:{ok:true}});};
 const make=(origin,path='consume')=>new Request(`${target}/api/v1/auth/workspace-handoffs${path?'/'+path:''}`,{method:'POST',body:'code=once',headers:{origin,'content-type':'application/x-www-form-urlencoded'}});
 assert.equal((await worker.fetch(make(source),env)).status,200);assert.equal(forwarded.headers.get('origin'),source);
 for(const origin of ['https://evil.test','https://tms.saturnusgo.com.evil.test','https://sandbox-falcon.saturnusgo.com'])assert.equal((await worker.fetch(make(origin),env)).status,403);
 assert.equal((await worker.fetch(make(source,''),env)).status,403);
});
test('company host forwards its own cloud-owner cookie without selecting another origin or credential type',async t=>{
 const original=globalThis.fetch;t.after(()=>globalThis.fetch=original);let forwarded;
 globalThis.fetch=async request=>{forwarded=request;return Response.json({data:{ok:true}});};
 const cookie=`__Host-falcon_cloud_session=${'a'.repeat(43)}`;
 assert.equal((await worker.fetch(new Request(`${target}/api/v1/bootstrap`,{headers:{cookie:`${cookie}; __Host-falcon_platform_session=ignore`}}),env)).status,200);
 assert.equal(forwarded.headers.get('cookie'),cookie);assert.equal(forwarded.headers.get('x-falcon-host'),'team-falcon.saturnusgo.com');
});
test('central managed MFA and handoff forward only host-bound session kinds while anonymous methods remain isolated',async t=>{
 const original=globalThis.fetch;t.after(()=>globalThis.fetch=original);let forwarded;
 globalThis.fetch=async request=>{forwarded=request;return Response.json({data:{ok:true}});};
 const managed=`__Host-falcon_tenant_session=${'m'.repeat(43)}`;
 for(const [method,path]of [['GET','auth/session'],['POST','auth/mfa/enroll'],['POST','auth/mfa/verify'],['POST','auth/mfa/recovery'],['GET','auth/workspace-target'],['POST','auth/workspace-handoffs'],['GET','bootstrap']]){
  const response=await worker.fetch(new Request(source+'/api/v1/'+path,{method,headers:{origin:source,cookie:managed},...(method==='POST'?{body:'{}'}:{})}),env);
  assert.equal(response.status,200,path);assert.equal(forwarded.headers.get('cookie'),managed,path);
 }
 await worker.fetch(new Request(source+'/api/v1/auth/methods',{headers:{cookie:managed}}),env);assert.equal(forwarded.headers.has('cookie'),false);
});
