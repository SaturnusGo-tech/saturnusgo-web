import assert from 'node:assert/strict';
import test from 'node:test';
import worker from './worker.mjs';

test('public discovery endpoints return a sitemap and crawl instructions without requesting the app', async () => {
  const robots = await worker.fetch(new Request('https://tms.saturnusgo.com/robots.txt'));
  assert.equal(robots.status, 200);
  assert.match(robots.headers.get('content-type'), /^text\/plain/);
  assert.match(await robots.text(), /Sitemap: https:\/\/tms\.saturnusgo\.com\/sitemap\.xml/);
  const sitemap = await worker.fetch(new Request('https://tms.saturnusgo.com/sitemap.xml'));
  assert.equal(sitemap.status, 200);
  assert.match(sitemap.headers.get('content-type'), /xml/);
  const xml = await sitemap.text();
  assert.match(xml, /<loc>https:\/\/tms\.saturnusgo\.com\/<\/loc>/);
  assert.match(xml, /<loc>https:\/\/tms\.saturnusgo\.com\/ru\/<\/loc>/);
  assert.doesNotMatch(xml, /testcases|admin|sandbox|cloud-login/);
  assert.equal((await worker.fetch(new Request('https://tms.saturnusgo.com/sitemap.xml', {method:'HEAD'}))).body, null);
});

test('localized public landing maps to its isolated artifact and workspace stays out of search', async context => {
  const original = globalThis.fetch;
  context.after(() => {globalThis.fetch = original;});
  const paths = [];
  globalThis.fetch = async request => {
    paths.push(new URL(request.url).pathname);
    return new Response('<html lang="ru"><body>Falcon</body></html>', {headers:{'Content-Type':'text/html'}});
  };
  const ru = await worker.fetch(new Request('https://tms.saturnusgo.com/ru/'));
  assert.equal(ru.status, 200);
  assert.equal(ru.headers.has('x-robots-tag'), false);
  assert.equal(paths[0], '/tms-origin/ru/index.html');
  const app = await worker.fetch(new Request('https://tms.saturnusgo.com/work/'));
  assert.match(app.headers.get('x-robots-tag'), /noindex/);
});

test('company crawl policy never advertises public tenant or account pages', async () => {
  const env = {FALCON_MANAGED_AUTH_ENABLED:'true', FALCON_COMPANY_DOMAIN_SUFFIX:'saturnusgo.com', FALCON_PLATFORM_HOSTNAME:'sandbox-falcon.saturnusgo.com'};
  const response = await worker.fetch(new Request('https://umbrella-falcon.saturnusgo.com/robots.txt'), env);
  assert.equal(response.status, 200);
  assert.match(await response.text(), /Disallow: \/\s/);
  assert.equal((await worker.fetch(new Request('https://umbrella-falcon.saturnusgo.com/sitemap.xml'),env)).status, 404);
});
