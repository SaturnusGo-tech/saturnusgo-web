import assert from 'node:assert/strict';
import {createHash, createHmac} from 'node:crypto';
import test from 'node:test';
import worker from '../../../worker.mjs';
import {proxyCompanyApi} from '../../proxy-company-api.mjs';
import {signedApiRequest} from '../../signed-api-request.mjs';

const origin = 'https://tms.saturnusgo.com';
const env = {FALCON_PUBLIC_AUTH_ENABLED:'true', FALCON_MANAGED_GATEWAY_KEY:'07'.repeat(32),
 FALCON_API_ORIGIN:'https://api.example.test'};
const cloud = `__Host-falcon_cloud_session=${'c'.repeat(43)}`;
const tenant = `__Host-falcon_tenant_session=${'t'.repeat(43)}`;
const chooser = `__Host-falcon_spaces=${'s'.repeat(43)}`;
const emailProof = `__Host-falcon_space_email=${'e'.repeat(43)}`;
const attributes = '; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax';
const tenantExpiry = '__Host-falcon_tenant_session=' + attributes;
const emailExpiry = '__Host-falcon_space_email=' + attributes;
const emailCookie = `${emailProof}; Path=/; Max-Age=300; HttpOnly; Secure; SameSite=Lax`;
const request = (path, method='POST', cookie=[cloud, tenant, chooser, emailProof].join('; ')) =>
 new Request(origin + path, {method, headers:{origin, cookie, 'content-type':'application/json'},
  ...(method === 'GET' ? {} : {body:'{}'})});
const proxy = (path, cookie, status=200, method='POST', audience='personal') =>
 proxyCompanyApi(request(path, method), env, audience,
  async () => Response.json({data:{redirectUrl:'https://jev-falcon.saturnusgo.com/cloud-login/'}},
   {status, headers:{'set-cookie':cookie, 'x-request-id':'selection-request'}}));

test('successful neutral company selection expires stale tenant state without forwarding it or issuing a session', async t => {
 const previous = globalThis.fetch; t.after(() => {globalThis.fetch = previous;});
 for (const path of ['/api/v1/auth/company/resolve', '/api/v1/auth/spaces/select']) {
  let incoming;
  const payload = {data:{redirectUrl:'https://jev-falcon.saturnusgo.com/cloud-login/'}};
  globalThis.fetch = async value => {
   incoming = value;
   return Response.json(payload, {headers:{'set-cookie':tenantExpiry, 'x-request-id':'selection-request'}});
  };
  const response = await worker.fetch(request(path), env);
  assert.equal(response.status, 200, path);
  assert.equal(response.headers.get('set-cookie'), tenantExpiry);
  assert.equal(response.headers.get('x-request-id'), 'selection-request');
  assert.equal(response.headers.get('cache-control'), 'private, no-store, no-transform');
  assert.deepEqual(await response.json(), payload);
  const expected = path.endsWith('/select') ? [cloud, chooser, emailProof].join('; ') : cloud;
  assert.equal(incoming.headers.get('cookie'), expected);
  assert.equal(incoming.headers.get('x-falcon-host'), 'tms.saturnusgo.com');
  const hash = value => createHash('sha256').update(value).digest('hex');
  const canonical = JSON.stringify(['falcon-gateway-v1', 'POST', path, 'tms.saturnusgo.com',
   incoming.headers.get('x-falcon-time'), '', origin, hash(expected), hash('{}')]);
  assert.equal(incoming.headers.get('x-falcon-signature'),
   createHmac('sha256', Buffer.from(env.FALCON_MANAGED_GATEWAY_KEY, 'hex')).update(canonical).digest('hex'));
 }
});

test('neutral selection allows only a successful exact-route empty tenant expiry', async () => {
 for (const path of ['/api/v1/auth/company/resolve', '/api/v1/auth/spaces/select']) {
  for (const cookie of [
   `${tenant}; Path=/; Max-Age=300; HttpOnly; Secure; SameSite=Lax`,
   tenantExpiry.replace('Max-Age=0', 'Max-Age=300'),
   tenantExpiry.replace('Max-Age=0', 'Max-Age=-1'),
   tenantExpiry.replace('Path=/', 'Path=/api'),
   tenantExpiry.replace('; Secure', ''),
   tenantExpiry.replace('; HttpOnly', ''),
   tenantExpiry.replace('SameSite=Lax', 'SameSite=None'),
   `${tenantExpiry}; Domain=saturnusgo.com`,
   `${tenantExpiry}; Max-Age=300`,
   `${tenantExpiry}; Path=/other`,
  ]) assert.equal((await proxy(path, cookie)).status, 502, `${path}: ${cookie}`);
  for (const status of [400, 401, 403, 500]) assert.equal((await proxy(path, tenantExpiry, status)).status, 502);
  assert.equal((await proxy(path, tenantExpiry, 200, 'GET')).status, 502);
  assert.equal((await proxy(path, tenantExpiry, 200, 'POST', 'platform')).status, 502);
 }
 for (const path of ['/api/v1/auth/email/verify', '/api/v1/auth/company/resolve/extra', '/api/v1/projects']) {
  assert.equal((await proxy(path, tenantExpiry)).status, 502, path);
 }
});

