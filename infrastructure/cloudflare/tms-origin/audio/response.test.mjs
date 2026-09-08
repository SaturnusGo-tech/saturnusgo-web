import assert from "node:assert/strict";
import test from "node:test";
import worker from "../worker.mjs";

const path = `/falcon/docs/audio/ru/quick-start/${"a".repeat(64)}.mp3`;
const bytes = new TextEncoder().encode("0123456789");
const metadata = {
  size: bytes.length, etag: "audio-v1", httpEtag: '"audio-v1"',
  uploaded: new Date("2026-09-08T12:00:00.123Z"), httpMetadata: { contentType: "audio/mpeg" },
};

function fixture(overrides = {}) {
  const calls = [];
  const bucket = {
    async head(key) { calls.push(["head", key]); return metadata; },
    async get(key, options) {
      calls.push(["get", key, options]);
      const range = options.range;
      const body = range ? bytes.slice(range.offset, range.offset + range.length) : bytes;
      return { ...metadata, ...(range ? { range } : {}), body };
    },
    ...overrides,
  };
  return {
    calls,
    fetch: (init = {}, pathname = path) => worker.fetch(
      new Request(`https://tms.saturnusgo.com${pathname}`, init), { DOCS_AUDIO: bucket },
    ),
  };
}

test("documentation audio streams its exact public R2 key with immutable metadata and browser policy", async () => {
  const audio = fixture();
  const response = await audio.fetch({ headers: { cookie: "private", authorization: "Bearer private" } });
  assert.equal(response.status, 200);
  assert.equal(await response.text(), "0123456789");
  assert.equal(response.headers.get("content-type"), "audio/mpeg");
  assert.equal(response.headers.get("content-disposition"), "inline");
  assert.equal(response.headers.get("content-length"), "10");
  assert.equal(response.headers.get("accept-ranges"), "bytes");
  assert.equal(response.headers.get("etag"), '"audio-v1"');
  assert.equal(response.headers.get("cache-control"), "public, max-age=31536000, immutable");
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.match(response.headers.get("content-security-policy"), /media-src 'self'/);
  assert.deepEqual(audio.calls, [
    ["head", path.slice(1)], ["get", path.slice(1), { onlyIf: { etagMatches: "audio-v1" } }],
  ]);
});

test("documentation audio HEAD returns metadata without reading the body or applying Range", async () => {
  const audio = fixture();
  const response = await audio.fetch({ method: "HEAD", headers: { range: "bytes=2-4" } });
  assert.equal(response.status, 200);
  assert.equal(await response.text(), "");
  assert.equal(response.headers.get("content-length"), "10");
  assert.equal(response.headers.has("content-range"), false);
  assert.equal(audio.calls.length, 1);
});

test("documentation audio honors weak, list and wildcard ETag conditions before Range", async () => {
  for (const condition of ['"audio-v1"', 'W/"audio-v1"', '"older", W/"audio-v1"', "*"]) {
    for (const method of ["GET", "HEAD"]) {
      const audio = fixture();
      const response = await audio.fetch({ method, headers: { "if-none-match": condition, range: "bytes=99-" } });
      assert.equal(response.status, 304, condition);
      assert.equal(await response.text(), "");
      assert.equal(response.headers.get("etag"), '"audio-v1"');
      assert.equal(response.headers.has("content-range"), false);
      assert.equal(audio.calls.length, 1);
    }
  }
  assert.equal((await fixture().fetch({ headers: { "if-none-match": '"older"' } })).status, 200);
});

test("documentation audio reads bounded, open-ended, suffix and clamped single ranges", async () => {
  for (const [value, offset, length] of [
    ["bytes=2-4", 2, 3], ["bytes=7-", 7, 3], ["bytes=-3", 7, 3],
    ["bytes=8-100", 8, 2], ["bytes=-100", 0, 10], ["bytes=0-0", 0, 1],
  ]) {
    const audio = fixture();
    const response = await audio.fetch({ headers: { range: value } });
    assert.equal(response.status, 206, value);
    assert.equal(response.headers.get("content-range"), `bytes ${offset}-${offset + length - 1}/10`);
    assert.equal(response.headers.get("content-length"), String(length));
    assert.equal(await response.text(), new TextDecoder().decode(bytes.slice(offset, offset + length)));
    assert.deepEqual(audio.calls[1][2], { onlyIf: { etagMatches: "audio-v1" }, range: { offset, length } });
  }
});

