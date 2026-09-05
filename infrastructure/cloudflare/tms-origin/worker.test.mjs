import assert from "node:assert/strict";
import test from "node:test";
import worker from "./worker.mjs";

function mockFetch(context, implementation) {
  const originalFetch = globalThis.fetch;
  context.after(() => { globalThis.fetch = originalFetch; });
  globalThis.fetch = implementation;
}

test("serves the Falcon landing from the isolated Pages namespace", async (context) => {
  mockFetch(context, async (request) => {
    assert.equal(request.url, "https://www.saturnusgo.com/tms-origin/index.html?utm_source=test");
    return new Response("Falcon", {
      status: 200,
      headers: {
        "cache-control": "public, max-age=60",
        "content-security-policy": "default-src https://unsafe-origin.example",
        "content-type": "text/html",
        etag: '"landing"',
        "set-cookie": "origin-session=private; Secure",
      },
    });
  });

  const response = await worker.fetch(new Request(
    "https://tms.saturnusgo.com/?utm_source=test",
    { headers: { cookie: "tms-session=private" } },
  ));
  assert.equal(response.status, 200);
  assert.equal(await response.text(), "Falcon");
  assert.equal(response.headers.get("cache-control"), "public, max-age=60");
  assert.match(response.headers.get("content-security-policy"), /frame-ancestors 'none'/);
  assert.match(response.headers.get("content-security-policy"),
    /connect-src 'self' https:\/\/api\.tms\.saturnusgo\.com/);
  assert.equal(response.headers.get("x-frame-options"), "DENY");
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.equal(response.headers.get("referrer-policy"), "strict-origin-when-cross-origin");
  assert.match(response.headers.get("permissions-policy"), /camera=\(\)/);
  assert.match(response.headers.get("strict-transport-security"), /max-age=31536000/);
  assert.equal(response.headers.get("etag"), '"landing"');
  assert.equal(response.headers.has("set-cookie"), false);
});

test("adds a restrictive browser policy when the static origin supplies none", async (context) => {
  mockFetch(context, async () => new Response("signup", {
    status: 200,
    headers: { "content-type": "text/html; charset=utf-8" },
  }));

  const response = await worker.fetch(new Request("https://tms.saturnusgo.com/signup/"));
  const policy = response.headers.get("content-security-policy");
  assert.match(policy, /default-src 'self'/);
  assert.match(policy, /frame-ancestors 'none'/);
  assert.match(policy, /object-src 'none'/);
  assert.match(policy, /frame-src blob: https:\/\/sieger-assistente-production\.up\.railway\.app/);
});

test("canonicalizes public routes and preserves their query", async () => {
  for (const route of ["signup", "cloud-login", "login"]) {
    const response = await worker.fetch(new Request(
      `https://tms.saturnusgo.com/${route}?returnTo=%2Ftestcases%2Fumbrella-home%2Fwork%2F`,
    ));
    assert.equal(response.status, 302);
    assert.equal(
      response.headers.get("location"),
      `https://tms.saturnusgo.com/${route}/?returnTo=%2Ftestcases%2Fumbrella-home%2Fwork%2F`,
    );
  }
});

test("upgrades the canonical host to HTTPS before routing without contacting origin", async (context) => {
  let fetches = 0;
  mockFetch(context, async () => {
    fetches += 1;
    return new Response("unexpected");
  });

  const response = await worker.fetch(new Request(
    "http://tms.saturnusgo.com/signup?returnTo=%2Ftestcases%2Fumbrella-home%2Fwork%2F",
  ));
  assert.equal(response.status, 308);
  assert.equal(
    response.headers.get("location"),
    "https://tms.saturnusgo.com/signup?returnTo=%2Ftestcases%2Fumbrella-home%2Fwork%2F",
  );
  assert.equal(fetches, 0);
});

