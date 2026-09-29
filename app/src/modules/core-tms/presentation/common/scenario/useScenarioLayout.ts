"use client";
import { useEffect, useState } from "react";
import { transitionScenarioLayout } from "./motion/transitionScenarioLayout";
export type ScenarioLayout = "list" | "grid";
const key = "falcon.scenario.layout.v1";
const event = "falcon-scenario-layout";

export function useScenarioLayout() {
  const [layout, setLayout] = useState<ScenarioLayout>("list");
  useEffect(() => {
    function restore() {
      try { setLayout(window.localStorage.getItem(key) === "grid" ? "grid" : "list"); } catch { /* Storage can be unavailable. */ }
    }
    restore();
    window.addEventListener("storage", restore);
    window.addEventListener(event, restore);
    return () => { window.removeEventListener("storage", restore); window.removeEventListener(event, restore); };
  }, []);
  function choose(next: ScenarioLayout) {
    if (next === layout) return;
    transitionScenarioLayout(() => {
      setLayout(next);
      try { window.localStorage.setItem(key, next); window.dispatchEvent(new Event(event)); } catch { /* Keep the choice for this view. */ }
    });
  }
  return [layout, choose] as const;
}
