import assert from "node:assert/strict";
import test from "node:test";
import { verifyPagesOriginReadiness } from "./verify-pages-origin-readiness.mjs";

const sourceSha = "0123456789abcdef0123456789abcdef01234567";

function response(body, contentType = "application/octet-stream") {
  return new Response(body, { status: 200, headers: { "content-type": contentType } });
}

function successfulFetch(requests) {
  return async (input, options) => {
    const url = new URL(input);
    requests.push({ options, url });
    if (url.pathname === "/tms-origin/release.json") {
      return response(JSON.stringify({ sourceSha, routeManifest: "tms-origin-v1" }), "application/json");
    }
    if (url.pathname.endsWith("index.html")) {
      return response(
        '<!doctype html><script src="/_next/static/chunks/app.js"></script>',
        "text/html; charset=utf-8",
      );
    }
    if (/\.(?:js|mjs)$/.test(url.pathname)) return response("asset", "application/javascript");
    if (/\.jpe?g$/.test(url.pathname)) return response("asset", "image/jpeg");
    if (/\.mp4$/.test(url.pathname)) return response("asset", "video/mp4");
    if (/\.vtt$/.test(url.pathname)) return response("WEBVTT\n", "text/vtt");
    if (/\.woff2$/.test(url.pathname)) return response("font", "font/woff2");
    return response("asset", "image/png");
  };
}

test("verifies reviewed Pages evidence, required routes and their runtime assets over HTTPS", async () => {
  const requests = [];
  const result = await verifyPagesOriginReadiness({
    fetchImpl: successfulFetch(requests),
    sourceOrigin: "https://origin.example",
    sourceSha,
  });

  assert.deepEqual(result.checkedRoutes, ["/privacy/", "/trial-terms/", "/sandbox/", "/admin/", "/profile/", "/", "/ru/", "/docs/", "/ru/docs/", "/signup/", "/cloud-login/"]);
  assert.ok(result.checkedAssets.includes("/_next/static/chunks/app.js"));
  assert.ok(result.checkedAssets.includes("/falcon/falcon-mark-dark.png"));
  for (const weight of ["Regular", "RegularItalic", "Medium", "Semibold", "Bold"]) {
    assert.ok(result.checkedAssets.includes(`/falcon/docs/fonts/OpenAISans-${weight}.woff2`));
  }
  for (const theme of ["light", "dark"]) assert.ok(result.checkedAssets.includes(`/assets/integrations/codex/codex-${theme}.png`));
  assert.ok(result.checkedAssets.includes("/falcon/landing/2026-09-production/cases.mp4"));
  assert.ok(result.checkedAssets.includes("/falcon/landing/2026-09-production/cases.vtt"));
  assert.ok(result.checkedAssets.includes("/falcon/landing/2026-09/atmosphere.webp"));
  assert.ok(result.checkedAssets.includes("/falcon/landing/2026-09-production/youtrack-20260913.mp4"));
  assert.ok(result.checkedAssets.includes("/falcon/landing/2026-09-production/youtrack-20260913.vtt"));
  assert.equal(result.checkedAssets.includes("/falcon/landing/2026-09/integrations.mp4"), false);
  assert.ok(requests.every(({ url }) => url.protocol === "https:"));
  assert.ok(requests.every(({ url }) => url.searchParams.get("falcon_release") === sourceSha));
  assert.ok(requests.every(({ options }) => options.redirect === "error"));
});

test("rejects release evidence for a different source commit", async () => {
  await assert.rejects(
    verifyPagesOriginReadiness({
      fetchImpl: async () => response(JSON.stringify({
        sourceSha: "ffffffffffffffffffffffffffffffffffffffff",
        routeManifest: "tms-origin-v1",
      }), "application/json"),
      sourceOrigin: "https://origin.example",
      sourceSha,
    }),
    /does not match reviewed source SHA/,
  );
});

test("fails closed for non-HTTPS origins and missing required assets", async () => {
  await assert.rejects(
    verifyPagesOriginReadiness({
      fetchImpl: successfulFetch([]),
      sourceOrigin: "http://origin.example",
      sourceSha,
    }),
    /bare HTTPS origin/,
  );

  await assert.rejects(
    verifyPagesOriginReadiness({
      fetchImpl: async (input, options) => {
        const url = new URL(input);
        if (url.pathname === "/falcon/falcon-mark-dark.png") {
          return new Response("missing", { status: 404 });
        }
        return successfulFetch([])(input, options);
      },
      sourceOrigin: "https://origin.example",
      sourceSha,
    }),
    /Required asset \/falcon\/falcon-mark-dark\.png returned 404/,
  );
});

for (const theme of ["light", "dark"]) test(`readiness rejects a missing Codex ${theme} mark`, async () => {
  const path = `/assets/integrations/codex/codex-${theme}.png`;
  await assert.rejects(verifyPagesOriginReadiness({
    sourceOrigin: "https://origin.example", sourceSha,
    fetchImpl: async (input, options) => new URL(input).pathname === path
      ? new Response("missing", { status: 404 }) : successfulFetch([])(input, options),
  }), new RegExp(`Required asset ${path.replaceAll(".", "\\.")} returned 404`));
});

test("readiness rejects a missing or HTML fallback documentation font", async () => {
  const path = "/falcon/docs/fonts/OpenAISans-Regular.woff2";
  for (const fontResponse of [new Response("missing", { status: 404 }), response("<html>fallback</html>", "text/html")]) {
    await assert.rejects(verifyPagesOriginReadiness({
      sourceOrigin: "https://origin.example", sourceSha,
      fetchImpl: (input, options) => new URL(input).pathname === path ? fontResponse : successfulFetch([])(input, options),
    }), /Required asset .*OpenAISans-Regular\.woff2 returned (?:404|unexpected content-type text\/html)/);
  }
});

test("readiness blocks a release missing any localized product capture, including deferred overlays", async () => {
  for (const locale of ["en", "ru"]) for (const product of ["repository", "suites", "dashboard", "run", "integrations", "codex"]) {
    const path = `/falcon/landing/2026-11/${locale}/product-${product}.webp`;
    await assert.rejects(verifyPagesOriginReadiness({
      sourceOrigin: "https://origin.example", sourceSha,
      fetchImpl: (input, options) => new URL(input).pathname === path
        ? new Response("missing", { status: 404 }) : successfulFetch([])(input, options),
    }), new RegExp(`Required asset ${path.replaceAll(".", "\\.")} returned 404`));
  }
});