test("maps registration, cloud login and route data without exposing the namespace", async (context) => {
  const requested = [];
  mockFetch(context, async (request) => {
    requested.push(request.url);
    return new Response("route", {
      status: 200,
      headers: {
        "content-type": request.url.includes("index.txt")
          ? "text/plain; charset=utf-8"
          : "text/html; charset=utf-8",
      },
    });
  });

  await worker.fetch(new Request("https://tms.saturnusgo.com/signup/"));
  await worker.fetch(new Request("https://tms.saturnusgo.com/signup/index.txt?_rsc=one"));
  await worker.fetch(new Request("https://tms.saturnusgo.com/cloud-login/"));
  await worker.fetch(new Request("https://tms.saturnusgo.com/login/"));

  assert.deepEqual(requested, [
    "https://www.saturnusgo.com/tms-origin/signup/index.html",
    "https://www.saturnusgo.com/tms-origin/signup/index.txt?_rsc=one",
    "https://www.saturnusgo.com/tms-origin/cloud-login/index.html",
    "https://www.saturnusgo.com/tms-origin/login/index.html",
  ]);
});

test("keeps the existing TMS deep link and OAuth callback on its canonical route", async (context) => {
  mockFetch(context, async (request) => {
    assert.equal(
      request.url,
      "https://www.saturnusgo.com/testcases/umbrella-home/work/?projectId=project-1",
    );
    assert.equal(request.headers.has("authorization"), false);
    assert.equal(request.headers.has("cookie"), false);
    assert.equal(request.headers.has("cf-connecting-ip"), false);
    assert.equal(request.headers.get("accept-language"), "ru");
    return new Response("TMS", { status: 200, headers: { "content-type": "text/html" } });
  });

  const canonical = await worker.fetch(new Request(
    "https://tms.saturnusgo.com/testcases/umbrella-home/work?projectId=project-1",
  ));
  assert.equal(canonical.status, 302);
  assert.equal(
    canonical.headers.get("location"),
    "https://tms.saturnusgo.com/testcases/umbrella-home/work/?projectId=project-1",
  );

  const response = await worker.fetch(new Request(
    "https://tms.saturnusgo.com/testcases/umbrella-home/work/?projectId=project-1&code=opaque&state=opaque",
    { headers: {
      "accept-language": "ru",
      authorization: "Bearer private",
      "cf-connecting-ip": "192.0.2.1",
      cookie: "private=1",
    } },
  ));
  assert.equal(response.status, 200);
  assert.equal(await response.text(), "TMS");
});

test("serves only approved shared and Falcon asset prefixes", async (context) => {
  const requested = [];
  mockFetch(context, async (request) => {
    const pathname = new URL(request.url).pathname;
    requested.push(pathname);
    const extension = pathname.slice(pathname.lastIndexOf(".") + 1);
    const contentType = extension === "js"
      ? "application/javascript"
      : extension === "ico"
        ? "image/x-icon"
        : "image/png";
    return new Response("asset", { status: 200, headers: { "content-type": contentType } });
  });

  for (const path of [
    "/_next/static/chunks/app.js",
    "/falcon/falcon-mark-dark.png",
    "/falcon/landing/hero.webp",
    "/favicon.ico",
  ]) {
    assert.equal((await worker.fetch(new Request(`https://tms.saturnusgo.com${path}`))).status, 200);
  }
  assert.deepEqual(requested, [
    "/_next/static/chunks/app.js",
    "/falcon/falcon-mark-dark.png",
    "/falcon/landing/hero.webp",
    "/favicon.ico",
  ]);
});

test("rejects legacy and encoded traversal surfaces before origin fetch", async (context) => {
  let fetches = 0;
  mockFetch(context, async () => {
    fetches += 1;
    return new Response("unexpected", { status: 200 });
  });

  const responses = await Promise.all([
    "/mock/existing-tms-preview.jpg",
    "/cdn-cgi/scripts/email-decode.min.js",
    "/_next/%2e%2e%2fpartners/privacy/",
    "/_next/%2E%2E%5Cpartners/privacy/",
    "/_next/%252e%252e%252fpartners/privacy/",
    "/falcon/%2e%2e%2fpartners/privacy/",
  ].map((path) => worker.fetch(new Request(`https://tms.saturnusgo.com${path}`))));

  assert.deepEqual(responses.map(({ status }) => status), [404, 404, 404, 404, 404, 404]);
  assert.equal(fetches, 0);
});

