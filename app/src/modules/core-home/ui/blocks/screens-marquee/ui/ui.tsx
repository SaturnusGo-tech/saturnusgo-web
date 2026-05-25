"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { CORE_HOME_SCREEN_PHRASES } from "../../../../constants";
import styles from "../styles/styles.module.css";

export default function ScreensMarquee() {
  const contentRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const [isReducedMotion, setIsReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncMotionPreference = () => setIsReducedMotion(mediaQuery.matches);

    syncMotionPreference();
    mediaQuery.addEventListener("change", syncMotionPreference);

    return () => mediaQuery.removeEventListener("change", syncMotionPreference);
  }, []);

  useLayoutEffect(() => {
    const element = contentRef.current;

    if (!element) {
      return;
    }

    const observer = new ResizeObserver(() => {
      const width = element.getBoundingClientRect().width;
      const nextDuration = Math.max(14, width / 62);
      element.style.setProperty("--content-width", `${width}px`);
      railRef.current?.style.setProperty("--duration", `${nextDuration}s`);
    });

    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  return (
    <div className={`${styles.wrap} ${styles.hoverPause}`} role="region" aria-label="Product flows">
      <div
        ref={railRef}
        className={styles.rail}
        data-paused={isReducedMotion ? "true" : "false"}
      >
        <div className={styles.content} ref={contentRef}>
          {CORE_HOME_SCREEN_PHRASES.map((phrase) => (
            <span className={styles.item} key={`a-${phrase}`}>
              <strong>{phrase}</strong>
            </span>
          ))}
        </div>
        <div className={styles.content} aria-hidden>
          {CORE_HOME_SCREEN_PHRASES.map((phrase) => (
            <span className={styles.item} key={`b-${phrase}`}>
              <strong>{phrase}</strong>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
