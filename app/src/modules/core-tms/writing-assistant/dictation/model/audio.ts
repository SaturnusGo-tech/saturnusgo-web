export const dictationSampleRate = 16000;
export const maximumRecordingSeconds = 60;
const phases = 512, radius = 16;

function resamplingKernels(sampleRate: number) {
  const cutoff = .46 * Math.min(1, dictationSampleRate / sampleRate);
  return Array.from({ length: phases }, (_, phase) => {
    const weights = new Float64Array(radius * 2);
    let sum = 0;
    for (let tap = 0; tap < weights.length; tap++) {
      const distance = tap - radius + 1 - phase / phases;
      const argument = 2 * Math.PI * cutoff * distance;
      const sinc = argument === 0 ? 1 : Math.sin(argument) / argument;
      const window = Math.abs(distance) >= radius ? 0
        : .42 + .5 * Math.cos(Math.PI * distance / radius) + .08 * Math.cos(2 * Math.PI * distance / radius);
      weights[tap] = sinc * window; sum += weights[tap];
    }
    return weights.map((weight) => weight / sum);
  });
}

/** Canonical RIFF/WAVE: PCM, mono, signed 16-bit little-endian, 16 kHz, no extra chunks. */
export function encodeMonoWav(chunks: readonly Float32Array[], sampleRate: number) {
  if (!Number.isFinite(sampleRate) || sampleRate < 8000 || sampleRate > 192000) throw new Error("Invalid sample rate");
  const count = Math.min(chunks.reduce((sum, chunk) => sum + chunk.length, 0), Math.floor(sampleRate * maximumRecordingSeconds));
  const source = new Float32Array(count);
  let offset = 0;
  for (const chunk of chunks) {
    const length = Math.min(chunk.length, count - offset);
    if (length <= 0) break;
    source.set(chunk.subarray(0, length), offset); offset += length;
  }
  const frames = Math.min(Math.floor(count * dictationSampleRate / sampleRate), dictationSampleRate * maximumRecordingSeconds);
  const buffer = new ArrayBuffer(44 + frames * 2), view = new DataView(buffer);
  const text = (start: number, value: string) => { for (let i = 0; i < value.length; i++) view.setUint8(start + i, value.charCodeAt(i)); };
  text(0, "RIFF"); view.setUint32(4, buffer.byteLength - 8, true); text(8, "WAVE"); text(12, "fmt ");
  view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true);
  view.setUint32(24, dictationSampleRate, true); view.setUint32(28, dictationSampleRate * 2, true);
  view.setUint16(32, 2, true); view.setUint16(34, 16, true); text(36, "data"); view.setUint32(40, frames * 2, true);
  const kernels = sampleRate === dictationSampleRate ? null : resamplingKernels(sampleRate);
  for (let frame = 0; frame < frames; frame++) {
    let sample = 0;
    if (!kernels) sample = source[frame];
    else {
      const position = (frame + .5) * sampleRate / dictationSampleRate - .5;
      const center = Math.floor(position), phase = Math.floor((position - center) * phases);
      const weights = kernels[phase];
      for (let tap = 0; tap < weights.length; tap++) {
        const index = Math.max(0, Math.min(count - 1, center + tap - radius + 1));
        sample += source[index] * weights[tap];
      }
    }
    const clipped = Math.max(-1, Math.min(1, Number.isFinite(sample) ? sample : 0));
    view.setInt16(44 + frame * 2, Math.round(clipped * (clipped < 0 ? 32768 : 32767)), true);
  }
  return buffer;
}

export function wavBase64(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer), segments: string[] = [];
  for (let start = 0; start < bytes.length; start += 16384) {
    segments.push(String.fromCharCode(...bytes.subarray(start, start + 16384)));
  }
  return btoa(segments.join(""));
}
