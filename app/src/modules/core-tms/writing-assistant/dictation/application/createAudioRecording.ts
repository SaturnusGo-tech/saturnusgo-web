import { createBrowserCapture, type AudioCapture, type CaptureCallbacks } from "../capture/browserCapture";
import { encodeMonoWav, maximumRecordingSeconds } from "../model/audio";
import { DictationFailure } from "../model/errors";
import { prepareRecording } from "../processing/prepareRecording";

type Options = {
  onReady: () => void;
  onElapsed: (seconds: number) => void;
  onProcessing: () => void;
  onComplete: (wav: ArrayBuffer) => void;
  onError: (error: unknown) => void;
  capture?: (callbacks: CaptureCallbacks) => AudioCapture;
  schedule?: (callback: () => void, milliseconds: number) => () => void;
};
const schedule = (callback: () => void, milliseconds: number) => {
  const timer = setTimeout(callback, milliseconds); return () => clearTimeout(timer);
};

export function createAudioRecording(options: Options) {
  let capture: AudioCapture | null = null, ended = false, ready = false, stopping = false;
  let rate = 0, total = 0, elapsed = -1;
  let chunks: Float32Array[] = [];
  let cancelTimer: (() => void) | undefined;
  function abort() {
    if (ended) return;
    ended = true; cancelTimer?.(); capture?.abort(); capture = null; chunks = [];
  }
  function fail(error: unknown) { if (!ended) { abort(); options.onError(error); } }
  async function stop() {
    if (ended || stopping) return;
    if (!ready) { abort(); return; }
    stopping = true; cancelTimer?.(); options.onProcessing();
    try {
      await capture?.stop();
      if (ended) return;
      if (!rate || total / rate < .12) throw new DictationFailure("too-short");
      const wav = encodeMonoWav(prepareRecording(chunks, rate), rate);
      abort(); options.onComplete(wav);
    } catch (error) { fail(error); }
  }
  function start() {
    if (capture || ended) return;
    cancelTimer = (options.schedule ?? schedule)(() => fail(new DictationFailure("startup-timeout")), 60000);
    capture = (options.capture ?? createBrowserCapture)({
      onReady: () => {
        if (ended) return;
        ready = true; cancelTimer?.(); options.onReady();
        if (ended) return;
        cancelTimer = (options.schedule ?? schedule)(() => { void stop(); }, maximumRecordingSeconds * 1000);
      },
      onSamples: (samples, sampleRate) => {
        if (ended) return;
        if (!Number.isFinite(sampleRate) || sampleRate < 8000 || sampleRate > 192000 || (rate && rate !== sampleRate)) {
          fail(new DictationFailure("unavailable")); return;
        }
        rate = sampleRate;
        const remaining = Math.max(0, Math.floor(rate * maximumRecordingSeconds) - total);
        const bounded = samples.subarray(0, remaining);
        if (bounded.length) {
          const chunk = bounded.slice();
          for (let i = 0; i < chunk.length; i++) {
            if (!Number.isFinite(chunk[i])) chunk[i] = 0;
          }
          chunks.push(chunk); total += chunk.length;
        }
        const seconds = Math.floor(total / rate);
        if (elapsed !== seconds) { elapsed = seconds; options.onElapsed(seconds); }
        if (total >= Math.floor(rate * maximumRecordingSeconds) && !stopping) void stop();
      },
      onLimit: () => { void stop(); }, onError: fail,
    });
    try { capture.start(); } catch (error) { fail(error); }
  }
  return { start, stop, abort };
}
