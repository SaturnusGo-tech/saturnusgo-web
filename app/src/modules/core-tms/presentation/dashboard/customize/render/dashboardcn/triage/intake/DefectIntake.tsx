import { ErrorToast } from "../../../../../../common/error/ErrorToast";
import { Button } from "@heroui/react";
import { Box, Clock3, FlaskConical, Inbox } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import type { DefectTriageRow, DefectTriageScope, DefectTriageView } from "../../../../../../../defects/triage/defect-triage-source";
import { useDefectIntake } from "../../../../../../../defects/triage/useDefectIntake";
import { useTmsLocale } from "../../../../../../../localization/context/useTmsLocale";
import { MemberAvatar } from "../../../../../../../workspace/members/avatar/MemberAvatar";
import { useMemberName } from "../../../../../../../workspace/members/state/useMemberName";
import type { DashboardViewProps } from "../../../../../dashboard-view";
import { triageCopy } from "../copy/triage-copy";
import shared from "../triage.module.css";
import { DefectDetails } from "./DefectDetails";
import styles from "./intake.module.css";

type Props = {
  scope: DefectTriageScope;
  view: DefectTriageView;
  canManage: boolean;
  onChange: () => void;
  onOpenRow?: DashboardViewProps["onOpenRow"];
};

export function DefectIntake({ scope, view, canManage, onChange, onOpenRow }: Props) {
  const { locale, t } = useTmsLocale();
  const copy = triageCopy[locale];
  const detailId = useId();
  const queueRef = useRef<HTMLDivElement>(null);
  const detailRef = useRef<HTMLElement>(null);
  const opener = useRef<HTMLButtonElement | null>(null);
  const [selection, setSelection] = useState<string | null>(null);
  const intake = useDefectIntake(scope, view, onChange);
  const { list, saving, error, completed } = intake;
  const selected = list.rows.find(row => row.id === selection);

  useEffect(() => {
    if (!selection || selected) return;
    setSelection(null);
    if (document.activeElement === document.body) queueRef.current?.focus({ preventScroll: true });
  }, [selection, selected]);

  function open(row: DefectTriageRow) {
    onOpenRow?.({
      id: row.id, projectId: row.projectId, entity: "defect", key: row.key, title: row.title,
      project: "", detail: row.description, priority: row.priority, status: row.status, links: [],
    });
  }

  function dismiss() {
    setSelection(null);
    intake.clearDecision();
    requestAnimationFrame(() => opener.current?.focus());
  }

  return <section className={styles.layout} data-detail={Boolean(selected) || undefined} aria-label={copy.intake}>
    <div className={styles.listPane} ref={queueRef} tabIndex={-1} aria-busy={list.loading || saving}>
      {completed && <p className={styles.notice} role="status">{copy.completed[completed]}</p>}
      <ErrorToast message={error && !selected ? copy[error] : null} />
      <ErrorToast message={list.error ? copy[list.error] : null} retryLabel={t("dashboardWorkbench.retry")}
        onRetry={() => void intake.load(list.failedCursor)} />
      {list.loading && list.rows.length === 0 && <p className={styles.notice} role="status">{copy.loading}</p>}
      {!list.loading && !list.error && list.rows.length === 0 && <div className={styles.empty} role="status">
        <span className={styles.emptyIcon} aria-hidden="true">
          {view === "inbox" ? <Inbox size={16} /> : <Clock3 size={16} />}
        </span>
        <div>
          <strong>{view === "inbox" ? copy.inboxEmpty : copy.snoozedEmpty}</strong>
          <p>{view === "inbox" ? copy.inboxEmptyHint : copy.snoozedEmptyHint}</p>
        </div>
      </div>}
      {list.rows.length > 0 && <ul className={styles.rows} aria-label={copy[view]}>
        {list.rows.map(row => <IntakeRow key={row.id} row={row} workspaceId={scope.workspaceId}
          active={selected?.id === row.id} disabled={saving} detailId={detailId} onSelect={(button) => {
            opener.current = button;
            intake.clearDecision();
            setSelection(row.id);
            requestAnimationFrame(() => detailRef.current?.focus());
          }} />)}
      </ul>}
      {!list.error && list.nextCursor && <footer className={styles.footer}>
        <Button size="sm" variant="light" className={shared.button} isDisabled={list.loading || saving}
          onPress={() => void intake.load(list.nextCursor ?? undefined)}>
          {t("dashboardWorkbench.loadMore")}
        </Button>
      </footer>}
    </div>
    {selected && <DefectDetails id={detailId} panelRef={detailRef} row={selected} workspaceId={scope.workspaceId}
      view={view} saving={saving} error={error ? copy[error] : undefined} canManage={canManage && intake.canDecide}
      source={intake.source} onOpen={onOpenRow ? () => open(selected) : undefined} onDismiss={dismiss}
      onReset={intake.clearDecision} onDecide={async decision => {
        if (await intake.decide(selected, decision)) {
          setSelection(null);
          requestAnimationFrame(() => queueRef.current?.focus());
        }
      }} />}
  </section>;
}

function IntakeRow({ row, workspaceId, active, disabled, detailId, onSelect }: {
  row: DefectTriageRow; workspaceId: string; active: boolean; disabled: boolean; detailId: string;
  onSelect: (button: HTMLButtonElement) => void;
}) {
  const { locale, languageTag } = useTmsLocale();
  const copy = triageCopy[locale];
  const linked = Boolean(row.externalIssue);
  const author = useMemberName(workspaceId, linked ? null : row.createdByIdentityId, false);
  const source = linked ? "YouTrack" : author.name ?? (row.occurrence ? copy.sourceRun : row.sourceCaseId ? copy.sourceCase : "Falcon");
  const date = new Date(row.updatedAt);
  const dateLabel = new Intl.DateTimeFormat(languageTag, { dateStyle: "medium", timeStyle: "short" }).format(date);

  return <li>
    <button type="button" className={styles.row} aria-pressed={active} aria-controls={active ? detailId : undefined}
      disabled={disabled} onClick={event => onSelect(event.currentTarget)}>
      <strong title={row.title}>{row.title}</strong>
      <span className={styles.key}>{row.key}</span>
      <span className={styles.source}>
        {linked ? <Box size={17} aria-hidden="true" />
          : author.name ? <MemberAvatar workspaceId={workspaceId} identityId={row.createdByIdentityId} name={author.name}
            actor={author.actor} />
          : row.occurrence || row.sourceCaseId ? <FlaskConical size={16} aria-hidden="true" />
          : <Box size={16} aria-hidden="true" />}
        <span>{source}</span>
      </span>
      <time dateTime={row.updatedAt} title={dateLabel}>{formatAge(date, languageTag)}</time>
    </button>
  </li>;
}

function formatAge(date: Date, locale: string) {
  const minutes = Math.floor(Math.max(0, Date.now() - date.valueOf()) / 60_000);
  const formatter = new Intl.RelativeTimeFormat(locale, { numeric: "auto", style: "short" });
  if (minutes < 60) return formatter.format(-minutes, "minute");
  if (minutes < 1_440) return formatter.format(-Math.floor(minutes / 60), "hour");
  return formatter.format(-Math.floor(minutes / 1_440), "day");
}
