type Box = { left: number; top: number; width: number; height: number };
export function motionDom() {
  const animations: { frames: Keyframe[]; options: KeyframeAnimationOptions; finish: () => void; cancelled: boolean }[] = [];
  const observers: { check: () => void; disconnected: boolean }[] = [];
  const view = Object.assign(new EventTarget(), { innerWidth: 1440, innerHeight: 1000,
    MutationObserver: class {
      record: typeof observers[number];
      constructor(check: () => void) { this.record = { check, disconnected: false }; observers.push(this.record); }
      observe() {} disconnect() { this.record.disconnected = true; }
    },
    matchMedia: () => ({ matches: false }), getComputedStyle: (element: { computed?: object }) => ({
      objectFit: "fill", objectPosition: "50% 50%", overflowX: "visible", overflowY: "visible", ...element.computed,
    }) });
  const document = Object.assign(new EventTarget(), { defaultView: view });
  const animate = (frames: Keyframe[], options: KeyframeAnimationOptions) => {
    let finish!: () => void, reject!: (error: Error) => void;
    const finished = new Promise<void>((resolve, fail) => { finish = resolve; reject = fail; });
    const record = { frames, options, finish, cancelled: false }; animations.push(record);
    return { finished, cancel() { record.cancelled = true; reject(new Error("cancelled")); } };
  };
  const image = (box: Box, parent: object | null = null) => {
    const element = { ownerDocument: document, style: { visibility: "" }, computed: {}, isConnected: true,
      naturalWidth: 1440, naturalHeight: 900, complete: true, src: "/falcon/docs/2026-09/example.jpg",
      parentElement: parent, getBoundingClientRect: () => ({ ...box, right: box.left + box.width, bottom: box.top + box.height }),
      setAttribute() {}, removeAttribute() {}, remove() { element.isConnected = false; }, animate,
      cloneNode: () => image(box), alt: "Guide screenshot" };
    return element;
  };
  const origin = image({ left: 60, top: 130, width: 288, height: 180 });
  const target = image({ left: 100, top: 100, width: 1152, height: 720 });
  const surface = { style: { opacity: "" }, animate };
  const clones: ReturnType<typeof image>[] = [];
  const dialog = { ownerDocument: document, open: true, isConnected: true, dataset: {},
    append: (node: ReturnType<typeof image>) => clones.push(node), querySelector: () => surface };
  return { image, origin, target, surface, dialog, view, document, clones, animations, observers,
    args: { dialog: dialog as unknown as HTMLDialogElement, image: target as unknown as HTMLImageElement,
      origin: origin as unknown as HTMLImageElement, closing: false, onFinish() {} } };
}
