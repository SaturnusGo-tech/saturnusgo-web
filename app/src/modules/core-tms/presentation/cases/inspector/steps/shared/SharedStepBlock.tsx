"use client";

import { ChevronDown, ChevronRight, Repeat2 } from "lucide-react";
import { useState } from "react";
import type { SharedStepSnapshot } from "../../../../../../../core/tms/contracts/legacy-contract";
import type { SharedStepSummary } from "../../../../../shared-steps/model/shared-step";
import { StepActionMenu } from "../menu/StepActionMenu";
import { SavedScenarioAttachments } from "../support/ScenarioAttachments";
import { splitScenarioAction } from "../support/scenarioLines";
import css from "./sharedStepBlock.module.css";

export function SharedStepBlock({
  snapshot, order, editing, ru, sharedSteps, canRemove, onAdd, onInsertShared,
  onDuplicate, onRemove,
}: {
  snapshot: SharedStepSnapshot;
  order: number;
  editing: boolean;
  ru: boolean;
  sharedSteps: readonly SharedStepSummary[];
  canRemove: boolean;
  onAdd: (withExpectedResult: boolean) => void;
  onInsertShared: (id: string) => void;
  onDuplicate: () => void;
  onRemove: () => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  return <article className={css.block}>
    <header className={css.header}>
      <button type="button" className={css.collapse}
        aria-expanded={!collapsed}
        aria-label={collapsed
          ? (ru ? `Развернуть общий шаг ${order}` : `Expand shared step ${order}`)
          : (ru ? `Свернуть общий шаг ${order}` : `Collapse shared step ${order}`)}
        onClick={() => setCollapsed((value) => !value)}>
        {collapsed ? <ChevronRight size={13} /> : <ChevronDown size={13} />}
      </button>
      <span className={css.order}>{order}</span>
      <span className={css.mark}><Repeat2 size={14} /></span>
      <strong>{snapshot.title}</strong>
      {editing && <StepActionMenu ru={ru} sharedSteps={sharedSteps} canRemove={canRemove}
        onAdd={onAdd} onInsertShared={onInsertShared}
        onDuplicate={onDuplicate} onRemove={onRemove} />}
    </header>
    {!collapsed && <div className={css.items}>
      {snapshot.items.map((item, itemIndex) => <div className={css.item} key={item.id}>
        {splitScenarioAction(item.action).filter((line, index) => index === 0 || line.trim())
          .map((line, lineIndex) => <div className={css.line} key={`${item.id}-${lineIndex}`}>
            <span>{lineIndex === 0 ? `${order}.${itemIndex + 1}`
              : `${order}.${itemIndex + 1}.${lineIndex}`}</span>
            <p>{line || (ru ? "Действие не указано" : "No action")}</p>
          </div>)}
        {item.expectedResult && <div className={css.expected}>
          <b>{ru ? "Ожидаемый результат" : "Expected result"}</b>
          <p>{item.expectedResult}</p>
        </div>}
        {item.testData && <div className={css.data}><b>{ru ? "Тестовые данные" : "Test data"}</b>
          <p>{item.testData}</p></div>}
        <SavedScenarioAttachments ids={item.attachmentIds} />
      </div>)}
    </div>}
  </article>;
}
