import { DictationFailure } from "../model/errors";

/** Retain every sample and pause; only reject a flat signal and raise uniformly quiet recordings. */
export function prepareRecording(chunks: readonly Float32Array[], sampleRate: number): Float32Array[] {
  const window = Math.max(1, Math.round(sampleRate * .02));
  let peak = 0, sum = 0, squares = 0, count = 0, signal = false;
  const inspect = () => {
    if (count && squares / count - (sum / count) ** 2 >= (1 / 32768) ** 2) signal = true;
    sum = 0; squares = 0; count = 0;
  };
  for (const chunk of chunks) for (const sample of chunk) {
    peak = Math.max(peak, Math.abs(sample));
    sum += sample; squares += sample * sample; count++;
    if (count === window) inspect();
  }
  inspect();
  if (!signal) throw new DictationFailure("silent");
  // A single constant gain preserves relative speech volume and does not pump up pauses.
  const gain = peak < .1 ? Math.min(256, .1 / peak) : 1;
  return chunks.map((chunk) => gain === 1 ? chunk : chunk.map((sample) => sample * gain));
}
