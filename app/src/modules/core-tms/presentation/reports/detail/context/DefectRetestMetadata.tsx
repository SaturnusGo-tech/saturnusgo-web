import { Box, Database, Play } from "lucide-react";
import type { DefectRetest } from "../../../../runs/verification/state/defect/useDefectRetest";
import { useTmsLocale } from "../../../../localization/context/useTmsLocale";
import css from "./retest-metadata.module.css";

export function DefectRetestMetadata({ retest }: { retest: DefectRetest }) {
  const { locale } = useTmsLocale(); const ru = locale === "ru";
  const run = retest.latest;
  if (!run) return retest.contextError ? <span className={css.unavailable}>{ru ? "Данные ретеста недоступны" : "Retest details unavailable"}</span> : null;
  return <span className={css.metadata} aria-label={ru ? "Последняя повторная проверка" : "Latest retest"}>
    <button type="button" onClick={retest.openLatest} title={run.name}><Play size={12} aria-hidden="true"/>{run.key} · {run.name}</button>
    <span title={ru ? "Сборка и версия" : "Build and version"}><Box size={13} aria-hidden="true"/>{run.build}</span>
    <span title={ru ? "Окружение" : "Environment"}><Database size={13} aria-hidden="true"/>{run.environment.name}</span>
  </span>;
}
