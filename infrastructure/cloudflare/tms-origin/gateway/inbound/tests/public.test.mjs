import assert from 'node:assert/strict';
import test from 'node:test';
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
