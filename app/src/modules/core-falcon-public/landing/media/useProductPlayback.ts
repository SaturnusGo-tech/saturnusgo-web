"use client";
import { useCallback, useEffect, useRef, useState } from "react";

export function useProductPlayback() {
  const video = useRef<HTMLVideoElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const requested = useRef(false);
  const attempt = useRef(0);
  const mounted = useRef(false);
  const [load, setLoad] = useState(false);
  const [interactive, setInteractive] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [starting, setStarting] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [failed, setFailed] = useState(false);

  const pause = useCallback(() => {
    requested.current = false;
    attempt.current += 1;
    video.current?.pause();
    setStarting(false);
    setPlaying(false);
  }, []);

  const play = useCallback(() => {
    const target = video.current;
    if (!target || !requested.current || document.hidden) return;
    const currentAttempt = ++attempt.current;
    // play() waits for media data while retaining the explicit user request.
    void target.play().then(
      () => {
        if (!requested.current || document.hidden) target.pause();
        if (attempt.current === currentAttempt) setStarting(false);
      },
      () => {
        // An aborted, older request must not cancel a later click on Play.
        if (attempt.current !== currentAttempt) return;
        requested.current = false;
        setStarting(false);
        setPlaying(false);
      },
    );
  }, []);

  useEffect(() => {
    // The first click can precede React attaching the lazy video source.
    if (load && requested.current) play();
  }, [load, play]);

  useEffect(() => {
    mounted.current = true;
    setInteractive(true);
    const target = video.current;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setLoad(true);
        if (!entry.isIntersecting || entry.intersectionRatio < 0.45) pause();
      },
      { threshold: [0, 0.45] },
    );
    const visibility = () => {
      if (document.hidden) pause();
    };
    if (frame.current) observer.observe(frame.current);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", visibility);
      mounted.current = false;
      // A click can hydrate this player before StrictMode replays its effects.
      // Preserve that explicit request through setup/cleanup/setup, but stop a
      // detached player and invalidate its pending play promise on real unmount.
      queueMicrotask(() => {
        if (mounted.current) return;
        requested.current = false;
        attempt.current += 1;
        target?.pause();
      });
    };
  }, [pause]);

  const toggle = () => {
    const target = video.current;
    if (!target || failed) return;
    if (requested.current || !target.paused) {
      pause();
      return;
    }
    requested.current = true;
    setStarting(true);
    if (target.ended) {
      target.currentTime = 0;
      setPosition(0);
    }
    if (target.getAttribute("src")) play();
    else setLoad(true);
  };

  return {
    video,
    frame,
    load,
    interactive,
    playing,
    starting,
    position,
    duration,
    failed,
    toggle,
    retry: () => {
      pause();
      setFailed(false);
      setLoad(true);
      video.current?.load();
    },
    onPlay: () => {
      if (!requested.current || document.hidden) {
        pause();
        return;
      }
      setPlaying(true);
      setStarting(false);
    },
    onPause: () => {
      if (video.current?.paused) pause();
    },
    onEnded: pause,
    onTime: () => setPosition(video.current?.currentTime ?? 0),
    onMetadata: () =>
      setDuration(
        Number.isFinite(video.current?.duration) ? video.current!.duration : 0,
      ),
    onError: () => {
      pause();
      setFailed(true);
    },
    seek: (time: number) => {
      if (video.current && duration > 0) {
        const next = Math.min(duration, Math.max(0, time));
        video.current.currentTime = next;
        setPosition(next);
      }
    },
  };
}
