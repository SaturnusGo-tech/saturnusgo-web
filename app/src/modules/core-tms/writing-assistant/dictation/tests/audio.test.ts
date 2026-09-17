import assert from "node:assert/strict";
import { test } from "node:test";
import { encodeMonoWav, wavBase64 } from "../model/audio";

test("WAV has exactly the canonical 44-byte header and signed little-endian clipped PCM", () => {
  const wav = encodeMonoWav([new Float32Array([-2, -1, -.5, 0, .5, 1, 2, NaN])], 16000);
  const bytes = Buffer.from(wav), view = new DataView(wav);
  assert.equal(wav.byteLength, 44 + 16);
  assert.equal(bytes.toString("ascii", 0, 4), "RIFF"); assert.equal(view.getUint32(4, true), 52);
  assert.equal(bytes.toString("ascii", 8, 16), "WAVEfmt "); assert.equal(view.getUint32(16, true), 16);
  assert.equal(view.getUint16(20, true), 1); assert.equal(view.getUint16(22, true), 1);
  assert.equal(view.getUint32(24, true), 16000); assert.equal(view.getUint32(28, true), 32000);
  assert.equal(view.getUint16(32, true), 2); assert.equal(view.getUint16(34, true), 16);
  assert.equal(bytes.toString("ascii", 36, 40), "data"); assert.equal(view.getUint32(40, true), 16);
  assert.deepEqual(Array.from({ length: 8 }, (_, index) => view.getInt16(44 + index * 2, true)), [-32768, -32768, -16384, 0, 16384, 32767, 32767, 0]);
  assert.deepEqual(Buffer.from(wavBase64(wav), "base64"), bytes);
});

for (const rate of [44100, 48000]) {
  test(`${rate} Hz resampling has exact duration independent of capture chunk boundaries`, () => {
    const samples = Float32Array.from({ length: rate }, (_, i) => Math.sin(2 * Math.PI * 1000 * i / rate) * .5);
    const chunks: Float32Array[] = [];
    for (let i = 0; i < samples.length; i += 137) chunks.push(samples.subarray(i, i + 137));
    const whole = encodeMonoWav([samples], rate), split = encodeMonoWav(chunks, rate);
    assert.equal(whole.byteLength, 32044);
    assert.deepEqual(Buffer.from(split), Buffer.from(whole));
    const output = new Int16Array(whole, 44);
    const rms = Math.sqrt(output.slice(100, -100).reduce((sum, sample) => sum + (sample / 32768) ** 2, 0) / (output.length - 200));
    assert.ok(rms > .32 && rms < .38, `Voice-band tone RMS ${rms}`);
  });
}

test("downsampling suppresses out-of-band audio instead of aliasing it into speech frequencies", () => {
  const samples = Float32Array.from({ length: 48000 }, (_, i) => Math.sin(2 * Math.PI * 14000 * i / 48000) * .5);
  const output = new Int16Array(encodeMonoWav([samples], 48000), 44);
  const rms = Math.sqrt(output.slice(100, -100).reduce((sum, sample) => sum + (sample / 32768) ** 2, 0) / (output.length - 200));
  assert.ok(rms < .01, `Out-of-band RMS ${rms}`);
});

test("WAV duration is capped by samples to 60 seconds and does not add silence to short captures", () => {
  assert.equal(encodeMonoWav([new Float32Array(16000 * 61)], 16000).byteLength, 1920044);
  assert.equal(encodeMonoWav([new Float32Array(4800)], 48000).byteLength, 3244);
  assert.throws(() => encodeMonoWav([], 0), /sample rate/);
});
