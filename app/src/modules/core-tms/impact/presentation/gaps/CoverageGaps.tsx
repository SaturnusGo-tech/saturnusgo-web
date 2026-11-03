import { useState } from "react";
import type { ImpactAnalysis, ImpactCommand } from "../../model/impact-types";
import { ReviewCollection } from "../review/ReviewCollection";
import { GapRow } from "./GapRow";
import css from "./gaps.module.css";

export type CoverageGapProps = {
  analysis: ImpactAnalysis; ru: boolean; writable: boolean; pending: boolean;
  command: (value: ImpactCommand) => Promise<void>;
};

export function CoverageGaps(props: CoverageGapProps) {
  const { analysis } = props;
  return <GapList key={JSON.stringify([analysis.workspaceId, analysis.projectId, analysis.id])} {...props} />;
}

function GapList({ analysis, ru, writable, pending, command }: CoverageGapProps) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [acknowledging, setAcknowledging] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const gaps = analysis.result?.coverageGaps ?? [];
  const toggle = (id: string) => {
    setExpanded(current => current === id ? null : id);
    setAcknowledging(null);
  };
  return <section className={css.section} id="impact-coverage-gaps" aria-label={ru ? "Пробелы покрытия" : "Coverage gaps"}>
    <header className={css.heading}>
      <h3>{ru ? "Пробелы покрытия" : "Coverage gaps"}</h3>
      <p>{ru ? "Черновики требуют проверки QA и не включаются в прогон автоматически." : "Drafts require QA review and are not added to the run automatically."}</p>
    </header>
    {!gaps.length && <p className={css.empty}>{analysis.result
      ? (ru ? "Анализ не сообщил о пробелах покрытия." : "The analysis reported no coverage gaps.")
      : (ru ? "Результат анализа ещё не получен." : "Analysis results are not available yet.")}</p>}
    <ReviewCollection items={gaps} ru={ru} label={ru ? "Пробелы покрытия" : "Coverage gaps"}
      text={gap => [gap.area, gap.reason, gap.platform, ...gap.changedFiles, ...gap.suggestedTestCases].join(" ")}>
      {gap => <GapRow key={gap.id} gap={gap} analysis={analysis} ru={ru} writable={writable} pending={pending} command={command}
        expanded={expanded === gap.id} onToggle={() => toggle(gap.id)} acknowledging={acknowledging === gap.id}
        onAcknowledge={() => setAcknowledging(current => current === gap.id ? null : gap.id)}
        reason={drafts[gap.id] ?? ""} onReason={reason => setDrafts(current => ({ ...current, [gap.id]: reason }))} />}
    </ReviewCollection>
  </section>;
}
