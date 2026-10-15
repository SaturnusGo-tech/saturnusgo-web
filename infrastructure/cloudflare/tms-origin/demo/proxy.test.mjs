import test from 'node:test';
import assert from 'node:assert/strict';
import { proxyDemo } from './proxy.mjs';
const env = { FALCON_DEMO_API_KEY: 'test-key-'.repeat(8) };
const request = (headers = {}, body = '{}', method = 'POST') => new Request('https://tms.saturnusgo.com/api/falcon-demo/request', {
  method, headers: { Origin: 'https://tms.saturnusgo.com', 'Content-Type': 'application/json', 'CF-Connecting-IP': '192.0.2.10', ...headers }, body: method === 'GET' ? undefined : body,
});
test('demo proxy rejects unsupported input before calling the backend', async () => {
  const forbidden = () => { throw new Error('must not send'); };
  assert.equal((await proxyDemo(request({}, '{}', 'GET'), env, forbidden)).status, 405);
  assert.equal((await proxyDemo(request({ Origin: 'https://other.example' }), env, forbidden)).status, 403);
  assert.equal((await proxyDemo(request({ 'Content-Type': 'text/plain' }), env, forbidden)).status, 415);
  assert.equal((await proxyDemo(request({}, 'x'.repeat(2049)), env, forbidden)).status, 413);
  assert.equal((await proxyDemo(request({}, '{'), env, forbidden)).status, 400);
  assert.equal((await proxyDemo(request(), {}, forbidden)).status, 503);
});
test('demo proxy overwrites caller metadata with a private key and HMAC, never forwards cookies', async () => {
  let seen;
  const transport = async (url, options) => { seen = { url, ...options }; return Response.json({ status: 'accepted' }); };
  const response = await proxyDemo(request({ Cookie: 'session=private', 'x-falcon-demo-client': 'forged' }), env, transport);
  assert.equal(response.status, 200); assert.equal(response.headers.get('Cache-Control'), 'no-store');
  assert.match(seen.headers['x-falcon-demo-client'], /^[a-f0-9]{64}$/);
  assert.equal(seen.headers['x-falcon-demo-key'], env.FALCON_DEMO_API_KEY);
  assert.equal(seen.headers.Cookie, undefined); assert.equal(seen.redirect, 'manual');
  assert.equal(seen.url, 'https://sieger-assistente-production.up.railway.app/v1/public/falcon-demo/request');
});
test('upstream redirects and unexpected content fail closed, validation errors are preserved', async () => {
  for (const reply of [new Response('', { status: 302 }), new Response('<html>error</html>')])
    assert.equal((await proxyDemo(request(), env, async () => reply)).status, 503);
  assert.equal((await proxyDemo(request(), env, async () => Response.json({ error: true }, { status: 429 }))).status, 429);
});
