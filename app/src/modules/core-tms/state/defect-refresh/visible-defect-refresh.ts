export const DEFECT_VISIBLE_REFRESH_INTERVAL = 30_000;
type IntervalApi = { set: (callback: () => void, delay: number) => unknown;
  clear: (timer: unknown) => void };
export function scheduleVisibleDefectRefresh(refresh: () => void, timers: IntervalApi = {
  set: (callback, delay) => setInterval(callback, delay),
  clear: (timer) => clearInterval(timer as ReturnType<typeof setInterval>),
}) {
  const timer = timers.set(refresh, DEFECT_VISIBLE_REFRESH_INTERVAL);
  return () => timers.clear(timer);
}

