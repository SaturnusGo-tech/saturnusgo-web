"use client";

import { Tab, Tabs } from "@heroui/react";
import { Columns2, List } from "lucide-react";
import type { ScenarioLayout } from "./useScenarioLayout";
import css from "./scenario-layout.module.css";

export function ScenarioLayoutToggle({ value, onChange, ru }: {
  value: ScenarioLayout; onChange: (layout: ScenarioLayout) => void; ru: boolean;
}) {
  const list = ru ? "Список шагов" : "Step list";
  const grid = ru ? "Шаг и результат рядом" : "Step and result side by side";
  return <Tabs aria-label={ru ? "Вид сценария" : "Scenario layout"} selectedKey={value}
    classNames={{ base: css.base, tabList: css.toggle, tab: css.tab, tabContent: css.content, cursor: css.cursor }}
    motionProps={{ transition: { type: "spring", duration: .3, bounce: 0 } }}
    onSelectionChange={(key) => { if (key === "list" || key === "grid") onChange(key); }}>
    <Tab key="list" aria-label={list} title={<List size={15} aria-hidden="true" />} />
    <Tab key="grid" aria-label={grid} title={<Columns2 size={15} aria-hidden="true" />} />
  </Tabs>;
}
