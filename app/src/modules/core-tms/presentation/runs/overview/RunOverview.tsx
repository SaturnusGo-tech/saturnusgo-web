import type { TestRunSummary } from "../../../../../core/tms/contracts/legacy-contract";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { localizedLabel } from "../../../localization/format/labels";
import { ResponsibleName } from "../../../workspace/members/presentation/ResponsibleName";
import { RunPlatformBuildSummary } from "../../../runs/builds/presentation/summary/RunPlatformBuildSummary";
import { MarkdownField } from "../../cases/inspector/markdown/MarkdownField";
import css from "./runOverview.module.css";

export function RunOverview({ run, workspaceId, offline }: {
  run: TestRunSummary; workspaceId: string; offline: boolean;
}) {
  const { locale } = useTmsLocale(); const ru = locale === "ru";
  const tags = run.tags ?? [];
  const builds = run.platformBuilds ?? [];
  const status = run.archivedAt ? "archived" : run.status;
  return <section className={css.overview} aria-label={ru ? "Информация о прогоне" : "Run information"} data-testid="run-overview">
    <header className={css.heading}>
      <div className={css.title}><span>{ru ? "Прогон" : "Run"} · {run.key}</span><h2>{run.name}</h2></div>
      <div className={css.progress}>
        <span>{status === "paused" ? (ru ? "Приостановлен" : "Paused") : localizedLabel(locale, status)}</span>
        <span>{ru ? "Проверено" : "Executed"}: {run.progress.executed} / {run.itemCount} · {run.progress.percent}%</span>
      </div>
    </header>
    <div className={`${css.content} ${builds.length ? css.withBuilds : ""}`}>
      <div className={css.narrative}>
        <span className={css.label}>{ru ? "Описание прогона" : "Run description"}</span>
        <div className={css.description}>
          <MarkdownField value={run.description ?? ""} label={ru ? "Описание прогона" : "Run description"}
            emptyLabel={ru ? "Не указано" : "Not provided"} allowAttachments={false} />
        </div>
        <div className={css.tags} aria-label={ru ? "Теги прогона" : "Run tags"}>
          <span className={css.label}>{ru ? "Теги" : "Tags"}</span>
          {tags.length ? tags.map((tag) => <span key={tag}>{tag}</span>) : <span className={css.empty}>—</span>}
        </div>
      </div>
      <dl className={css.facts}>
        <div className={css.owner}><dt>{ru ? "Ответственный за прогон" : "Run owner"}</dt>
          <dd><ResponsibleName workspaceId={workspaceId} identityId={run.ownerIdentityId ?? null} offline={offline} /></dd></div>
        <div><dt>{ru ? "Окружение" : "Environment"}</dt><dd>{run.environment.name || "—"}</dd></div>
        <div><dt>{ru ? "Версия релиза" : "Release version"}</dt><dd>{run.build || "—"}</dd></div>
      </dl>
      {builds.length > 0 && <div className={css.builds}>
        <RunPlatformBuildSummary builds={builds} ru={ru} />
      </div>}
    </div>
  </section>;
}
