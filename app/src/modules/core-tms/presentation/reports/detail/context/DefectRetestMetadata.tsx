import { RotateCw } from "lucide-react";
import type { DefectRetest } from "../../../../runs/verification/state/defect/useDefectRetest";
import { useTmsLocale } from "../../../../localization/context/useTmsLocale";
import css from "./retest-metadata.module.css";

export function DefectRetestMetadata({ retest }: { retest: DefectRetest }) {
  const { locale } = useTmsLocale(); const ru = locale === "ru";
  const run = retest.latest;
  if (!run) return retest.contextError ? <span className={css.unavailable}>{ru ? "Данные ретеста недоступны" : "Retest details unavailable"}</span> : null;
  return <span className={css.metadata} aria-label={ru ? "Последняя повторная проверка" : "Latest retest"}>
    <RotateCw size={14} aria-hidden="true" />
    <span>{ru ? "Повторный прогон" : "Retest run"}</span>
    <button type="button" onClick={retest.openLatest} title={run.name}>{run.key}</button>
  </span>;
}
