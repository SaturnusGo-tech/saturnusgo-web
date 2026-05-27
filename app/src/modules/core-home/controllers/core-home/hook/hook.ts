"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

import useReveal from "../../../../../shared/lib/useReveal";
import { CORE_HOME_EXPERIENCE_LAZY_MOUNT } from "../../../constants";
import {
  resolveCoreHomeAnchorTarget,
  scrollToHomeAnchor,
} from "../../../services";
import type { CoreHomeControllerModel } from "../../../types";

function writeScrollVariables() {
  const scrollY = Math.max(0, window.scrollY);
  const viewportHeight = Math.max(1, window.innerHeight);
  const heroProgress = Math.min(1, scrollY / viewportHeight);
  const root = document.documentElement;

  root.style.setProperty("--core-home-scroll-y", `${scrollY.toFixed(2)}px`);
  root.style.setProperty("--core-home-hero-progress", heroProgress.toFixed(4));
}

export function useCoreHomeController(): CoreHomeControllerModel {
  const pathname = usePathname();
  const frameRef = useRef<number | null>(null);
  const experienceMountRef = useRef<HTMLDivElement | null>(null);
  const [shouldForceExperienceMount, setShouldForceExperienceMount] =
    useState(false);
  const [shouldMountExperience, setShouldMountExperience] = useState(false);

  useReveal();

  useEffect(() => {
    writeScrollVariables();

    const requestWrite = () => {
      if (frameRef.current !== null) {
        return;
      }

      frameRef.current = window.requestAnimationFrame(() => {
        frameRef.current = null;
        writeScrollVariables();
      });
    };

    window.addEventListener("scroll", requestWrite, { passive: true });
    window.addEventListener("resize", requestWrite);

    return () => {
      window.removeEventListener("scroll", requestWrite);
      window.removeEventListener("resize", requestWrite);

      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const target = resolveCoreHomeAnchorTarget({
      hash: window.location.hash,
      search: window.location.search,
    });

    if (!target) {
      return;
    }

    setShouldForceExperienceMount(true);
    scrollToHomeAnchor(target);
  }, []);

  useEffect(() => {
    if (shouldForceExperienceMount || shouldMountExperience) {
      setShouldMountExperience(true);
      return;
    }

    const element = experienceMountRef.current;

    if (!element) {
      return;
    }

    if (typeof IntersectionObserver === "undefined") {
      setShouldMountExperience(true);
      return;
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (
        entry?.isIntersecting &&
        entry.intersectionRatio >= CORE_HOME_EXPERIENCE_LAZY_MOUNT.threshold
      ) {
        setShouldMountExperience(true);
        observer.disconnect();
      }
    }, CORE_HOME_EXPERIENCE_LAZY_MOUNT);

    observer.observe(element);

    return () => observer.disconnect();
  }, [shouldForceExperienceMount, shouldMountExperience]);

  return {
    pathname,
    shouldMountExperience,
    experienceMountRef,
  };
}
