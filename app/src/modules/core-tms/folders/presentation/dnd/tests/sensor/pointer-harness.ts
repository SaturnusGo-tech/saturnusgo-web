import { PointerSensor, type PointerSensorOptions } from "@dnd-kit/core";

export function pointerHarness(descriptor: { sensor: typeof PointerSensor; options: PointerSensorOptions }, callbacks: {
  start?: () => void; end?: () => void; cancel?: () => void;
} = {}) {
  const view = Object.assign(new EventTarget(), { Document: class {}, HTMLElement: EventTarget, SVGElement: class {} });
  const document = Object.assign(new EventTarget(), { defaultView: view, getSelection: () => null });
  const target = Object.assign(new EventTarget(), { nodeType: 1, ownerDocument: document });
  const counts = { starts: 0, ends: 0, cancels: 0, aborts: 0, moves: 0, pending: 0 };
  function event(type: string, x = 10, y = 20) {
    const value = Object.assign(new Event(type, { cancelable: true }), { clientX: x, clientY: y, isPrimary: true, button: 0 });
    // The document receives bubbled pointer events whose target remains the original row.
    Object.defineProperty(value, "target", { value: target });
    return value;
  }
  const props = {
    active: "dragged-case", activeNode: {} as never, context: { current: {} as never },
    event: event("pointerdown"), options: descriptor.options,
    onStart() { counts.starts++; callbacks.start?.(); },
    onEnd() { counts.ends++; if (counts.starts) callbacks.end?.(); },
    onCancel() { counts.cancels++; callbacks.cancel?.(); },
    onAbort() { counts.aborts++; }, onPending() { counts.pending++; }, onMove() { counts.moves++; },
  };
  const sensor = new descriptor.sensor(props);
  return { sensor, counts, target, event,
    move: (x: number, y = 20) => document.dispatchEvent(event("pointermove", x, y)),
    release: () => document.dispatchEvent(event("pointerup")),
    cancel: () => document.dispatchEvent(event("pointercancel")),
  };
}
