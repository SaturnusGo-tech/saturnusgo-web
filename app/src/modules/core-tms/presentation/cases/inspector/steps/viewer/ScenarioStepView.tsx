"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import type { TestStep } from "../../../../../../../core/tms/contracts/legacy-contract";
import { SavedScenarioAttachments, PendingScenarioAttachments } from "../support/ScenarioAttachments";
import { ScenarioMarkdown } from "../markdown/ScenarioMarkdown";
import css from "../scenarioSteps.module.css";

export function ScenarioStepView({ step, order, ru }: {
  step: TestStep;
  order: number;
  ru: boolean;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const collapseLabel = collapsed
    ? (ru ? `Развернуть шаг ${order}` : `Expand step ${order}`)
    : (ru ? `Свернуть шаг ${order}` : `Collapse step ${order}`);

  return <article className={css.viewGroup} data-collapsed={collapsed || undefined}>
    <div className={css.viewLines}>
      <div className={`${css.viewLine} ${css.primaryLine}`}>
        <button type="button" className={css.collapseButton}
          aria-expanded={!collapsed} aria-label={collapseLabel}
          onClick={() => setCollapsed((value) => !value)}>
          {collapsed ? <ChevronRight size={13} /> : <ChevronDown size={13} />}
        </button>
        <span>{order}</span>
        <div className={css.viewCopy}><ScenarioMarkdown
          value={(collapsed ? step.action.split("\n")[0] : step.action) || (ru ? "Действие не указано" : "No action")}
          label={`${ru ? "Шаг" : "Step"} ${order}`} /></div>
      </div>
    </div>
    {!collapsed && step.expectedResult && <div className={css.expectedBlock}>
      <span className={css.expectedLabel}>{ru ? "Ожидаемый результат" : "Expected result"}</span>
      <ScenarioMarkdown value={step.expectedResult} label={ru ? "Ожидаемый результат" : "Expected result"} />
    </div>}
    {!collapsed && step.testData && <div className={css.viewData}>
      <span>{ru ? "Тестовые данные" : "Test data"}</span>
      <ScenarioMarkdown value={step.testData} label={ru ? "Тестовые данные" : "Test data"} />
    </div>}
    <PendingScenarioAttachments stepId={step.id} />
    {!collapsed && <SavedScenarioAttachments ids={step.attachmentIds} />}
  </article>;
}
