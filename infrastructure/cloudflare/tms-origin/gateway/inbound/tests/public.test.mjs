import assert from 'node:assert/strict';
import test from 'node:test';
import { createHash, createHmac } from 'node:crypto';
import worker from '../../../worker.mjs';

const env = { FALCON_PUBLIC_AUTH_ENABLED:'true',FALCON_MANAGED_AUTH_ENABLED:'true',
 FALCON_COMPANY_DOMAIN_SUFFIX:'saturnusgo.com',FALCON_PLATFORM_HOSTNAME:'sandbox-falcon.saturnusgo.com',
 FALCON_MANAGED_GATEWAY_KEY:'07'.repeat(32),FALCON_API_ORIGIN:'https://api.example.test' };
test('public API opt-in forwards only personal cookie and exact auth/business routes', async t => {
 const original=globalThis.fetch; t.after(()=>{globalThis.fetch=original;}); let forwarded;
 globalThis.fetch=async request=>{forwarded=request;return Response.json({data:{ok:true}});};
 const body=JSON.stringify({email:'person@example.test',intent:'signup'});
 const request=()=>new Request('https://tms.saturnusgo.com/api/v1/auth/email/start',{method:'POST',body,headers:{origin:'https://tms.saturnusgo.com',cookie:`__Host-falcon_cloud_session=${'a'.repeat(43)}; __Host-falcon_tenant_session=${'b'.repeat(43)}`,'content-type':'application/json'}});
 assert.equal((await worker.fetch(request(),{})).status,404);
 const response=await worker.fetch(request(),env); assert.equal(response.status,200);
 assert.equal(forwarded.headers.get('cookie'),`__Host-falcon_cloud_session=${'a'.repeat(43)}`);
 assert.equal(forwarded.headers.get('x-falcon-host'),'tms.saturnusgo.com');
 assert.match(forwarded.headers.get('x-falcon-signature'),/^[a-f0-9]{64}$/);
 for(const path of ['company/members','company/sso','cloud-auth/register','cloud-auth/login','falcon-oauth/token','mcp','unknown']){
  assert.equal((await worker.fetch(new Request(`https://tms.saturnusgo.com/api/v1/${path}`),env)).status,404,path);
 }
 assert.equal((await worker.fetch(new Request('https://tms.saturnusgo.com/api/v1/projects'),env)).status,200);
 const cross=new Request('https://tms.saturnusgo.com/api/v1/auth/email/start',{method:'POST',body,headers:{origin:'https://evil.example','content-type':'application/json'}});
 assert.equal((await worker.fetch(cross,env)).status,403);
});

test('only explicit email verification and resend forward the Google proof browser binding',async t=>{
 const original=globalThis.fetch;t.after(()=>{globalThis.fetch=original;});let forwarded;
 globalThis.fetch=async request=>{forwarded=request;return Response.json({data:{ok:true}});};
 const binding=`__Host-falcon_federation=${'g'.repeat(43)}`;
 for(const action of ['verify','resend']){
  const url=`https://tms.saturnusgo.com/api/v1/auth/email/${action}`;
  const response=await worker.fetch(new Request(url,{method:'POST',body:'{}',headers:{origin:'https://tms.saturnusgo.com',cookie:binding}}),env);
  assert.equal(response.status,200);assert.equal(forwarded.headers.get('cookie'),binding);
  assert.equal((await worker.fetch(new Request(url,{method:'POST',body:'{}',headers:{origin:'https://evil.example',cookie:binding}}),env)).status,403);
 }
});

test('personal workspace bootstrap can load canonical links through the signed gateway', async t => {
 const original=globalThis.fetch; t.after(()=>{globalThis.fetch=original;}); const calls=[];
 globalThis.fetch=async request=>{calls.push(request);return Response.json({data:[],meta:{hasMore:false,nextCursor:null}});};
 const projectId='project_95cb98ed-2d77-4588-84b6-77224b72c1a8';
 const cookie=`__Host-falcon_cloud_session=${'p'.repeat(43)}`;
 for(const path of [`/links?projectId=${projectId}&limit=100`,'/links/link_123']) {
  const response=await worker.fetch(new Request(`https://tms.saturnusgo.com/api/v1${path}`,{
   headers:{cookie:`${cookie}; __Host-falcon_tenant_session=${'t'.repeat(43)}`},
  }),{...env,FALCON_LEGACY_HOST_MANAGED:'false'});
  assert.equal(response.status,200,path);
  const forwarded=calls.at(-1);
  assert.equal(forwarded.url,`https://api.example.test/api/v1${path}`);
  assert.equal(forwarded.headers.get('cookie'),cookie);
  assert.equal(forwarded.headers.get('x-falcon-host'),'tms.saturnusgo.com');
  assert.match(forwarded.headers.get('x-falcon-signature'),/^[a-f0-9]{64}$/);
 }
 assert.equal(calls.length,2);
 for(const path of ['links-admin','company/links']) {
  assert.equal((await worker.fetch(new Request(`https://tms.saturnusgo.com/api/v1/${path}`),env)).status,404);
 }
});

