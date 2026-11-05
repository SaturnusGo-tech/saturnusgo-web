"use client";
import { useCallback, useEffect } from "react";

export function useLandingNavigation() {
  useEffect(() => {
    const restore = () => {
      const url = new URL(location.href);
      if (url.searchParams.get("view") !== "workflow") return;
      url.searchParams.delete("view");
      // Retired video links return to the current landing, preserving attribution.
      url.hash = url.hash === "#book-demo" ? "book-demo" : "";
      history.replaceState(history.state, "", url);
    };
    restore();
    window.addEventListener("popstate", restore);
    return () => window.removeEventListener("popstate", restore);
  }, []);

  return useCallback(() => {
    const target = document.getElementById("book-demo");
    if (!target) return;
    const url = new URL(location.href);
    url.hash = "book-demo";
    history.pushState({}, "", url);
    window.scrollTo({
      top: target.getBoundingClientRect().top + window.scrollY - 24,
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" as ScrollBehavior : "smooth",
    });
    target.querySelector<HTMLInputElement>("input[type=email]")?.focus({ preventScroll: true });
  }, []);
}
