import assert from "node:assert/strict";
import { test } from "node:test";
import { prepareRecording } from "../../processing/prepareRecording";
import { encodeMonoWav } from "../../model/audio";

test("a quiet short word amid three minutes of pauses remains in its original position", () => {
  const input = new Float32Array(16000 * 180);
  for (let i = 0; i < 3200; i++) input[16000 * 90 + i] = Math.sin(i / 10) * .0001;
  const output = prepareRecording([input], 16000)[0];
  assert.equal(output.length, input.length);
  assert.ok(Math.max(...output.subarray(16000 * 90, 16000 * 90 + 3200)) > .003);
  assert.ok(output.subarray(0, 16000 * 90).every(value => value === 0));
  assert.ok(output.subarray(16000 * 90 + 3200).every(value => value === 0));
  assert.ok(new Int16Array(encodeMonoWav([output], 16000), 44).some(value => value !== 0));
});

test("volume changes and chunk boundaries do not remove quiet syllables or clip normal speech", () => {
  const quiet = Float32Array.from({ length: 3200 }, (_, i) => Math.sin(i / 10) * .002);
  const loud = Float32Array.from({ length: 3200 }, (_, i) => Math.sin(i / 10) * .9);
  const output = prepareRecording([quiet, loud, quiet], 16000);
  assert.deepEqual(output, [quiet, loud, quiet]);
  const split = [quiet.subarray(0, 137), quiet.subarray(137)];
  assert.deepEqual(Float32Array.from(prepareRecording(split, 16000).flatMap(chunk => [...chunk])), prepareRecording([quiet], 16000)[0]);
});

test("flat digital silence and DC are rejected without treating low volume as silence", () => {
  for (const value of [0, .001, .2])
    assert.throws(() => prepareRecording([new Float32Array(16000).fill(value)], 16000), { code: "silent" });
  assert.doesNotThrow(() => prepareRecording([Float32Array.from({ length: 1920 }, (_, i) => Math.sin(i) * .0001)], 16000));
});
