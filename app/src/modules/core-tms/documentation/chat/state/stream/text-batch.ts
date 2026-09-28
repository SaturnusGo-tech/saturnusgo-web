type Scheduler = { schedule: (callback: () => void) => unknown; cancel: (handle: unknown) => void };
const frameScheduler: Scheduler = {
  schedule: callback => typeof requestAnimationFrame === "function" ? requestAnimationFrame(callback) : setTimeout(callback, 16),
  cancel: handle => { if (typeof cancelAnimationFrame === "function") cancelAnimationFrame(handle as number); else clearTimeout(handle as ReturnType<typeof setTimeout>); },
};

/** Coalesce only text already received from the server; never simulate typing. */
export function createTextBatch(publish: (text: string) => void, scheduler: Scheduler = frameScheduler) {
  let text = "", scheduled: unknown, active = true;
  return {
    append(delta: string) {
      if (!active) return;
      text += delta;
      if (scheduled !== undefined) return;
      scheduled = scheduler.schedule(() => { scheduled = undefined; if (active) publish(text); });
    },
    cancel() { active = false; if (scheduled !== undefined) scheduler.cancel(scheduled); scheduled = undefined; },
  };
}
