"use client";
import { useEffect, useRef, useState } from "react";
export function useProductPlayback() {
  const video = useRef<HTMLVideoElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const userPaused = useRef(false);
  const eligible = useRef(false);
  const reduced = useRef(false);
  const manualPlayback = useRef(false);
  const [load, setLoad] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    // The observer can run before React has attached the lazy source.
    if (
      load &&
      eligible.current &&
      !document.hidden &&
      !userPaused.current &&
      (!reduced.current || manualPlayback.current)
    ) {
      void video.current?.play().catch(() => setPlaying(false));
    }
  }, [load]);
  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const syncMotion = () => {
      reduced.current = media.matches;
      if (media.matches) {
        manualPlayback.current = false;
        video.current?.pause();
      }
    };
    syncMotion();
    media.addEventListener("change", syncMotion);
    const sync = () => {
      if (!video.current) return;
      if (
        eligible.current &&
        !document.hidden &&
        !userPaused.current &&
        (!reduced.current || manualPlayback.current)
      ) {
        void video.current.play().catch(() => setPlaying(false));
      } else {
        manualPlayback.current = false;
        video.current.pause();
      }
    };
    const observer = new IntersectionObserver(
      ([entry]) => {
        eligible.current =
          entry.isIntersecting && entry.intersectionRatio >= 0.45;
        if (entry.isIntersecting) setLoad(true);
        sync();
      },
      { threshold: [0, 0.45, 0.75] },
    );
    if (frame.current) observer.observe(frame.current);
    document.addEventListener("visibilitychange", sync);
    return () => {
      observer.disconnect();
      media.removeEventListener("change", syncMotion);
      document.removeEventListener("visibilitychange", sync);
    };
  }, []);
  const toggle = () => {
    const target = video.current;
    if (!target) return;
    setLoad(true);
    if (target.paused) {
      userPaused.current = false;
      manualPlayback.current = true;
      if (target.readyState >= 2)
        void target.play().catch(() => setPlaying(false));
    } else {
      userPaused.current = true;
      manualPlayback.current = false;
      target.pause();
    }
  };
  const ready = () => {
    if (
      eligible.current &&
      (!reduced.current || manualPlayback.current) &&
      !userPaused.current &&
      !document.hidden
    ) {
      void video.current?.play().catch(() => setPlaying(false));
    }
  };
  const retry = () => {
    setFailed(false);
    setLoad(true);
    video.current?.load();
  };
  return {
    video,
    frame,
    load,
    playing,
    position,
    duration,
    failed,
    toggle,
    ready,
    retry,
    onPlay: () => setPlaying(true),
    onPause: () => setPlaying(false),
    onTime: () => setPosition(video.current?.currentTime ?? 0),
    onMetadata: () =>
      setDuration(
        Number.isFinite(video.current?.duration) ? video.current!.duration : 0,
      ),
    onError: () => {
      setFailed(true);
      setPlaying(false);
    },
    seek: (time: number) => {
      if (video.current && duration > 0) {
        video.current.currentTime = Math.min(duration, Math.max(0, time));
        setPosition(time);
      }
    },
  };
}
