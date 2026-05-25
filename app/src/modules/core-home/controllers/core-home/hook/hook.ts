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

export function useCoreHomeController(): CoreHomeControllerModel {
  const pathname = usePathname();
  const experienceMountRef = useRef<HTMLDivElement | null>(null);
  const [shouldForceExperienceMount, setShouldForceExperienceMount] =
    useState(false);
  const [shouldMountExperience, setShouldMountExperience] = useState(false);

  useReveal();

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

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (
          entry?.isIntersecting &&
          entry.intersectionRatio >= CORE_HOME_EXPERIENCE_LAZY_MOUNT.threshold
        ) {
          setShouldMountExperience(true);
          observer.disconnect();
        }
      },
      CORE_HOME_EXPERIENCE_LAZY_MOUNT,
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [shouldForceExperienceMount, shouldMountExperience]);

  return {
    pathname,
    shouldMountExperience,
    experienceMountRef,
  };
}
