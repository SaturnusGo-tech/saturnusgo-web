type Scheduler = { schedule: (callback: () => void) => unknown; cancel: (handle: unknown) => void; now?: () => number };
const frameScheduler: Scheduler = {
  schedule: callback => typeof requestAnimationFrame === "function" ? requestAnimationFrame(callback) : setTimeout(callback, 16),
  cancel: handle => { if (typeof cancelAnimationFrame === "function") cancelAnimationFrame(handle as number); else clearTimeout(handle as ReturnType<typeof setTimeout>); },
};

type Graphemes = { segment(text: string): Iterable<{ segment: string }> };
const Segmenter = (Intl as typeof Intl & { Segmenter?: new (locale: undefined, options: { granularity: "grapheme" }) => Graphemes }).Segmenter;
const graphemes = Segmenter ? new Segmenter(undefined, { granularity: "grapheme" }) : null;
function revealEnd(text: string, from: number, amount: number) {
  let end = from;
  const remaining = text.slice(from);
  const segments = graphemes ? graphemes.segment(remaining) : [{ segment: remaining }];
  for (const { segment } of segments) { end += segment.length; if (end >= from + amount) break; }
  if (end === text.length && /[\uD800-\uDBFF]$/.test(text)) end--;
  return end;
}

/** Smooth received bursts for at most 80ms; validated completion never waits for this preview. */
export function createTextBatch(publish: (text: string) => void, scheduler: Scheduler = frameScheduler) {
  let text = "", shown = 0, deadline = 0, scheduled: unknown, active = true;
  const now = scheduler.now ?? (() => performance.now());
  function frame() {
    scheduled = undefined;
    if (!active) return;
    const reduced = globalThis.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const framesLeft = reduced ? 1 : Math.max(1, Math.ceil((deadline - now()) / 16));
    const end = revealEnd(text, shown, Math.max(12, Math.ceil((text.length - shown) / framesLeft)));
    if (end <= shown) return;
    shown = end; publish(text.slice(0, shown));
    if (active && shown < text.length) scheduled = scheduler.schedule(frame);
  }
  return {
    append(delta: string) {
      if (!active || !delta) return;
      if (shown === text.length) deadline = now() + 80;
      text += delta;
      if (scheduled !== undefined) return;
      scheduled = scheduler.schedule(frame);
    },
    cancel() { active = false; if (scheduled !== undefined) scheduler.cancel(scheduled); scheduled = undefined; },
  };
}
