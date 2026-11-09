"use client";

import { useLayoutEffect, useRef } from "react";

export function useStructuredBlockFootprint(hold: boolean) {
  const surface = useRef<HTMLDivElement>(null);
  const settledHeight = useRef(0);

  useLayoutEffect(() => {
    const element = surface.current;
    if (!element) return;
    if (hold) {
      if (settledHeight.current) element.style.minBlockSize = `${settledHeight.current}px`;
      return () => { element.style.removeProperty("min-block-size"); };
    }

    const measure = () => { settledHeight.current = element.offsetHeight; };
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [hold]);

  return surface;
}