test("documentation audio rejects invalid or multiple ranges without reading a body", async () => {
  for (const range of ["bytes=10-", "bytes=5-2", "bytes=-0", "bytes=-", "bytes=0-1,4-5",
    "bytes=x-5", "bytes=9007199254740992-", "items=0-1"]) {
    const audio = fixture();
    const response = await audio.fetch({ headers: { range } });
    assert.equal(response.status, 416, range);
    assert.equal(response.headers.get("content-range"), "bytes */10");
    assert.equal(response.headers.get("cache-control"), "no-store");
    assert.equal(audio.calls.length, 1);
  }
});

test("documentation audio If-Range resumes only the same representation", async () => {
  for (const [condition, status] of [
    ['"audio-v1"', 206], [metadata.uploaded.toUTCString(), 206], ['"older"', 200],
    ['W/"audio-v1"', 200], ["Tue, 08 Sep 2026 11:59:00 GMT", 200], ["invalid", 200],
  ]) {
    const response = await fixture().fetch({ headers: { range: "bytes=2-4", "if-range": condition } });
    assert.equal(response.status, status, condition);
    assert.equal(await response.text(), status === 206 ? "234" : "0123456789");
  }
});

test("documentation audio only exposes canonical Russian versioned MP3 paths", async () => {
  for (const pathname of [
    path.replace("/ru/", "/en/"), path.replace("quick-start", "quick_start"),
    path.replace("a".repeat(64), "a".repeat(63)), path.replace(".mp3", ".wav"),
    path.replace("/ru/", "/ru//"), path.replace("quick-start", "%71uick-start"),
    "/falcon/docs/audio/", "/falcon/docs/audio/umbrella-home-tms-attachments/private.mp3",
  ]) {
    const audio = fixture();
    const response = await audio.fetch({}, pathname);
    assert.equal(response.status, 404, pathname);
    assert.deepEqual(audio.calls, []);
  }
  const audio = fixture();
  const response = await audio.fetch({ method: "PUT", body: "not an upload" });
  assert.equal(response.status, 405);
  assert.equal(response.headers.get("allow"), "GET, HEAD");
  assert.deepEqual(audio.calls, []);
});

test("documentation audio distinguishes absent files from storage and metadata failures", async () => {
  const unavailable = () => { throw new Error("secret bucket credentials must not leak"); };
  const cases = [
    [{ head: async () => null }, 404], [{ head: unavailable }, 503], [{ get: unavailable }, 503],
    [{ head: async () => ({ ...metadata, httpMetadata: { contentType: "text/html" } }) }, 502],
    [{ head: async () => ({ ...metadata, size: 0 }) }, 502],
    [{ get: async () => ({ ...metadata }) }, 503], [{ get: async () => null }, 503],
    [{ get: async () => ({ ...metadata, httpEtag: '"changed"', body: bytes }) }, 503],
  ];
  for (const [overrides, status] of cases) {
    const response = await fixture(overrides).fetch();
    assert.equal(response.status, status);
    assert.equal(response.headers.get("cache-control"), "no-store");
    assert.doesNotMatch(await response.text(), /secret|credentials/);
  }
  const missingBinding = await worker.fetch(new Request(`https://tms.saturnusgo.com${path}`));
  assert.equal(missingBinding.status, 503);
  const head = await fixture({ head: unavailable }).fetch({ method: "HEAD" });
  assert.equal(head.status, 503);
  assert.equal(await head.text(), "");
  const wrongRange = await fixture({ get: async () => ({ ...metadata, body: bytes }) })
    .fetch({ headers: { range: "bytes=2-4" } });
  assert.equal(wrongRange.status, 503);
});
