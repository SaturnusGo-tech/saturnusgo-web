import assert from "node:assert/strict";
import { test } from "node:test";
import { hookHarness } from "../state/hook-harness";

for (const ru of [true, false]) {
  test(`UI locale ${ru} and changing it during capture/transcription do not control spoken language`, async t => {
    const h = hookHarness(t, { config: { ru } });
    await h.start(); h.samples(); h.update({ ru: !ru });
    assert.equal(h.get().state, "listening");
    await h.stop(); h.update({ ru });
    assert.equal(h.requests[0].signal?.aborted, false);
    assert.deepEqual(Object.keys(h.requests[0].body), ["audio"]);
    const spoken = "Исправь, блин, expected result. Сақта.";
    await h.reply(spoken); assert.equal(h.text(), spoken); assert.equal(h.applied(), 0);
  });
}

test("three-minute instructions are appended in full with Unicode and punctuation intact", async t => {
  const h = hookHarness(t, { text: "Начало." });
  await h.start(); h.samples(48000 * 180); await h.stop();
  const text = "Исправь описание; keep the API name. Сәлем! 🙂\n".repeat(100);
  await h.reply(text);
  assert.equal(h.text(), `Начало. ${text.trim()}`);
  assert.equal(h.get().notice, ""); assert.equal(h.applied(), 0);
  assert.equal(Buffer.from(h.requests[0].body.audio, "base64").length, 5760044);
});
