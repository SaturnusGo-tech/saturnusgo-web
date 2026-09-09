"use client";

import { useEffect, useRef, type KeyboardEvent, type RefObject } from "react";
import { connectPlaybackTimeline } from "./playback-timeline";

export function useProductTimeline(video: RefObject<HTMLVideoElement | null>) {
  const range = useRef<HTMLInputElement>(null);
  const elapsed = useRef<HTMLSpanElement>(null);
  const timeline = useRef<ReturnType<typeof connectPlaybackTimeline> | null>(
    null,
  );

  useEffect(() => {
    if (!video.current || !range.current || !elapsed.current) return;
    const connection = connectPlaybackTimeline(
      video.current,
      range.current,
      elapsed.current,
      {
        requestFrame: (callback) => requestAnimationFrame(callback),
        cancelFrame: (id) => cancelAnimationFrame(id),
        hidden: () => document.hidden,
      },
    );
    timeline.current = connection;
    document.addEventListener("visibilitychange", connection.visibilityChanged);
    window.addEventListener("pointerup", connection.endScrub);
    window.addEventListener("pointercancel", connection.endScrub);
    window.addEventListener("blur", connection.endScrub);
    return () => {
      connection.cleanup();
      timeline.current = null;
      document.removeEventListener(
        "visibilitychange",
        connection.visibilityChanged,
      );
      window.removeEventListener("pointerup", connection.endScrub);
      window.removeEventListener("pointercancel", connection.endScrub);
      window.removeEventListener("blur", connection.endScrub);
    };
  }, [video]);

  return {
    range,
    elapsed,
    beginScrub: () => timeline.current?.beginScrub(),
    seek: (value: number) => timeline.current?.seek(value),
    onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => {
      const media = video.current;
      if (!media || event.altKey || event.ctrlKey || event.metaKey) return;
      let next: number;
      switch (event.key) {
        case "ArrowLeft":
        case "ArrowDown":
          next = media.currentTime - 1;
          break;
        case "ArrowRight":
        case "ArrowUp":
          next = media.currentTime + 1;
          break;
        case "PageDown":
          next = media.currentTime - 5;
          break;
        case "PageUp":
          next = media.currentTime + 5;
          break;
        case "Home":
          next = 0;
          break;
        case "End":
          next = media.duration;
          break;
        default:
          return;
      }
      event.preventDefault();
      timeline.current?.seek(next);
    },
  };
}
