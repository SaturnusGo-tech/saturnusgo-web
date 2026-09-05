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

  assert.deepEqual(result.checkedRoutes, ["/", "/signup/", "/cloud-login/"]);
  assert.ok(result.checkedAssets.includes("/_next/static/chunks/app.js"));
  assert.ok(result.checkedAssets.includes("/falcon/falcon-mark-dark.png"));
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
