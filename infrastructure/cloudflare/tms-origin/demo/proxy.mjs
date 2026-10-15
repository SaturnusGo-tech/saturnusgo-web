const ORIGIN = 'https://tms.saturnusgo.com';
const TARGET = 'https://sieger-assistente-production.up.railway.app/v1/public/falcon-demo/request';
const failure = status => Response.json({ error: { code: 'DEMO_UNAVAILABLE' } }, { status, headers: { 'Cache-Control': 'no-store' } });
export async function proxyDemo(request, env, transport = fetch) {
  if (request.method !== 'POST') return failure(405);
  if (request.headers.get('Origin') !== ORIGIN) return failure(403);
  if (!request.headers.get('Content-Type')?.startsWith('application/json')) return failure(415);
  const secret = env?.FALCON_DEMO_API_KEY;
  const client = request.headers.get('CF-Connecting-IP');
  if (typeof secret !== 'string' || secret.length < 32 || !client) return failure(503);
  const reader = request.body?.getReader();
  if (!reader) return failure(400);
  const chunks = []; let length = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read(); if (done) break;
      length += value.length;
      if (length > 2048) { await reader.cancel(); return failure(413); }
      chunks.push(value);
    }
  } catch { return failure(400); } finally { reader.releaseLock(); }
  const body = new Uint8Array(length); let offset = 0;
  for (const chunk of chunks) { body.set(chunk, offset); offset += chunk.length; }
  try { JSON.parse(new TextDecoder().decode(body)); } catch { return failure(400); }
  try {
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const digest = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode('falcon-demo-network:' + client));
    const clientHash = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
    const response = await transport(TARGET, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'x-falcon-demo-key': secret, 'x-falcon-demo-client': clientHash },
      body, redirect: 'manual', signal: AbortSignal.timeout(15000),
    });
    if ((response.status >= 300 && response.status < 400) || !response.headers.get('Content-Type')?.includes('application/json')) {
      await response.body?.cancel(); return failure(503);
    }
    return new Response(response.body, { status: response.status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } });
  } catch { return failure(503); }
}
