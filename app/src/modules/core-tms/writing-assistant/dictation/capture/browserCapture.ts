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
  media: () => navigator.mediaDevices.getUserMedia({ audio: {
    echoCancellation: false, noiseSuppression: false, autoGainControl: false,
  }, video: false }),
  node: (context) => new AudioWorkletNode(context, "falcon-dictation-capture", {
    numberOfInputs: 1, numberOfOutputs: 1, outputChannelCount: [1],
  }),
};

export function createBrowserCapture(callbacks: CaptureCallbacks, dependencies = browserDependencies): AudioCapture {
  let context: AudioContext | null = null, stream: MediaStream | null = null;
  let source: MediaStreamAudioSourceNode | null = null, node: AudioWorkletNode | null = null, silence: GainNode | null = null;
  let closed = false, stopping: Promise<void> | null = null, resolveStop: (() => void) | null = null;
  let ready = false;
  let rejectStop: ((error: unknown) => void) | null = null;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let inputTimer: ReturnType<typeof setTimeout> | undefined;
  let frameTimer: ReturnType<typeof setTimeout> | undefined;
  function releaseMedia() {
    stream?.getTracks().forEach((track) => { track.onended = null; track.onmute = null; track.stop(); }); stream = null;
    source?.disconnect(); source = null;
  }
  function abort() {
    if (closed) return;
    closed = true; clearTimeout(timer); clearTimeout(inputTimer); clearTimeout(frameTimer); releaseMedia();
    if (node) { node.port.onmessage = null; node.onprocessorerror = null; node.port.close(); node.disconnect(); node = null; }
    silence?.disconnect(); silence = null;
    if (context) { context.onstatechange = null; void context.close().catch(() => undefined); context = null; }
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
      void resumed.catch(fail);
      const loaded = context.audioWorklet.addModule("/falcon/ai/dictation-capture.worklet.js?v=20260919-capture");
      const media = dependencies.media().then((value) => {
        if (closed) value.getTracks().forEach((track) => track.stop());
        else stream = value;
      });
      void Promise.all([loaded, media]).then(async () => {
        if (closed || !context || !stream) return;
        inputTimer = setTimeout(() => fail(new DictationFailure("no-input")), 8000);
        // Opening the input can interrupt WebKit's audio session after the first resume.
        await context.resume();
        if (closed || !context || !stream) return;
        node = dependencies.node(context);
        const rate = context.sampleRate;
        node.port.onmessage = (event: MessageEvent) => {
          if (closed) return;
          if (event.data?.type === "samples" && event.data.samples instanceof Float32Array) {
            if (!event.data.samples.length) return;
            if (!ready && stopping) return;
            if (!stopping && (context?.state !== "running" || stream?.getTracks().some((track) => track.muted))) return;
            if (!stopping) {
              clearTimeout(frameTimer);
              // Silence still supplies frames. A missing stream must not become a partial command.
              frameTimer = setTimeout(() => fail(new DictationFailure("audio-interrupted")), 2500);
            }
            if (!ready) { ready = true; clearTimeout(inputTimer); callbacks.onReady(); }
            if (!closed) callbacks.onSamples(event.data.samples, rate);
          }
          else if (event.data?.type === "limit") callbacks.onLimit();
          else if (event.data?.type === "stopped" && stopping) abort();
        };
        node.onprocessorerror = () => fail(new DictationFailure("unavailable"));
        stream.getTracks().forEach((track) => {
          track.onended = () => fail(new DictationFailure("audio-capture"));
          track.onmute = () => { if (ready && !stopping) fail(new DictationFailure("audio-interrupted")); };
        });
        context.onstatechange = () => {
          if (ready && !stopping && context?.state !== "running") fail(new DictationFailure("audio-interrupted"));
        };
        source = context.createMediaStreamSource(stream);
        silence = context.createGain(); silence.gain.value = 0;
        source.connect(node); node.connect(silence); silence.connect(context.destination);
      }).catch(fail);
    } catch (error) { fail(error); }
  }
  function stop() {
    if (stopping) return stopping;
    if (closed) return Promise.resolve();
    // Stop the physical microphone immediately; retain the graph only to flush its final batch.
    stopping = new Promise<void>((resolve, reject) => { resolveStop = resolve; rejectStop = reject; });
    releaseMedia(); clearTimeout(inputTimer); clearTimeout(frameTimer);
    timer = setTimeout(() => fail(new DictationFailure("unavailable")), 400);
    if (node) node.port.postMessage({ type: "stop" }); else abort();
    return stopping;
  }
  return { start, stop, abort };
}
