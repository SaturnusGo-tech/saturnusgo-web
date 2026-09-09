"use client";

import { scroll, useMotionValue } from "framer-motion";
import { useEffect, useSyncExternalStore, type RefObject } from "react";

const motionQuery = "(prefers-reduced-motion: reduce)";

function subscribeToMotionPreference(onChange: () => void) {
  const media = window.matchMedia(motionQuery);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

function motionAllowed() {
  return !window.matchMedia(motionQuery).matches;
}

export function useLandingMotionEnabled() {
  return useSyncExternalStore(
    subscribeToMotionPreference,
    motionAllowed,
    () => false,
  );
}

function scrollContainer(target: HTMLElement) {
  const root = document.scrollingElement ?? document.documentElement;
  let parent = target.parentElement;

  // Body overflow propagates to the viewport only while HTML overflow is
  // visible in both axes. The mobile shell sets HTML overflow-x:hidden,
  // making body an independent scroller even though scrollingElement is HTML.
  const rootStyle = getComputedStyle(document.documentElement);
  const bodyScrollsViewport =
    rootStyle.overflowX === "visible" && rootStyle.overflowY === "visible";

  while (parent && parent !== root) {
    if (
      !(parent === document.body && bodyScrollsViewport) &&
      /auto|scroll/.test(getComputedStyle(parent).overflowY) &&
      parent.scrollHeight > parent.clientHeight + 1
    ) {
      return parent;
    }
    parent = parent.parentElement;
  }

  return root;
}

export function useLandingScrollProgress(
  target: RefObject<HTMLElement | null>,
  enabled: boolean,
  mode: "reveal" | "hero" = "reveal",
) {
  const progress = useMotionValue(0);

  useEffect(() => {
    const element = target.current;
    if (!enabled || !element) return;

    let container: Element | undefined;
    let stop: VoidFunction | undefined;
    const connect = () => {
      const nextContainer = scrollContainer(element);
      if (nextContainer === container) return;
      stop?.();
      container = nextContainer;
      stop = scroll((value: number) => progress.set(value), {
        container,
        target: element,
        offset:
          mode === "hero"
            ? ["start start", "end start"]
            : ["start end", "end start"],
      });
    };

    connect();
    window.addEventListener("resize", connect, { passive: true });
    return () => {
      window.removeEventListener("resize", connect);
      stop?.();
    };
  }, [enabled, mode, progress, target]);

  return progress;
}
