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
