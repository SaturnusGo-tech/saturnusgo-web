import assert from "node:assert/strict";
import test from "node:test";
import worker from "./worker.mjs";

test("redirects the short origin to the canonical TMS path", async () => {
  const response = await worker.fetch(new Request("https://tms.saturnusgo.com/"));
  assert.equal(response.status, 302);
  assert.equal(
    response.headers.get("location"),
    "https://tms.saturnusgo.com/testcases/umbrella-home/work/",
  );
});

test("proxies only public TMS assets without forwarding credentials", async (context) => {
  const originalFetch = globalThis.fetch;
  context.after(() => { globalThis.fetch = originalFetch; });
  globalThis.fetch = async (request) => {
    assert.equal(
      request.url,
      "https://www.saturnusgo.com/testcases/umbrella-home/work/?view=runs",
    );
    assert.equal(request.headers.has("authorization"), false);
    assert.equal(request.headers.has("cookie"), false);
    assert.equal(request.headers.has("cf-connecting-ip"), false);
    assert.equal(request.headers.get("accept-language"), "ru");
    return new Response("TMS", { status: 200, headers: { "content-type": "text/html" } });
  };

  const response = await worker.fetch(new Request(
    "https://tms.saturnusgo.com/testcases/umbrella-home/work/?view=runs",
    { headers: {
      accept: "text/html",
      "accept-language": "ru",
      authorization: "Bearer private",
      "cf-connecting-ip": "192.0.2.1",
      cookie: "private=1",
    } },
  ));
  assert.equal(response.status, 200);
  assert.equal(await response.text(), "TMS");
});

test("rejects unrelated paths and unsafe methods", async () => {
  const unrelated = await worker.fetch(new Request("https://tms.saturnusgo.com/about/"));
  const mutation = await worker.fetch(new Request(
    "https://tms.saturnusgo.com/testcases/umbrella-home/work/",
    { method: "POST" },
  ));
  assert.equal(unrelated.status, 404);
  assert.equal(mutation.status, 404);
});
