import assert from 'node:assert/strict';
import test from 'node:test';
import { signedApiRequest } from '../../signed-api-request.mjs';
import { proxyCompanyApi } from '../../proxy-company-api.mjs';

const host='acme-falcon.example.test';
const env={FALCON_MANAGED_AUTH_ENABLED:'true',FALCON_COMPANY_DOMAIN_SUFFIX:'example.test',FALCON_PLATFORM_HOSTNAME:'sandbox-falcon.example.test',FALCON_MANAGED_GATEWAY_KEY:'07'.repeat(32),FALCON_API_ORIGIN:'https://api.example.test'};
const binding=`__Host-falcon_federation=${'b'.repeat(43)}`;
test('only exact bounded SAML ACS accepts an IdP cross-origin form POST',async()=>{
 const request=(path,body='SAMLResponse=assertion')=>new Request(`https://${host}${path}`,{method:'POST',body,headers:{origin:'https://idp.example.test','content-type':'application/x-www-form-urlencoded',cookie:binding}});
 const forwarded=await signedApiRequest(request('/api/v1/auth/saml/company-1/acs'),env,'tenant');
 assert.equal(forwarded.headers.get('origin'),'https://idp.example.test');assert.equal(forwarded.headers.get('cookie'),binding);
 await assert.rejects(signedApiRequest(request('/api/v1/auth/email/start'),env,'tenant'),/ORIGIN_DENIED/);
 await assert.rejects(signedApiRequest(request('/api/v1/auth/saml/company-1/acs','x'.repeat(400001)),env,'tenant'),/PAYLOAD_TOO_LARGE/);
});
test('federation allows its bounded host-only binding cookie and safe callback redirects only',async()=>{
 const request=new Request(`https://${host}/api/v1/auth/google/callback?state=opaque&code=opaque`);
 const cookie=`${binding}; Path=/; Max-Age=300; HttpOnly; Secure; SameSite=None`;
 const okay=await proxyCompanyApi(request,env,'tenant',()=>Promise.resolve(new Response(null,{status:303,headers:{location:`https://${host}/testcases/umbrella-home/work/`,'set-cookie':cookie}})));
 assert.equal(okay.status,303);assert.equal(okay.headers.get('set-cookie'),cookie);
 const bad=await proxyCompanyApi(request,env,'tenant',()=>Promise.resolve(new Response(null,{status:303,headers:{location:'https://evil.example/'}})));
 assert.equal(bad.status,502);
 const port=await proxyCompanyApi(request,env,'tenant',()=>Promise.resolve(new Response(null,{status:303,headers:{location:`https://${host}:8443/`}})));
 assert.equal(port.status,502);
 const scope=await proxyCompanyApi(request,env,'tenant',()=>Promise.resolve(new Response(null,{status:200,headers:{'set-cookie':`${cookie}; Domain=example.test`}})));
 assert.equal(scope.status,502);
 const normal=new Request(`https://${host}/api/v1/projects`);
 const leaked=await proxyCompanyApi(normal,env,'tenant',()=>Promise.resolve(new Response(null,{headers:{'set-cookie':cookie}})));
 assert.equal(leaked.status,502);
});

test('company SAML launch sets a company binding and redirects to validated HTTPS IdP',async()=>{
 const request=new Request(`https://${host}/api/v1/auth/saml/launch`);
 const cookie=`${binding}; Path=/; Max-Age=300; HttpOnly; Secure; SameSite=None`;
 const response=await proxyCompanyApi(request,env,'tenant',()=>Promise.resolve(new Response(null,{status:303,headers:{location:'https://idp.example.test/sso','set-cookie':cookie}})));
 assert.equal(response.status,303);assert.equal(response.headers.get('location'),'https://idp.example.test/sso');
});