const personalFeatureRoutes = [
 ...['summary','test-cases','runs','run-items','defects'].map(name=>['GET',`dashboard-analytics/${name}`]),
 ['GET','execution-history'], ['POST','test-case-import/inspect'], ['POST','test-case-import/normalize'],
 ['GET','impact/repositories'], ['PATCH','impact/repositories/repo_123'],
 ['GET','impact/analyses'], ['GET','impact/analyses/analysis_123'],
 ...['scope','approve','retry','gaps/gap_123/generate','gaps/gap_123/acknowledge'].map(action=>['POST',`impact/analyses/analysis_123/${action}`]),
 ['GET','me/profile'], ['PATCH','me/profile'], ['GET','me/profile/activity'],
 ...['avatar','banner'].flatMap(kind=>[['POST',`me/profile/${kind}`],['DELETE',`me/profile/${kind}`]]),
];
test('personal feature requests retain exact query/body, session isolation and verifiable signing',async t=>{
 const original=globalThis.fetch;t.after(()=>{globalThis.fetch=original;});const calls=[];
 globalThis.fetch=async request=>{calls.push(request);return Response.json({data:{ok:true}});};
 const cookie=`__Host-falcon_cloud_session=${'p'.repeat(43)}`;
 const digest=value=>createHash('sha256').update(value).digest('hex');
 for(const [method,path] of personalFeatureRoutes){
  const target=`/api/v1/${path}?workspaceId=personal_123&projectId=project_123`;
  const body=method==='GET'?'':'{"selection":"kept"}';
  const response=await worker.fetch(new Request(`https://tms.saturnusgo.com${target}`,{method,
   headers:{origin:'https://tms.saturnusgo.com',cookie:`${cookie}; __Host-falcon_tenant_session=${'t'.repeat(43)}; __Host-falcon_federation=${'f'.repeat(43)}`,
    authorization:'Bearer spoofed','content-type':'application/json','x-falcon-host':'other.example'},...(body?{body}:{})}),env);
  assert.equal(response.status,200,`${method} ${path}`);
  const forwarded=calls.at(-1);assert.equal(forwarded.url,`https://api.example.test${target}`);
  assert.equal(forwarded.headers.get('cookie'),cookie);assert.equal(forwarded.headers.get('authorization'),null);
  assert.equal(forwarded.headers.get('x-falcon-host'),'tms.saturnusgo.com');assert.equal(await forwarded.text(),body);
  const canonical=JSON.stringify(['falcon-gateway-v1',method,target,'tms.saturnusgo.com',
   forwarded.headers.get('x-falcon-time'),'','https://tms.saturnusgo.com',digest(cookie),digest(body)]);
  assert.equal(forwarded.headers.get('x-falcon-signature'),createHmac('sha256',Buffer.from(env.FALCON_MANAGED_GATEWAY_KEY,'hex')).update(canonical).digest('hex'));
 }
 assert.equal(calls.length,personalFeatureRoutes.length);
});

