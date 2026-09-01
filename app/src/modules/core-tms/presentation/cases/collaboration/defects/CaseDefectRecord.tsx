import {
  AlertTriangle, Bug, CheckCircle2, Clock3, ExternalLink, Play, ShieldCheck,
} from "lucide-react";
import type { MouseEvent } from "react";
import { localizedLabel } from "../../../../localization/format/labels";
import type { TmsLocale } from "../../../../localization/model/locale";
import {
  canConfirmDefectFix, type CaseLinkedDefect,
} from "../../../../test-cases/collaboration/model/test-case-collaboration";
import type { CaseCollaborationViewModel } from "../model";
import {
  collaborationFailureLabel, defectStepLabel, fixBlockedLabel,
  fixVerificationSourceLabel, hasObservedYouTrackAcceptance, hasYouTrackSyncWarning,
  supersededTransitionLabel, youTrackCreationLabel, youTrackTargetLabel,
} from "../model";
import css from "../caseCollaboration.module.css";

type Props = {
  locale: TmsLocale;
  languageTag: string;
  caseId: string;
  defect: CaseLinkedDefect;
  model: CaseCollaborationViewModel;
  onOpenDefect: (defectId: string) => void;
  onRunCase: () => void;
};

export function CaseDefectRecord(props: Props) {
  const { defect, model } = props;
  const ru = props.locale === "ru";
  const confirming = model.confirmingOccurrenceId === defect.occurrence.id;
  const mutationFailure = model.confirmationFailure?.occurrenceId === defect.occurrence.id
    ? model.confirmationFailure.reason : null;
  const terminal = defect.status === "verified" || defect.status === "closed";
  const transition = defect.youTrackTransition;
  const creation = defect.youTrack ? null : defect.youTrackCreation;
  const transitionTarget = transition
    ? youTrackTargetLabel(props.locale, transition.targetStatus) : "";
  const verification = defect.fixVerification;
  const verificationSource = fixVerificationSourceLabel(props.locale, defect, props.caseId);
  const syncWarning = hasYouTrackSyncWarning(defect);
  const reconciling = model.defects.refreshing;
  const reconciliationFailed = model.defects.refreshFailed;
  const allowed = model.canConfirmFix && !reconciling && !reconciliationFailed
    && canConfirmDefectFix(defect);
  const blocked = terminal ? "" : reconciliationFailed
    ? (ru ? "Сначала обновите статусы багов." : "Refresh the bug statuses first.")
    : !model.canConfirmFix
    ? (ru ? "Недостаточно прав для подтверждения фикса." : "You do not have permission to confirm the fix.")
    : fixBlockedLabel(props.locale, defect);

  function openFalcon(event: MouseEvent<HTMLAnchorElement>) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    props.onOpenDefect(defect.defectId);
  }

  return <article className={css.defectCard} data-ready={defect.readyForTest || undefined}>
    <header className={css.defectHeader}>
      <span className={css.defectIcon}><Bug size={15} /></span>
      <div>
        <a href={defect.falconUrl} onClick={openFalcon}>
          <strong>{defect.key}</strong><span>{defect.title}</span>
        </a>
        <small>
          {ru ? "Баг зарегистрирован" : "Bug reported"} · {formatTime(defect.reportedAt, props.languageTag)}
          {" · "}{defectStepLabel(props.locale, defect.occurrence)}
        </small>
        {defect.occurrence.stepAction && <p className={css.stepSnapshot}>{defect.occurrence.stepAction}</p>}
      </div>
      <span className={css.statusBadge} data-status={defect.status}>
        {localizedLabel(props.locale, defect.status)}
      </span>
    </header>

    {defect.readyForTest && <div className={css.readyBanner} role="status">
      <CheckCircle2 size={15} />
      <strong>{ru ? "Готово к тестированию" : "Ready for testing"}</strong>
      <span>{defect.youTrack
        ? `${ru ? "YouTrack" : "YouTrack"}: ${defect.youTrack.status}`
        : (ru ? "Статус получен в Falcon" : "Status received in Falcon")}</span>
    </div>}

    <div className={css.defectLinks}>
      <a href={defect.falconUrl} onClick={openFalcon}>
        {ru ? "Открыть баг в Falcon" : "Open bug in Falcon"}<ExternalLink size={13} />
      </a>
      {defect.youTrack && <a href={defect.youTrack.url} target="_blank" rel="noreferrer">
        {defect.youTrack.key} · YouTrack · {defect.youTrack.status}<ExternalLink size={13} />
      </a>}
    </div>
    {creation && (creation.status === "pending" || creation.status === "published") && <div
      className={css.queuedStatus} role="status"
    ><Clock3 size={14} />{youTrackCreationLabel(props.locale, creation)}</div>}

    {defect.statusHistory.length > 0 && <ol className={css.statusHistory}>
      {defect.statusHistory.map((event, index) => <li
        key={`${event.occurredAt}-${event.toStatus}-${index}`}
      >
        <i aria-hidden="true" />
        <span><strong>{localizedLabel(props.locale, event.toStatus)}</strong>
          {event.reason && <em>{event.reason}</em>}
        </span>
        <time dateTime={event.occurredAt}>{formatTime(event.occurredAt, props.languageTag)}</time>
      </li>)}
    </ol>}
    {defect.historyTruncated && <p className={css.historyNote}>
      {ru ? "Показаны последние изменения статуса." : "Showing the latest status changes."}
    </p>}

    {terminal && verification && <div className={css.verifiedStatus} role="status">
      <ShieldCheck size={14} />
      <span>{ru ? `Исправление подтверждено ретестом ${verificationSource} в Falcon`
        : `The fix was confirmed by a Falcon retest of ${verificationSource}`}
        {" · "}<time dateTime={verification.verifiedAt}>
          {formatTime(verification.verifiedAt, props.languageTag)}
        </time>
      </span>
    </div>}
    {!terminal && verification && <div
      className={css.neutralStatus} role="status"
    ><Clock3 size={14} /><span>
        {ru ? `Предыдущее исправление было подтверждено ретестом ${verificationSource}`
          : `A previous fix was confirmed by a retest of ${verificationSource}`}
        {" · "}<time dateTime={verification.verifiedAt}>
          {formatTime(verification.verifiedAt, props.languageTag)}
        </time>{ru ? "; баг возвращён в работу." : "; the bug has returned to work."}
      </span>
    </div>}
    {terminal && !verification && <div className={css.neutralStatus} role="status">
      <Clock3 size={14} />
      {ru
        ? "В Falcon установлен финальный статус; подтверждение точным ретестом не зарегистрировано."
        : "Falcon has a final status; no exact retest confirmation is recorded."}
    </div>}
    {!terminal && <footer className={css.verification}>
      {blocked && <p>{blocked}</p>}
      {defect.fixConfirmationBlockedReason === "retest_required" && model.canConfirmFix && <button
        type="button" className={css.retestButton} onClick={props.onRunCase}
      ><Play size={13} />{ru ? "Запустить повторную проверку" : "Run retest"}</button>}
      <button
        type="button"
        disabled={!allowed || confirming}
        aria-describedby={blocked ? `defect-block-${defect.occurrence.id}` : undefined}
        onClick={() => { void model.confirmFix(defect); }}
      ><ShieldCheck size={14} />{confirming
        ? (ru ? "Подтверждение…" : "Confirming…")
        : reconciling ? (ru ? "Обновление статуса…" : "Refreshing status…")
        : reconciliationFailed ? (ru ? "Требуется обновление" : "Refresh required")
        : mutationFailure ? (ru ? "Повторить подтверждение" : "Retry confirmation")
        : (ru ? "Баг исправлен после ретеста" : "Confirm fixed after retest")}</button>
      {blocked && <span id={`defect-block-${defect.occurrence.id}`} className={css.srOnly}>{blocked}</span>}
    </footer>}
    {mutationFailure && <div className={css.inlineError} role="alert">
      {collaborationFailureLabel(props.locale, mutationFailure)}
    </div>}
    {syncWarning && <div className={css.syncWarning} role="alert">
      <AlertTriangle size={14} />{creation
        ? youTrackCreationLabel(props.locale, creation)
        : defect.youTrack?.syncStatus === "deleted"
        ? (ru
            ? "Связанная задача YouTrack удалена или больше недоступна. Обратитесь к администратору интеграции."
            : "The linked YouTrack issue was deleted or is no longer available. Contact the integration administrator.")
        : (ru
            ? "Синхронизация с YouTrack не завершена. Проверьте интеграцию и повторите её либо обратитесь к администратору."
            : "YouTrack sync did not complete. Check and retry the integration, or contact an administrator.")}
    </div>}
    {terminal && hasObservedYouTrackAcceptance(defect) && transition && <div className={css.verifiedStatus} role="status">
      <CheckCircle2 size={14} />{ru
        ? `YouTrack подтвердил переход «${transitionTarget}».`
        : `YouTrack confirmed the transition to “${transitionTarget}”.`}
    </div>}
    {transition?.status === "superseded" && <div className={css.neutralStatus} role="status">
      <Clock3 size={14} />{supersededTransitionLabel(props.locale, terminal)}
    </div>}
    {terminal && !syncWarning && transition && !transition.observedAccepted
      && (transition.status === "pending" || transition.status === "published") && <div
      className={css.queuedStatus} role="status"
    ><Clock3 size={14} />{transition.status === "published"
      ? (ru
          ? `Переход YouTrack «${transitionTarget}» отправлен; ожидается подтверждение YouTrack.`
          : `The YouTrack transition to “${transitionTarget}” was sent; awaiting YouTrack confirmation.`)
      : (ru
          ? `Переход YouTrack «${transitionTarget}» поставлен в очередь.`
          : `The YouTrack transition to “${transitionTarget}” is queued.`)}
    </div>}
  </article>;
}

function formatTime(value: string, languageTag: string) {
  return new Intl.DateTimeFormat(languageTag, {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  }).format(new Date(value));
}
