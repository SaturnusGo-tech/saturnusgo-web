"use client";

import { useEffect, useRef, useState } from "react";

import useReveal from "../../../../../shared/lib/useReveal";
import { CORE_INVESTORS_HERO_LOADING_DURATION_MS } from "../../../constants";
import {
  openCoreInvestorsDeck,
  scrollToCoreInvestorsCta,
} from "../../../services";
import type { CoreInvestorsControllerModel } from "../../../types";

function writeCoreInvestorsScrollVariables() {
  const scrollY = Math.max(0, window.scrollY);
  const viewportHeight = Math.max(1, window.innerHeight);
  const heroProgress = Math.min(1, scrollY / viewportHeight);
  const root = document.documentElement;

  root.style.setProperty(
    "--core-investors-scroll-y",
    `${scrollY.toFixed(2)}px`,
  );
  root.style.setProperty(
    "--core-investors-hero-progress",
    heroProgress.toFixed(4),
  );
}

export function useCoreInvestorsController(): CoreInvestorsControllerModel {
  const frameRef = useRef<number | null>(null);
  const [heroProgress, setHeroProgress] = useState(0);
  const [isHeroReady, setIsHeroReady] = useState(false);

  useReveal();

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setHeroProgress(100);
      setIsHeroReady(true);
      return;
    }

    let frame = 0;
    const startedAt = performance.now();

    const update = (now: number) => {
      const nextProgress = Math.min(
        100,
        Math.round(
          ((now - startedAt) / CORE_INVESTORS_HERO_LOADING_DURATION_MS) * 100,
        ),
      );

      setHeroProgress(nextProgress);

      if (nextProgress >= 100) {
        setIsHeroReady(true);
        return;
      }

      frame = window.requestAnimationFrame(update);
    };

    frame = window.requestAnimationFrame(update);
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    writeCoreInvestorsScrollVariables();

    const requestWrite = () => {
      if (frameRef.current !== null) return;

      frameRef.current = window.requestAnimationFrame(() => {
        frameRef.current = null;
        writeCoreInvestorsScrollVariables();
      });
    };

    window.addEventListener("scroll", requestWrite, { passive: true });
    window.addEventListener("resize", requestWrite);

    return () => {
      window.removeEventListener("scroll", requestWrite);
      window.removeEventListener("resize", requestWrite);
      if (frameRef.current !== null)
        window.cancelAnimationFrame(frameRef.current);
    };
  }, []);

  return {
    heroProgress,
    isHeroReady,
    onIntroCtaClick: scrollToCoreInvestorsCta,
    onOpenDeck: openCoreInvestorsDeck,
  };
}