test("returns a local plain 404 for missing optional routes and allowlisted assets", async (context) => {
  mockFetch(context, async () => new Response(
    "<html><script>window.legacySaturnus = true</script></html>",
    { status: 404, headers: { "content-type": "text/html" } },
  ));

  for (const path of ["/login/", "/falcon/missing.png", "/_next/static/missing.js"]) {
    const response = await worker.fetch(new Request(`https://tms.saturnusgo.com${path}`));
    assert.equal(response.status, 404);
    assert.equal(response.headers.get("content-type"), "text/plain; charset=utf-8");
    assert.equal(await response.text(), "Not found");
  }
});

test("does not relay upstream server errors through the TMS origin", async (context) => {
  mockFetch(context, async () => new Response("legacy origin failure", {
    status: 503,
    headers: { "content-type": "text/html; charset=utf-8" },
  }));

  const response = await worker.fetch(new Request("https://tms.saturnusgo.com/signup/"));
  assert.equal(response.status, 404);
  assert.equal(response.headers.get("content-type"), "text/plain; charset=utf-8");
  assert.equal(await response.text(), "Not found");
});

test("fails closed when an origin route or asset has the wrong MIME type", async (context) => {
  mockFetch(context, async () => new Response("<html>wrong artifact</html>", {
    status: 200,
    headers: { "content-type": "text/html; charset=utf-8" },
  }));

  const asset = await worker.fetch(new Request(
    "https://tms.saturnusgo.com/_next/static/chunks/app.js",
  ));
  assert.equal(asset.status, 404);
  assert.equal(asset.headers.get("content-type"), "text/plain; charset=utf-8");

  mockFetch(context, async () => new Response("plain route", {
    status: 200,
    headers: { "content-type": "text/plain; charset=utf-8" },
  }));
  const route = await worker.fetch(new Request("https://tms.saturnusgo.com/signup/"));
  assert.equal(route.status, 404);
});

test("rewrites only approved same-origin redirects", async (context) => {
  let location = "https://www.saturnusgo.com/tms-origin/signup/index.html?next=1";
  mockFetch(context, async () => new Response(null, {
    status: 302,
    headers: { location },
  }));

  const approved = await worker.fetch(new Request("https://tms.saturnusgo.com/"));
  assert.equal(approved.status, 302);
  assert.equal(
    approved.headers.get("location"),
    "https://tms.saturnusgo.com/signup/?next=1",
  );

  location = "https://attacker.example/collect";
  const external = await worker.fetch(new Request("https://tms.saturnusgo.com/"));
  assert.equal(external.status, 502);
  assert.equal(external.headers.has("location"), false);

  location = "https://www.saturnusgo.com/partners/";
  const unrelated = await worker.fetch(new Request("https://tms.saturnusgo.com/"));
  assert.equal(unrelated.status, 502);
  assert.equal(unrelated.headers.has("location"), false);
});

test("rejects unapproved hosts, paths, namespace access and unsafe methods", async () => {
  const responses = await Promise.all([
    worker.fetch(new Request("https://www.saturnusgo.com/")),
    worker.fetch(new Request("https://tms.saturnusgo.com/about/")),
    worker.fetch(new Request("https://tms.saturnusgo.com/signup/extra")),
    worker.fetch(new Request("https://tms.saturnusgo.com/tms-origin/index.html")),
    worker.fetch(new Request("https://tms.saturnusgo.com/testcases/umbrella-home/work/", {
      method: "POST",
    })),
  ]);
  assert.deepEqual(responses.map(({ status }) => status), [404, 404, 404, 404, 404]);
});
