import { flushSync } from "react-dom";

const active = new Map<HTMLElement, Animation>();
const timing = { duration: 280, easing: "cubic-bezier(.22,.68,.25,1)", fill: "both" } as const;
const targets = "[data-scenario-motion-group] > *, [data-scenario-motion-part]";
type Geometry = { element: HTMLElement; bounds: DOMRect; parts: Map<HTMLElement, DOMRect> };

function snapshot(element: HTMLElement): Geometry {
  return { element, bounds: element.getBoundingClientRect(), parts: new Map(
    Array.from(element.querySelectorAll<HTMLElement>(targets), part => [part, part.getBoundingClientRect()]),
  ) };
}

function animate(element: HTMLElement, keyframes: Keyframe[]) {
  if (!element.animate) return;
  try {
    const animation = element.animate(keyframes, timing);
    active.set(element, animation);
    const cleanup = () => {
      if (active.get(element) !== animation) return;
      active.delete(element);
      animation.cancel();
    };
    void animation.finished.then(cleanup, cleanup);
  } catch { /* A disappearing element must never prevent the layout choice. */ }
}

/** Reflow the live fields locally; no snapshots, duplicate editors, or document transition. */
export function transitionScenarioLayout(update: () => void) {
  const document = globalThis.document;
  const reduced = globalThis.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  const before = !document || reduced ? [] : Array.from(
    document.querySelectorAll<HTMLElement>("[data-scenario-motion]"), snapshot,
  );
  // Measure the current visual positions first, so a rapid reversal starts where it is now.
  active.forEach(animation => animation.cancel());
  active.clear();
  flushSync(update);
  if (reduced) return;
  const after = before.filter(({ element }) => element.isConnected).map(({ element }) => snapshot(element));
  after.forEach((next) => {
    const previous = before.find(({ element }) => element === next.element)!;
    if (!previous.bounds.width || !next.bounds.width) return;
    if (Math.abs(previous.bounds.height - next.bounds.height) > .5) {
      animate(next.element, [{ height: `${previous.bounds.height}px` }, { height: `${next.bounds.height}px` }]);
    }
    next.parts.forEach((end, part) => {
      const start = previous.parts.get(part);
      if (!start?.width || !start.height || !end.width || !end.height) return;
      const x = start.left - previous.bounds.left - (end.left - next.bounds.left);
      const y = start.top - previous.bounds.top - (end.top - next.bounds.top);
      const sx = start.width / end.width, sy = start.height / end.height;
      if (Math.abs(x) < .5 && Math.abs(y) < .5 && Math.abs(start.width - end.width) < .5 && Math.abs(start.height - end.height) < .5) return;
      animate(part, [
        { transform: `translate(${x}px, ${y}px) scale(${sx}, ${sy})`, transformOrigin: "0 0" },
        { transform: "translate(0, 0) scale(1, 1)", transformOrigin: "0 0" },
      ]);
    });
  });
}
