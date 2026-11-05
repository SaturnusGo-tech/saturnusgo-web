import assert from 'node:assert/strict';
import {createHash,createHmac}from 'node:crypto';
import test from 'node:test';
import worker from '../../../worker.mjs';
const env={FALCON_PUBLIC_AUTH_ENABLED:'true',FALCON_MANAGED_AUTH_ENABLED:'true',FALCON_COMPANY_DOMAIN_SUFFIX:'saturnusgo.com',FALCON_PLATFORM_HOSTNAME:'sandbox-falcon.saturnusgo.com',FALCON_MANAGED_GATEWAY_KEY:'07'.repeat(32),FALCON_API_ORIGIN:'https://api.example.test'};
const origin='https://tms.saturnusgo.com',digest=value=>createHash('sha256').update(value).digest('hex');
test('only fixed central MCP retains bearer and protocol metadata in its v2 signed request',async t=>{
 const old=globalThis.fetch;t.after(()=>globalThis.fetch=old);let forwarded;
 globalThis.fetch=async request=>{forwarded=request;return Response.json({jsonrpc:'2.0',result:{}});};
 const body='{"jsonrpc":"2.0","method":"initialize","id":1}',authorization='Bearer scoped-personal-grant';
 const response=await worker.fetch(new Request(origin+'/api/v1/mcp',{method:'POST',body,headers:{authorization,'mcp-protocol-version':'2025-11-25','mcp-session-id':'session','x-workspace-id':'forged','x-actor':'admin'}}),env);
 assert.equal(response.status,200);assert.equal(forwarded.headers.get('authorization'),authorization);assert.equal(forwarded.headers.has('x-workspace-id'),false);assert.equal(forwarded.headers.has('x-actor'),false);
 const canonical=JSON.stringify(['falcon-gateway-v2','POST','/api/v1/mcp','tms.saturnusgo.com',forwarded.headers.get('x-falcon-time'),'','',digest(''),digest(body),digest(authorization)]);
 assert.equal(forwarded.headers.get('x-falcon-signature'),'v2:'+createHmac('sha256',Buffer.from(env.FALCON_MANAGED_GATEWAY_KEY,'hex')).update(canonical).digest('hex'));
 for(const address of ['https://evil.test/api/v1/mcp','https://tms.saturnusgo.com.evil.test/api/v1/mcp',origin+'/api/v1/mcp-other'])assert.equal((await worker.fetch(new Request(address,{method:'POST',body}),env)).status,404);
});
test('central OAuth token and registration permit originless provider POST while interactions remain origin-bound',async t=>{
 const old=globalThis.fetch;t.after(()=>globalThis.fetch=old);let forwarded;
 globalThis.fetch=async request=>{forwarded=request;return Response.json({ok:true});};
 for(const path of ['token','reg','token/revocation']){assert.equal((await worker.fetch(new Request(origin+'/api/v1/falcon-oauth/'+path,{method:'POST',body:'grant_type=test'}),env)).status,200);assert.match(forwarded.headers.get('x-falcon-signature'),/^[a-f0-9]{64}$/);}
 assert.equal((await worker.fetch(new Request(origin+'/api/v1/falcon-oauth/interaction/id',{method:'POST',body:'{}'}),env)).status,403);
 for(const path of ['jwks','.well-known/openid-configuration','auth/uid','interaction/uid','connections'])assert.equal((await worker.fetch(new Request(origin+'/api/v1/falcon-oauth/'+path),env)).status,200,path);
 for(const path of ['other','token/extra'])assert.equal((await worker.fetch(new Request(origin+'/api/v1/falcon-oauth/'+path),env)).status,404,path);
});
test('central well-known aliases and exact OAuth consent CSP remain available without broadening ordinary pages',async t=>{
 const old=globalThis.fetch;t.after(()=>globalThis.fetch=old);let forwarded;
 const policy="default-src 'none'; script-src 'none'; style-src 'unsafe-inline'; form-action 'self' https://client.example/callback; base-uri 'none'; frame-ancestors 'none'";
 globalThis.fetch=async request=>{forwarded=request;return new Response('<form></form>',{headers:{'content-type':'text/html','content-security-policy':policy}});};
 for(const path of ['/.well-known/oauth-authorization-server/api/v1/falcon-oauth','/.well-known/oauth-protected-resource/api/v1/mcp']){assert.equal((await worker.fetch(new Request(origin+path),env)).status,200);assert.match(forwarded.url,/api\/v1\/(?:falcon-oauth\/\.well-known\/openid-configuration|mcp\/resource-metadata)$/);}
 assert.equal((await worker.fetch(new Request(origin+'/api/v1/falcon-oauth/interaction/uid'),env)).headers.get('content-security-policy'),policy);
});