test('verified email chooser proof issues only on successful verification and expires only on selection or cancellation', async () => {
 const verified = await proxy('/api/v1/auth/email/verify', emailCookie);
 assert.equal(verified.status, 200);
 assert.equal(verified.headers.get('set-cookie'), emailCookie);
 for (const path of ['/api/v1/auth/spaces/select', '/api/v1/auth/federation/cancel']) {
  const expired = await proxy(path, emailExpiry);
  assert.equal(expired.status, 200, path);
  assert.equal(expired.headers.get('set-cookie'), emailExpiry);
  assert.equal((await proxy(path, emailCookie)).status, 502, 'selection cannot issue proof');
  assert.equal((await proxy(path, emailExpiry, 400)).status, 502, 'failed selection cannot expire proof');
 }
 for (const cookie of [emailExpiry, emailCookie.replace('Max-Age=300', 'Max-Age=0'),
  emailCookie.replace('Max-Age=300', 'Max-Age=301'), emailCookie.replace('e'.repeat(43), 'e'.repeat(42)),
  emailCookie.replace('Path=/', 'Path=/api'), emailCookie.replace('; Secure', ''),
  emailCookie.replace('; HttpOnly', ''), emailCookie.replace('SameSite=Lax', 'SameSite=None'),
  `${emailCookie}; Domain=saturnusgo.com`, `${emailCookie}; Max-Age=0`]) {
  assert.equal((await proxy('/api/v1/auth/email/verify', cookie)).status, 502, cookie);
 }
 for (const path of ['/api/v1/auth/google/callback', '/api/v1/auth/email/resend', '/api/v1/auth/company/resolve', '/api/v1/projects']) {
  assert.equal((await proxy(path, emailCookie, 200, path.includes('/google/') ? 'GET' : 'POST')).status, 502, path);
 }
 assert.equal((await proxy('/api/v1/auth/email/verify', emailCookie, 401)).status, 502);
 assert.equal((await proxy('/api/v1/auth/email/verify', emailCookie, 200, 'GET')).status, 502);
 assert.equal((await proxy('/api/v1/auth/email/verify', emailCookie, 200, 'POST', 'tenant')).status, 502);
});

test('verified email proof forwards only with explicit personal chooser and cancellation requests', async () => {
 const allowed = [['GET', '/api/v1/auth/spaces'], ['POST', '/api/v1/auth/spaces/select'],
  ['POST', '/api/v1/auth/federation/cancel']];
 const denied = [['POST', '/api/v1/auth/spaces'], ['GET', '/api/v1/auth/spaces/select'],
  ['GET', '/api/v1/auth/federation/cancel'], ['POST', '/api/v1/auth/company/resolve'],
  ['POST', '/api/v1/auth/email/verify'], ['POST', '/api/v1/auth/email/resend'],
  ['GET', '/api/v1/auth/google/callback'], ['GET', '/api/v1/projects']];
 for (const [method, path] of allowed) {
  const incoming = await signedApiRequest(request(path, method), env, 'personal');
  assert.ok(incoming.headers.get('cookie')?.includes(emailProof), `${method} ${path}`);
  assert.ok(!incoming.headers.get('cookie')?.includes(tenant), 'stale tenant is stripped from neutral auth');
 }
 for (const [method, path] of denied) {
  const incoming = await signedApiRequest(request(path, method), env, 'personal');
  assert.ok(!incoming.headers.get('cookie')?.includes(emailProof), `${method} ${path}`);
 }
 for (const audience of ['tenant', 'platform']) for (const [method, path] of allowed) {
  const incoming = await signedApiRequest(request(path, method), env, audience);
  assert.ok(!incoming.headers.get('cookie')?.includes(emailProof), `${audience}: ${method} ${path}`);
 }
 const cross = new Request(origin + '/api/v1/auth/spaces/select',
  {method:'POST', body:'{}', headers:{origin:'https://evil.example', cookie:emailProof}});
 await assert.rejects(signedApiRequest(cross, env, 'personal'), {status:403, code:'ORIGIN_DENIED'});
});

test('email company chooser can carry its two browser proofs through listing and selection together', async t => {
 const previous = globalThis.fetch; t.after(() => {globalThis.fetch = previous;});
 const chooserCookie = `${chooser}; Path=/; Max-Age=300; HttpOnly; Secure; SameSite=Lax`;
 globalThis.fetch = async incoming => {
  const path = new URL(incoming.url).pathname;
  const headers = new Headers();
  if (path === '/api/v1/auth/email/verify') {
   headers.append('set-cookie', chooserCookie);
   headers.append('set-cookie', emailCookie);
  } else {
   assert.equal(incoming.headers.get('cookie'), [chooser, emailProof].join('; '));
   if (path.endsWith('/select')) for (const cookie of [
    '__Host-falcon_spaces=' + attributes, emailExpiry, tenantExpiry,
   ]) headers.append('set-cookie', cookie);
  }
  return Response.json({data:{ok:true}}, {headers});
 };
 const verified = await worker.fetch(request('/api/v1/auth/email/verify', 'POST', ''), env);
 assert.equal(verified.status, 200);
 assert.deepEqual(verified.headers.getSetCookie(), [chooserCookie, emailCookie]);
 const browser = [chooser, emailProof, tenant].join('; ');
 assert.equal((await worker.fetch(request('/api/v1/auth/spaces', 'GET', browser), env)).status, 200);
 const selected = await worker.fetch(request('/api/v1/auth/spaces/select', 'POST', browser), env);
 assert.equal(selected.status, 200);
 assert.deepEqual(selected.headers.getSetCookie(), ['__Host-falcon_spaces=' + attributes, emailExpiry, tenantExpiry]);
});
