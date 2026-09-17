import type { TestContext } from "node:test";
import type { CaptureDependencies } from "../../capture/browserCapture";

export function deferred<T>() {
  let resolve!: (value: T) => void, reject!: (reason: unknown) => void;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
export const flush = () => new Promise<void>((resolve) => setImmediate(resolve));
export function browserHarness(options: { rate?: number; pendingMedia?: boolean; pendingModule?: boolean; pendingResume?: boolean; noFlush?: boolean } = {}) {
  const permission = deferred<MediaStream>(), module = deferred<void>(), resumed = deferred<void>();
  const tracks = [{ stops: 0, onended: null as null | (() => void), stop() { this.stops++; } },
    { stops: 0, onended: null as null | (() => void), stop() { this.stops++; } }];
  const stream = { getTracks: () => tracks } as unknown as MediaStream;
  let mediaCalls = 0;
  const contexts: Context[] = [], nodes: Worklet[] = [];
  class Connection {
    connected: unknown[] = []; disconnected = 0;
    connect(target: unknown) { this.connected.push(target); }
    disconnect() { this.disconnected++; }
  }
  class Context {
    sampleRate = options.rate ?? 48000;
    resumes = 0; closes = 0; modules: string[] = [];
    destination = {};
    source = new Connection(); gainNode = Object.assign(new Connection(), { gain: { value: 1 } });
    audioWorklet = { addModule: (path: string) => { this.modules.push(path); return options.pendingModule ? module.promise : Promise.resolve(); } };
    constructor() { contexts.push(this); }
    resume() { this.resumes++; return options.pendingResume ? resumed.promise : Promise.resolve(); }
    close() { this.closes++; return Promise.resolve(); }
    createMediaStreamSource() { return this.source; }
    createGain() { return this.gainNode; }
  }
  class Worklet extends Connection {
    onprocessorerror: null | (() => void) = null;
    lastBatch: Float32Array | null = null;
    port = {
      onmessage: null as null | ((event: { data: unknown }) => void),
      closed: 0, messages: [] as unknown[],
      close: () => { this.port.closed++; },
      postMessage: (message: { type: string }) => {
        this.port.messages.push(message);
        if (message.type === "stop" && !options.noFlush) queueMicrotask(() => {
          if (this.lastBatch) this.port.onmessage?.({ data: { type: "samples", samples: this.lastBatch } });
          this.port.onmessage?.({ data: { type: "stopped" } });
        });
      },
    };
    constructor() { super(); nodes.push(this); }
    samples(samples: Float32Array) { this.port.onmessage?.({ data: { type: "samples", samples } }); }
  }
  const media = () => { mediaCalls++; return options.pendingMedia ? permission.promise : Promise.resolve(stream); };
  const dependencies: CaptureDependencies = {
    secure: () => true, context: () => new Context() as unknown as AudioContext,
    media, node: () => new Worklet() as unknown as AudioWorkletNode,
  };
  function install(t: TestContext) {
    const document = Object.assign(new EventTarget(), { hidden: false });
    const values = { window: { isSecureContext: true, AudioContext: Context }, document,
      navigator: { mediaDevices: { getUserMedia: media } }, AudioWorkletNode: Worklet };
    const originals = new Map<string, PropertyDescriptor | undefined>();
    for (const [key, value] of Object.entries(values)) {
      originals.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
      Object.defineProperty(globalThis, key, { value, writable: true, configurable: true });
    }
    t.after(() => { for (const [key, descriptor] of originals) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor); else Reflect.deleteProperty(globalThis, key);
    } });
    return document;
  }
  return { tracks, stream, permission, module, resumed, contexts, nodes, dependencies, install, mediaCalls: () => mediaCalls };
}
