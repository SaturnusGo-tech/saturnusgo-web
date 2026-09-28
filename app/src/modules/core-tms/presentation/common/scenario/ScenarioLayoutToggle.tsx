"use client";
import { Columns2, List } from "lucide-react";
import type { ScenarioLayout } from "./useScenarioLayout";
import css from "./scenario-layout.module.css";

export function ScenarioLayoutToggle({ value, onChange, ru }: {
  value: ScenarioLayout; onChange: (layout: ScenarioLayout) => void; ru: boolean;
}) {
  return <div className={css.toggle} role="group" aria-label={ru ? "Вид сценария" : "Scenario layout"}>
    <button type="button" aria-pressed={value === "list"} aria-label={ru ? "Список шагов" : "Step list"}
      title={ru ? "Список шагов" : "Step list"} onClick={() => onChange("list")}><List size={15} aria-hidden="true" /></button>
    <button type="button" aria-pressed={value === "grid"} aria-label={ru ? "Шаг и результат рядом" : "Step and result side by side"}
      title={ru ? "Шаг и результат рядом" : "Step and result side by side"} onClick={() => onChange("grid")}><Columns2 size={15} aria-hidden="true" /></button>
  </div>;
}
