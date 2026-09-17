import { DictationFailure, recordingError } from "../model/errors";

export type CaptureCallbacks = {
  onReady: () => void;
  onSamples: (samples: Float32Array, sampleRate: number) => void;
  onLimit: () => void;
  onError: (error: unknown) => void;
};
export type AudioCapture = { start(): void; stop(): Promise<void>; abort(): void };
export type CaptureDependencies = {
  secure: () => boolean;
  context: () => AudioContext;
  media: () => Promise<MediaStream>;
  node: (context: AudioContext) => AudioWorkletNode;
};
const browserDependencies: CaptureDependencies = {
  secure: () => Boolean(window.isSecureContext && navigator.mediaDevices?.getUserMedia),
  context: () => {
    const Constructor = window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Constructor) throw new DictationFailure("unavailable");
    return new Constructor();
  },
  media: () => navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true }, video: false }),
  node: (context) => new AudioWorkletNode(context, "falcon-dictation-capture", { numberOfInputs: 1, numberOfOutputs: 1, outputChannelCount: [1] }),
};

export function createBrowserCapture(callbacks: CaptureCallbacks, dependencies = browserDependencies): AudioCapture {
  let context: AudioContext | null = null, stream: MediaStream | null = null;
  let source: MediaStreamAudioSourceNode | null = null, node: AudioWorkletNode | null = null, silence: GainNode | null = null;
  let closed = false, stopping: Promise<void> | null = null, resolveStop: (() => void) | null = null;
  let rejectStop: ((error: unknown) => void) | null = null;
  let timer: ReturnType<typeof setTimeout> | undefined;
  function releaseMedia() {
    stream?.getTracks().forEach((track) => { track.onended = null; track.stop(); }); stream = null;
    source?.disconnect(); source = null;
  }
  function abort() {
    if (closed) return;
    closed = true; clearTimeout(timer); releaseMedia();
    if (node) { node.port.onmessage = null; node.onprocessorerror = null; node.port.close(); node.disconnect(); node = null; }
    silence?.disconnect(); silence = null;
    if (context) { void context.close().catch(() => undefined); context = null; }
    resolveStop?.(); resolveStop = null; rejectStop = null;
  }
  function fail(error: unknown) {
    if (closed) return;
    const reject = rejectStop, problem = recordingError(error);
    resolveStop = null; rejectStop = null;
    abort(); reject?.(problem); callbacks.onError(problem);
  }
  function start() {
    if (closed || context) return;
    if (!dependencies.secure()) { fail(new DictationFailure("unavailable")); return; }
    try {
      context = dependencies.context();
      if (!context.audioWorklet) throw new DictationFailure("unavailable");
      // Resume synchronously in the click handler, before asking for microphone permission.
      const resumed = context.resume();
      const loaded = context.audioWorklet.addModule("/falcon/ai/dictation-capture.worklet.js");
      const media = dependencies.media().then((value) => {
        if (closed) value.getTracks().forEach((track) => track.stop());
        else stream = value;
      });
      void Promise.all([resumed, loaded, media]).then(() => {
        if (closed || !context || !stream) return;
        node = dependencies.node(context);
        const rate = context.sampleRate;
        node.port.onmessage = (event: MessageEvent) => {
          if (closed) return;
          if (event.data?.type === "samples" && event.data.samples instanceof Float32Array) callbacks.onSamples(event.data.samples, rate);
          else if (event.data?.type === "limit") callbacks.onLimit();
          else if (event.data?.type === "stopped" && stopping) abort();
        };
        node.onprocessorerror = () => fail(new DictationFailure("unavailable"));
        stream.getTracks().forEach((track) => { track.onended = () => fail(new DictationFailure("audio-capture")); });
        source = context.createMediaStreamSource(stream);
        silence = context.createGain(); silence.gain.value = 0;
        source.connect(node); node.connect(silence); silence.connect(context.destination);
        callbacks.onReady();
      }).catch(fail);
    } catch (error) { fail(error); }
  }
  function stop() {
    if (stopping) return stopping;
    if (closed) return Promise.resolve();
    // Stop the physical microphone immediately; retain the graph only to flush its final batch.
    releaseMedia();
    stopping = new Promise<void>((resolve, reject) => { resolveStop = resolve; rejectStop = reject; });
    timer = setTimeout(() => fail(new DictationFailure("unavailable")), 400);
    if (node) node.port.postMessage({ type: "stop" }); else abort();
    return stopping;
  }
  return { start, stop, abort };
}
