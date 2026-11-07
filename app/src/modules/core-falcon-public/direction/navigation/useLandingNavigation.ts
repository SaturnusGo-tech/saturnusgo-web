"use client";
import { useEffect } from "react";

export function useLandingNavigation() {
  useEffect(() => {
    const restore = () => {
      const url = new URL(location.href);
      const legacyDemoLink = url.hash === "#book-demo";
      const legacyVideoLink = url.searchParams.get("view") === "workflow";
      if (!legacyDemoLink && !legacyVideoLink) return;
      if (legacyVideoLink) url.searchParams.delete("view");
      url.hash = legacyDemoLink ? "resources" : "";
      history.replaceState(history.state, "", url);
      if (legacyDemoLink) document.getElementById("resources")?.scrollIntoView();
    };
    restore();
    window.addEventListener("popstate", restore);
    return () => window.removeEventListener("popstate", restore);
  }, []);
}