test('personal feature routes reject unsupported paths/methods/hosts and preserve CSRF and backend denial',async t=>{
 const original=globalThis.fetch;t.after(()=>{globalThis.fetch=original;});let calls=0;
 globalThis.fetch=async()=>{calls++;return Response.json({error:{code:'ACCESS_DENIED'}},{status:403});};
 const denied=[['POST','dashboard-analytics/summary'],['GET','dashboard-analytics/admin'],['DELETE','execution-history'],
  ['GET','test-case-import/inspect'],['POST','test-case-import/admin'],['DELETE','impact/analyses/analysis_123'],
  ['POST','impact/analyses/analysis_123/delete'],['POST','impact/analyses/analysis_123/gaps/gap_123/delete'],
  ['PUT','impact/repositories/repo_123'],['GET','impact/admin'],['GET','impact-extra/analyses'],
  ['GET','company/impact'],['GET','platform/execution-history'],['POST','auth/admin'],
  ['GET','me'],['GET','me/sessions'],['GET','me/profile/admin'],['GET','me/profile/user_123'],
  ['POST','me/profile'],['DELETE','me/profile'],['PUT','me/profile'],['PATCH','me/profile/avatar'],
  ['GET','me/profile/banner'],['GET','me/profile/avatar'],['POST','me/profile/activity'],
  ['DELETE','me/profile/activity'],['GET','me/profile/activity/export'],['GET','me/profiles']];
 for(const [method,path] of denied) assert.equal((await worker.fetch(new Request(`https://tms.saturnusgo.com/api/v1/${path}`,{
  method,headers:{origin:'https://tms.saturnusgo.com'}}),env)).status,404,`${method} ${path}`);
 assert.equal((await worker.fetch(new Request('https://evil.example/api/v1/execution-history'),env)).status,404);
 assert.equal((await worker.fetch(new Request('https://tms.saturnusgo.com/api/v1/execution-history'),{...env,FALCON_PUBLIC_AUTH_ENABLED:'false'})).status,404);
 for(const [method,path] of personalFeatureRoutes.filter(([method])=>method!=='GET')){
  for(const origin of ['https://evil.example','']) assert.equal((await worker.fetch(new Request(`https://tms.saturnusgo.com/api/v1/${path}`,{
   method,headers:{origin},body:'{}'}),env)).status,403,`${method} ${path} origin=${origin}`);
 }
 assert.equal(calls,0,'denied requests never reach the backend');
 const response=await worker.fetch(new Request('https://tms.saturnusgo.com/api/v1/execution-history'),env);
 assert.equal(response.status,403);assert.equal((await response.json()).error.code,'ACCESS_DENIED');assert.equal(calls,1);
});

test('self profile keeps signed private media grants and conditional update headers intact',async t=>{
 const original=globalThis.fetch;t.after(()=>{globalThis.fetch=original;});const calls=[];
 const grant={url:'https://private.r2.cloudflarestorage.com/profiles/fixture/avatar/image.webp?X-Amz-Expires=60&X-Amz-Signature=fixture',
  expiresAt:'2026-11-04T12:01:00.000Z'};
 const payload={data:{id:'person_123',name:'QA',avatar:grant,banner:grant,version:7}};
 globalThis.fetch=async request=>{calls.push(request);return Response.json(payload,{headers:{'cache-control':'public, max-age=3600',etag:'"7"'}});};
 const response=await worker.fetch(new Request('https://tms.saturnusgo.com/api/v1/me/profile'),env);
 assert.equal(response.status,200);assert.deepEqual(await response.json(),payload);
 assert.equal(response.headers.get('cache-control'),'private, no-store, no-transform');
 assert.equal(response.headers.get('etag'),'"7"');assert.equal(response.headers.get('x-robots-tag'),'noindex, nofollow');
 assert.match(response.headers.get('content-security-policy'),/img-src [^;]*https:\/\/\*\.r2\.cloudflarestorage\.com/);
 for(const kind of ['avatar','banner']){
  const target=`https://tms.saturnusgo.com/api/v1/me/profile/${kind}`;
  const result=await worker.fetch(new Request(target,{method:'POST',body:'{"imageBase64":"fixture"}',
   headers:{origin:'https://tms.saturnusgo.com','content-type':'application/json','if-match':'"7"','idempotency-key':'image-123'}}),env);
  assert.equal(result.status,200);const forwarded=calls.at(-1);
  assert.equal(forwarded.headers.get('if-match'),'"7"');assert.equal(forwarded.headers.get('idempotency-key'),'image-123');
 }
});

test('self profile preserves backend authentication failures without public caching or media fallback',async t=>{
 const original=globalThis.fetch;t.after(()=>{globalThis.fetch=original;});const calls=[];
 globalThis.fetch=async request=>{calls.push(request);return Response.json({error:{code:'AUTHENTICATION_REQUIRED'}},{status:401});};
 for(const path of ['me/profile','me/profile/activity?workspaceId=personal_123&days=90']){
  const response=await worker.fetch(new Request(`https://tms.saturnusgo.com/api/v1/${path}`),env);
  assert.equal(response.status,401,path);assert.equal((await response.json()).error.code,'AUTHENTICATION_REQUIRED');
  assert.equal(response.headers.get('cache-control'),'private, no-store, no-transform');
  assert.equal(calls.at(-1).url,`https://api.example.test/api/v1/${path}`);
  assert.equal(calls.at(-1).headers.get('cookie'),null);
 }
});
