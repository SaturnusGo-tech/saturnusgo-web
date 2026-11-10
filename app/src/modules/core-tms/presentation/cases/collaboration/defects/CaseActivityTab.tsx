import { ErrorToast } from "../../../common/error/ErrorToast";
import { LoadingOrb } from "../../../../../../shared/components/loading/LoadingOrb";
import { useCaseHistory } from "../../../../test-cases/history/state/useCaseHistory";
import { MemberAvatar } from "../../../../workspace/members/avatar/MemberAvatar";
import { Bug, FileClock, RotateCw } from "lucide-react";
import type { Activity, TestCaseSummary } from "../../../../../../core/tms/contracts/legacy-contract";
import { activityLabel } from "../../../../localization/activity/label";
import type { TmsLocale } from "../../../../localization/model/locale";
import type { CaseCollaborationViewModel } from "../model";
import { activityActorLabel, caseActivityForKey } from "../model";
import { CaseDefectRecord } from "./CaseDefectRecord";
import { CaseTabEmpty } from "../../detail/tabs/empty/CaseTabEmpty";
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
  const history = useCaseHistory(props.testCase, caseActivityForKey(props.activity, props.testCase?.key));
  const caseActivity = history.items;
  const empty = !history.loading && !history.error && props.model.defects.status === "ready"
    && !props.model.defects.refreshFailed
    && props.model.defects.items.length === 0 && caseActivity.length === 0;

  if (empty) return <CaseTabEmpty kind="history" locale={props.locale} />;

  return <div className={styles.contextList}>
    {history.loading && <div role="status" aria-label={ru ? "Загрузка истории" : "Loading history"} aria-busy="true" className={css.historySkeleton}><i /><i /><i /></div>}
    <ErrorToast message={history.error ? (ru ? "Не удалось загрузить историю." : "Could not load history.") : null}
      retryLabel={ru ? "Повторить" : "Retry"} onRetry={history.retry} />
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
            aria-busy={props.model.defects.refreshing || undefined}
            disabled={props.model.defects.refreshing}
            aria-label={ru ? "Обновить историю багов" : "Refresh bug history"}
            onClick={props.model.refreshDefects}
          >{props.model.defects.refreshing ? <LoadingOrb size="xs" /> : <RotateCw size={13} />}</button>
        </div>}
      </header>
      <ErrorToast message={props.model.defects.status === "ready" && props.model.defects.refreshFailed
        ? (ru ? "Не удалось обновить статусы." : "Could not refresh statuses.") : null}
        retryLabel={ru ? "Повторить" : "Retry"} onRetry={props.model.refreshDefects} />
      {props.model.defects.status === "loading" && <div
        className={`${css.loadState} ${css.sectionLoadState}`} role="status" aria-busy="true"
      >{ru ? "Загрузка истории багов…" : "Loading bug history…"}</div>}
      <ErrorToast message={props.model.defects.status === "error" ? (ru ? "Не удалось загрузить историю багов" : "Could not load bug history") : null}
        retryLabel={ru ? "Повторить" : "Retry"} onRetry={props.model.retryDefects} />
      {props.model.defects.status === "unavailable" && <div
        className={`${css.loadState} ${css.sectionLoadState}`}
      ><span>{ru ? "История багов доступна после подключения к серверу" : "Bug history is available when connected to the server"}</span></div>}
      {props.model.defects.status === "ready" && <div className={css.defectList}>{props.model.defects.items.map((defect) => <CaseDefectRecord
        key={defect.occurrence?.id ?? defect.defectId}
        locale={props.locale}
        languageTag={props.languageTag}
        caseId={props.testCase?.id ?? ""}
        defect={defect}
        model={props.model}
        onOpenDefect={props.onOpenDefect}
        onRunCase={props.testCase?.archivedAt ? undefined : props.onRunCase}
      />)}</div>}
      {props.model.defects.status === "ready"
        && (props.model.defects.hasMore || props.model.defects.loadMoreFailed)
        && <div className={css.pagination}>
          <ErrorToast message={props.model.defects.loadMoreFailed ? (ru ? "Не удалось загрузить более ранние баг-репорты." : "Could not load older bug reports.") : null} />
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
      {caseActivity.map((entry) => <div className={styles.activityRecord} key={entry.id}>
        <MemberAvatar identityId={entry.actorIdentityId ?? null} name={activityActorLabel(entry.actor)} />
        <div>
          <strong>{activityLabel(props.locale, entry.action)}</strong>
          <small>{activityActorLabel(entry.actor)} · {formatTime(entry.createdAt, props.languageTag)}</small>
        </div>
      </div>)}
      {history.nextCursor && <button type="button" disabled={history.loading} onClick={history.loadMore}>{ru ? "Загрузить ещё" : "Load more"}</button>}
    </section>}
  </div>;
}

function formatTime(value: string, languageTag: string) {
  return new Intl.DateTimeFormat(languageTag, {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  }).format(new Date(value));
}
