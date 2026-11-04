import assert from 'node:assert/strict';
import test from 'node:test';
import worker from '../../../worker.mjs';
import { proxyCompanyApi } from '../../proxy-company-api.mjs';

const env={FALCON_PUBLIC_AUTH_ENABLED:'true',FALCON_MANAGED_AUTH_ENABLED:'true',FALCON_COMPANY_DOMAIN_SUFFIX:'example.test',FALCON_PLATFORM_HOSTNAME:'sandbox-falcon.example.test',FALCON_MANAGED_GATEWAY_KEY:'07'.repeat(32),FALCON_API_ORIGIN:'https://api.example.test'};
const target=`http://127.0.0.1:45321/falcon-auth/callback?code=${'c'.repeat(43)}&state=${'s'.repeat(22)}`;
test('public desktop broker routes are explicitly enabled and sign exact requests',async t=>{
 const previous=globalThis.fetch;t.after(()=>{globalThis.fetch=previous;});let count=0;
 globalThis.fetch=async request=>{count++;assert.match(request.headers.get('x-falcon-signature'),/^[a-f0-9]{64}$/);return new Response(null,{status:request.method==='POST'?204:200});};
 for(const [name,method] of [['start','POST'],['authorize','GET'],['exchange','POST'],['cancel','POST']]){
  const request=()=>new Request(`https://tms.saturnusgo.com/api/v1/auth/desktop/${name}`,{method,headers:{origin:'https://tms.saturnusgo.com'},...(method==='POST'?{body:'{}'}:{})});
  assert.equal((await worker.fetch(request(),{})).status,404);
  assert.equal((await worker.fetch(request(),env)).status,method==='POST'?204:200,name);
 }
 assert.equal(count,4);
});
test('only desktop authorize GET may redirect to its exact canonical loopback callback',async()=>{
 for(const [audience,host] of [['personal','tms.saturnusgo.com'],['tenant','acme-falcon.example.test']]){
  const request=new Request(`https://${host}/api/v1/auth/desktop/authorize?attempt=opaque`);
  const respond=location=>()=>Promise.resolve(new Response(null,{status:303,headers:{location}}));
  const accepted=await proxyCompanyApi(request,env,audience,respond(target));
  assert.equal(accepted.status,303);assert.equal(accepted.headers.get('location'),target);
  for(const location of [target.replace('127.0.0.1','localhost'),target.replace('127.0.0.1','evil.example'),target.replace(':45321',':80'),target.replace('/falcon-auth/callback','/other'),target.replace('http:','https:'),target+'&extra=secret',target+'#fragment']){
   assert.equal((await proxyCompanyApi(request,env,audience,respond(location))).status,502,location);
  }
  for(const path of ['projects','auth/desktop/start','auth/desktop/exchange','auth/desktop/cancel','auth/google/callback']){
   const post=path.startsWith('auth/desktop/');
   const other=new Request(`https://${host}/api/v1/${path}`,{method:post?'POST':'GET',headers:{origin:`https://${host}`},...(post?{body:'{}'}:{})});
   assert.equal((await proxyCompanyApi(other,env,audience,respond(target))).status,502,path);
  }
 }
});
