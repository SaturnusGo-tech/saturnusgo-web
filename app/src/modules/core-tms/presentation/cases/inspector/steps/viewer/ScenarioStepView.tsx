"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import type { TestStep } from "../../../../../../../core/tms/contracts/legacy-contract";
import { SavedScenarioAttachments } from "../support/ScenarioAttachments";
import { scenarioLineLabel, splitScenarioAction } from "../support/scenarioLines";
import css from "../scenarioSteps.module.css";

export function ScenarioStepView({ step, order, ru }: {
  step: TestStep;
  order: number;
  ru: boolean;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const lines = splitScenarioAction(step.action)
    .filter((line, lineIndex) => lineIndex === 0 || line.trim());
  const visibleLines = collapsed ? lines.slice(0, 1) : lines;
  const collapseLabel = collapsed
    ? (ru ? `Развернуть шаг ${order}` : `Expand step ${order}`)
    : (ru ? `Свернуть шаг ${order}` : `Collapse step ${order}`);

  return <article className={css.viewGroup} data-collapsed={collapsed || undefined}>
    <div className={css.viewLines}>
      {visibleLines.map((line, lineIndex) => <div
        className={`${css.viewLine} ${lineIndex === 0 ? css.primaryLine : css.nestedLine}`}
        key={`${step.id}-${lineIndex}`}>
        {lineIndex === 0 && <button type="button" className={css.collapseButton}
          aria-expanded={!collapsed} aria-label={collapseLabel}
          onClick={() => setCollapsed((value) => !value)}>
          {collapsed ? <ChevronRight size={13} /> : <ChevronDown size={13} />}
        </button>}
        <span>{scenarioLineLabel(order, lineIndex)}</span>
        <p>{line || (ru ? "Действие не указано" : "No action")}</p>
      </div>)}
    </div>
    {!collapsed && step.expectedResult && <div className={css.expectedBlock}>
      <span className={css.expectedLabel}>{ru ? "Ожидаемый результат" : "Expected result"}</span>
      <p className={css.viewCopy}>{step.expectedResult}</p>
    </div>}
    {!collapsed && step.testData && <div className={css.viewData}>
      <span>{ru ? "Тестовые данные" : "Test data"}</span>
      <p>{step.testData}</p>
    </div>}
    {!collapsed && <SavedScenarioAttachments ids={step.attachmentIds} />}
  </article>;
}
