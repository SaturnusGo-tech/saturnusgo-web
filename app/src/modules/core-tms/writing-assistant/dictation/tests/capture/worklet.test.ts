import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";

function processor(rate = 48000) {
  type Message = { type: string; samples?: Float32Array };
  const messages: Message[] = [];
  class Base {
    port = { onmessage: null as null | ((event: { data: { type: string } }) => void), postMessage: (message: Message) => messages.push(message) };
  }
  let Constructor!: new () => Base & { process(inputs: Float32Array[][], outputs: Float32Array[][]): boolean };
  runInNewContext(readFileSync("public/falcon/ai/dictation-capture.worklet.js", "utf8"), {
    AudioWorkletProcessor: Base, sampleRate: rate, Float32Array,
    registerProcessor: (name: string, constructor: typeof Constructor) => { assert.equal(name, "falcon-dictation-capture"); Constructor = constructor; },
  });
  return { instance: new Constructor(), messages };
}

test("worklet mixes stereo to mono, outputs silence and flushes a partial last batch", () => {
  const { instance, messages } = processor();
  const output = new Float32Array(128).fill(1);
  instance.process([[new Float32Array(128).fill(.25), new Float32Array(128).fill(.75)]], [[output]]);
  assert.ok(output.every((sample) => sample === 0)); assert.equal(messages.length, 0);
  instance.port.onmessage?.({ data: { type: "stop" } });
  assert.equal(messages[0].type, "samples"); assert.equal(messages[0].samples?.length, 128);
  assert.ok(messages[0].samples?.every((sample) => sample === .5)); assert.equal(messages[1].type, "stopped");
  instance.process([[new Float32Array(128).fill(1)]], [[output]]);
  assert.equal(messages.length, 2); assert.ok(output.every((sample) => sample === 0));
});

test("worklet enforces its own 300-second bound and signals the limit exactly once", () => {
  const { instance, messages } = processor(8);
  for (let i = 0; i < 20; i++) instance.process([[new Float32Array(128).fill(.2)]], [[new Float32Array(128)]]);
  assert.equal(messages.filter((message) => message.type === "limit").length, 1);
  assert.equal(messages.reduce((count, message) => count + (message.samples?.length ?? 0), 0), 8 * 300);
});

for (const oppositeGain of [-1, -.8]) {
  test(`phase-opposed stereo microphones preserve speech at gain ${oppositeGain}`, () => {
    const { instance, messages } = processor();
    const speech = Float32Array.from({ length: 128 }, (_, index) => Math.sin(index / 6) * .5);
    const opposite = speech.map((sample) => sample * oppositeGain);
    instance.process([[speech, opposite]], [[new Float32Array(128)]]);
    instance.port.onmessage?.({ data: { type: "stop" } });
    assert.deepEqual(messages[0].samples, speech);
    assert.equal(messages[1].type, "stopped");
  });
}

test("mono input and pauses retain every sample without invented signal", () => {
  const { instance, messages } = processor();
  const speech = Float32Array.from({ length: 128 }, (_, index) => Math.sin(index / 5) * .0001);
  instance.process([[]], [[new Float32Array(128)]]);
  instance.process([[speech]], [[new Float32Array(128)]]);
  instance.process([[new Float32Array(128)]], [[new Float32Array(128)]]);
  instance.port.onmessage?.({ data: { type: "stop" } });
  assert.deepEqual(messages[0].samples, Float32Array.from([...speech, ...new Float32Array(128)]));
  assert.equal(messages[1].type, "stopped");
});
