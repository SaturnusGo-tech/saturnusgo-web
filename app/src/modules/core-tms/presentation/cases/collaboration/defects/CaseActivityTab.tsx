import { AlertCircle, Bug, FileClock, RotateCw } from "lucide-react";
import type { Activity, TestCaseSummary } from "../../../../../../core/tms/contracts/legacy-contract";
import { activityLabel } from "../../../../localization/activity/label";
import type { TmsLocale } from "../../../../localization/model/locale";
import type { CaseCollaborationViewModel } from "../model";
import { activityActorLabel, caseActivityForKey } from "../model";
import { CaseDefectRecord } from "./CaseDefectRecord";
import styles from "../../cases.module.css";
import css from "../caseCollaboration.module.css";

type Props = {
  locale: TmsLocale;
  languageTag: string;
  testCase?: TestCaseSummary;
  activity: Activity[];
  model: CaseCollaborationViewModel;
  onOpenDefect: (defectId: string) => void;
  onRunCase: () => void;
};

export function CaseActivityTab(props: Props) {
  const ru = props.locale === "ru";
  const caseActivity = caseActivityForKey(props.activity, props.testCase?.key);
  const empty = props.model.defects.status === "ready"
    && !props.model.defects.refreshFailed
    && props.model.defects.items.length === 0 && caseActivity.length === 0;

  if (empty) return <div className={styles.tabEmpty}>
    <FileClock size={22} /><span>{ru ? "История пока пуста" : "No activity yet"}</span>
  </div>;

  return <div className={styles.contextList}>
    {(props.model.defects.status !== "ready" || props.model.defects.items.length > 0
      || props.model.defects.refreshFailed) && <section aria-labelledby="case-defect-history-title">
      <header className={css.groupHeading}>
        <span><Bug size={15} /><strong id="case-defect-history-title">
          {ru ? "Баг-репорты" : "Bug reports"}
        </strong></span>
        {props.model.defects.status === "ready" && <div className={css.headingActions}>
          <b>{props.model.defects.items.length}{props.model.defects.hasMore ? "+" : ""}</b>
          <button
            type="button"
            data-loading={props.model.defects.refreshing || undefined}
            disabled={props.model.defects.refreshing}
            aria-label={ru ? "Обновить историю багов" : "Refresh bug history"}
            onClick={props.model.refreshDefects}
          ><RotateCw size={13} /></button>
        </div>}
      </header>
      {props.model.defects.status === "ready" && props.model.defects.refreshFailed && <div
        className={css.refreshError} role="alert"
      ><AlertCircle size={13} />
        {ru ? "Не удалось обновить статусы. Повторите загрузку." : "Could not refresh statuses. Try again."}
      </div>}
      {props.model.defects.status === "loading" && <div
        className={`${css.loadState} ${css.sectionLoadState}`} role="status" aria-busy="true"
      >{ru ? "Загрузка истории багов…" : "Loading bug history…"}</div>}
      {props.model.defects.status === "error" && <div
        className={`${css.loadState} ${css.sectionLoadState}`} role="alert"
      ><AlertCircle size={20} />
        <strong>{ru ? "Не удалось загрузить историю багов" : "Could not load bug history"}</strong>
        <button type="button" onClick={props.model.retryDefects}>
          <RotateCw size={14} />{ru ? "Повторить" : "Retry"}
        </button>
      </div>}
      {props.model.defects.status === "unavailable" && <div
        className={`${css.loadState} ${css.sectionLoadState}`}
      ><span>{ru ? "История багов доступна после подключения к серверу" : "Bug history is available when connected to the server"}</span></div>}
      {props.model.defects.status === "ready" && <div className={css.defectList}>{props.model.defects.items.map((defect) => <CaseDefectRecord
        key={defect.occurrence.id}
        locale={props.locale}
        languageTag={props.languageTag}
        caseId={props.testCase?.id ?? ""}
        defect={defect}
        model={props.model}
        onOpenDefect={props.onOpenDefect}
        onRunCase={props.onRunCase}
      />)}</div>}
      {props.model.defects.status === "ready"
        && (props.model.defects.hasMore || props.model.defects.loadMoreFailed)
        && <div className={css.pagination}>
          {props.model.defects.loadMoreFailed && <span role="alert">
            {ru ? "Не удалось загрузить более ранние баг-репорты." : "Could not load older bug reports."}
          </span>}
          <button
            type="button"
            disabled={props.model.defects.loadingMore || props.model.defects.refreshing}
            aria-busy={props.model.defects.loadingMore
              || props.model.defects.refreshing || undefined}
            onClick={props.model.defects.hasMore
              ? props.model.loadMoreDefects : props.model.refreshDefects}
          >{props.model.defects.loadingMore || props.model.defects.refreshing
            ? (ru ? "Загрузка…" : "Loading…")
            : props.model.defects.loadMoreFailed
              ? props.model.defects.hasMore ? (ru ? "Повторить" : "Retry") : (ru ? "Обновить" : "Refresh")
            : (ru ? "Загрузить ещё" : "Load more")}</button>
        </div>}
    </section>}
    {caseActivity.length > 0 && <section aria-labelledby="case-change-history-title">
      <header className={css.groupHeading}>
        <span><FileClock size={15} /><strong id="case-change-history-title">
          {ru ? "Изменения тест-кейса" : "Test case changes"}
        </strong></span>
        <b>{caseActivity.length}</b>
      </header>
      {caseActivity.slice(0, 20).map((entry) => <div className={styles.activityRecord} key={entry.id}>
        <span aria-hidden="true">{activityActorLabel(entry.actor).slice(0, 1).toUpperCase()}</span>
        <div>
          <strong>{activityLabel(props.locale, entry.action)}</strong>
          <small>{activityActorLabel(entry.actor)} · {formatTime(entry.createdAt, props.languageTag)}</small>
        </div>
      </div>)}
    </section>}
  </div>;
}

function formatTime(value: string, languageTag: string) {
  return new Intl.DateTimeFormat(languageTag, {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  }).format(new Date(value));
}
