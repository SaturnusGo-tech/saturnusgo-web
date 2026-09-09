export function formatPlaybackTime(value: number) {
  const seconds = Math.floor(Number.isFinite(value) ? Math.max(0, value) : 0);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

type TimelineClock = {
  requestFrame: (callback: FrameRequestCallback) => number;
  cancelFrame: (id: number) => void;
  hidden: () => boolean;
};

export function connectPlaybackTimeline(
  media: HTMLVideoElement,
  range: HTMLInputElement,
  elapsed: HTMLElement,
  clock: TimelineClock,
) {
  let frame: number | null = null;
  let waiting = false;
  let dragging = false;
  let disposed = false;
  let lastLabel = "";

  const render = () => {
    if (disposed) return;
    const duration = Number.isFinite(media.duration)
      ? Math.max(0, media.duration)
      : 0;
    const position = Number.isFinite(media.currentTime)
      ? Math.min(duration, Math.max(0, media.currentTime))
      : 0;
    const max = String(duration || 1);
    if (range.max !== max) range.max = max;
    range.disabled = duration === 0 || !!media.error;
    // Native pointer dragging owns the thumb until the gesture ends.
    if (!dragging) range.value = String(position);
    const text = formatPlaybackTime(position);
    if (elapsed.textContent !== text) elapsed.textContent = text;
    const label = `${text} из ${formatPlaybackTime(duration)}`;
    if (label !== lastLabel) {
      range.setAttribute("aria-valuetext", label);
      lastLabel = label;
    }
  };

  const stop = () => {
    if (frame !== null) clock.cancelFrame(frame);
    frame = null;
  };
  const advancing = () =>
    !disposed &&
    !waiting &&
    !clock.hidden() &&
    !media.paused &&
    !media.ended &&
    !media.seeking &&
    media.readyState >= 3;
  const tick = () => {
    frame = null;
    render();
    if (advancing()) frame = clock.requestFrame(tick);
  };
  const start = () => {
    render();
    if (frame === null && advancing()) frame = clock.requestFrame(tick);
  };
  const resume = () => {
    waiting = false;
    start();
  };
  const halt = () => {
    stop();
    render();
  };
  const buffer = () => {
    waiting = true;
    halt();
  };
  const events: [string, () => void][] = [
    ["playing", resume],
    ["seeked", resume],
    ["waiting", buffer],
    ["seeking", halt],
    ["pause", halt],
    ["ended", halt],
    ["emptied", halt],
    ["error", halt],
    ["timeupdate", render],
    ["loadedmetadata", render],
    ["durationchange", render],
    ["ratechange", start],
  ];
  for (const [name, listener] of events) media.addEventListener(name, listener);
  start();

  return {
    seek: (value: number) => {
      if (
        disposed ||
        !Number.isFinite(value) ||
        !Number.isFinite(media.duration) ||
        media.duration <= 0
      )
        return;
      media.currentTime = Math.min(media.duration, Math.max(0, value));
      render();
    },
    beginScrub: () => {
      dragging = true;
    },
    endScrub: () => {
      dragging = false;
      start();
    },
    visibilityChanged: () => {
      if (clock.hidden()) halt();
      else start();
    },
    cleanup: () => {
      disposed = true;
      stop();
      for (const [name, listener] of events)
        media.removeEventListener(name, listener);
    },
  };
}
