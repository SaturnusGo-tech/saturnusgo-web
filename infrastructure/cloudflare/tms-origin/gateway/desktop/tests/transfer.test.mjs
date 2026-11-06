import assert from 'node:assert/strict';
import test from 'node:test';
import worker from '../../../worker.mjs';
import {signedApiRequest} from '../../signed-api-request.mjs';
import {proxyCompanyApi} from '../../proxy-company-api.mjs';

const publicOrigin='https://tms.saturnusgo.com',companyOrigin='https://scope-falcon.example.test';
const env={FALCON_PUBLIC_AUTH_ENABLED:'true',FALCON_MANAGED_AUTH_ENABLED:'true',FALCON_COMPANY_DOMAIN_SUFFIX:'example.test',
 FALCON_PLATFORM_HOSTNAME:'sandbox-falcon.example.test',FALCON_MANAGED_GATEWAY_KEY:'07'.repeat(32),FALCON_API_ORIGIN:'https://api.example.test'};
const root='/api/v1/auth/desktop/',token='t'.repeat(43);
const cookie=name=>`${name}=${token}; Path=/; Max-Age=3600; HttpOnly; Secure; SameSite=Lax`;
const proof={transferCode:'p'.repeat(43),workspaceId:'company-scope',codeVerifier:'v'.repeat(64),state:'s'.repeat(32),redirectUri:'http://127.0.0.1:49152/falcon-auth/callback'};
const request=(origin,path,method='POST',headers={})=>new Request(origin+path,{method,headers:{origin,'content-type':'application/json',...headers},
 ...(['GET','HEAD'].includes(method)?{}:{body:JSON.stringify(proof)})});

test('central desktop redemption is an exact POST route and forwards its original bounded proof and signed target host',async t=>{
 const previous=globalThis.fetch;t.after(()=>{globalThis.fetch=previous;});let calls=0;
 globalThis.fetch=async upstream=>{
  calls++;assert.equal(new URL(upstream.url).pathname,root+'redeem');assert.equal(upstream.headers.get('x-falcon-host'),'tms.saturnusgo.com');
  assert.match(upstream.headers.get('x-falcon-signature'),/^[a-f0-9]{64}$/);assert.deepEqual(await upstream.json(),proof);
  return new Response(null,{status:204,headers:{'set-cookie':cookie('__Host-falcon_tenant_session')}});
 };
 const accepted=await worker.fetch(request(publicOrigin,root+'redeem'),env);
 assert.equal(accepted.status,204);assert.equal(accepted.headers.get('set-cookie'),cookie('__Host-falcon_tenant_session'));assert.equal(calls,1);
 for(const [path,method] of [[root+'redeem','GET'],[root+'redeem','PATCH'],[root+'redeem/','POST'],[root+'redeem-other','POST']]){
  assert.equal((await worker.fetch(request(publicOrigin,path,method),env)).status,404,`${method} ${path}`);
 }
 assert.equal((await worker.fetch(request(publicOrigin,root+'redeem','POST',{origin:companyOrigin}),env)).status,403);
 assert.equal(calls,1,'lookalikes, other methods and a foreign Origin never contact the backend');
});

test('central desktop authorize alone forwards its existing host-only managed session beside the cloud session',async()=>{
 const browserCookies=`__Host-falcon_cloud_session=cloud; __Host-falcon_tenant_session=managed; unrelated=private`;
 const authorized=await signedApiRequest(request(publicOrigin,root+`authorize?attempt=${'a'.repeat(43)}&workspaceId=company-scope`,'GET',{cookie:browserCookies}),env,'personal');
 assert.equal(authorized.headers.get('cookie'),'__Host-falcon_cloud_session=cloud; __Host-falcon_tenant_session=managed');
 for(const path of [root+'start',root+'exchange',root+'redeem',root+'cancel','/api/v1/auth/methods','/api/v1/auth/desktop/authorize-other']){
  const upstream=await signedApiRequest(request(publicOrigin,path,path.endsWith('methods')||path.endsWith('authorize-other')?'GET':'POST',{cookie:browserCookies}),env,'personal');
  assert.equal(upstream.headers.get('cookie'),'__Host-falcon_cloud_session=cloud',path);
 }
 await assert.rejects(signedApiRequest(request(publicOrigin,root+'authorize','POST',{cookie:browserCookies}),env,'personal'),{code:'METHOD_NOT_ALLOWED'});
});

test('only completed exact desktop exchange or redeem can return the alternate scoped host-only session kind',async()=>{
 for(const [origin,audience,name] of [[publicOrigin,'personal','__Host-falcon_tenant_session'],[companyOrigin,'tenant','__Host-falcon_cloud_session']]){
  for(const operation of ['exchange','redeem']){
   const result=await proxyCompanyApi(request(origin,root+operation),env,audience,async()=>new Response(null,{status:204,headers:{'set-cookie':cookie(name)}}));
   assert.equal(result.status,204,`${audience} ${operation}`);assert.equal(result.headers.get('set-cookie'),cookie(name));
  }
  for(const [path,status,method] of [[root+'start',204,'POST'],[root+'cancel',204,'POST'],[root+'redeem/child',204,'POST'],
   [root+'redeem-other',204,'POST'],['/api/v1/projects',204,'POST'],[root+'authorize',204,'GET'],[root+'redeem',200,'POST'],[root+'redeem',400,'POST']]){
   const response=await proxyCompanyApi(request(origin,path,method),env,audience,async()=>new Response(null,{status,headers:{'set-cookie':cookie(name)}}));
   assert.equal(response.status,502,`${audience} ${method} ${path} ${status}`);
  }
 }
});

test('desktop target cookies cannot set a Domain or weaken the existing Secure HttpOnly root-path Lax boundary',async()=>{
 const valid=cookie('__Host-falcon_cloud_session');
 for(const unsafe of [valid+'; Domain=scope-falcon.example.test',valid+'; Domain=.example.test',valid.replace('Secure; ',''),
  valid.replace('HttpOnly; ',''),valid.replace('Path=/;','Path=/api/;'),valid.replace('SameSite=Lax','SameSite=None'),
  valid.replace('__Host-falcon_cloud_session','__Host-falcon_platform_session'),valid.replace(token,'short')]){
  const response=await proxyCompanyApi(request(companyOrigin,root+'redeem'),env,'tenant',async()=>new Response(null,{status:204,headers:{'set-cookie':unsafe}}));
  assert.equal(response.status,502,unsafe);assert.equal(response.headers.get('set-cookie'),null);
 }
});
