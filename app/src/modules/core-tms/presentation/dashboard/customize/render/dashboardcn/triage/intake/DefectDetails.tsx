import { ErrorToast } from "../../../../../../common/error/ErrorToast";
import { Button } from "@heroui/react";
import { ArrowLeft, ArrowUpRight, X } from "lucide-react";
import type { Ref } from "react";
import type { DefectTriageDecision, DefectTriageRow, DefectTriageSource, DefectTriageView } from "../../../../../../../defects/triage/defect-triage-source";
import { useTmsLocale } from "../../../../../../../localization/context/useTmsLocale";
import { localizedLabel } from "../../../../../../../localization/format/labels";
import { ResponsibleName } from "../../../../../../../workspace/members/presentation/ResponsibleName";
import { PriorityIcon, priorityLabel } from "../../../../../../common/properties/PriorityIcon";
import { DefectStatusIcon } from "../../../../../../common/properties/defect/DefectStatusIcon";
import { triageCopy } from "../copy/triage-copy";
import { DefectDecision } from "../decision/DefectDecision";
import shared from "../triage.module.css";
import styles from "./intake.module.css";

type Props = {
  id: string;
  panelRef: Ref<HTMLElement>;
  row: DefectTriageRow;
  workspaceId: string;
  view: DefectTriageView;
  canManage: boolean;
  saving: boolean;
  error?: string;
  source: DefectTriageSource;
  onOpen?: () => void;
  onDismiss: () => void;
  onReset: () => void;
  onDecide: (decision: DefectTriageDecision) => void;
};

export function DefectDetails({ id, panelRef, row, workspaceId, view, canManage, saving, error, source, onOpen,
  onDismiss, onReset, onDecide }: Props) {
  const { locale, languageTag, t } = useTmsLocale();
  const copy = triageCopy[locale];
  const date = new Intl.DateTimeFormat(languageTag, { dateStyle: "medium", timeStyle: "short" });
  const sections = [
    { label: t("reports.descriptionHeading"), value: row.description },
    { label: t("reports.actualResult"), value: row.actualResult },
    { label: t("reports.expectedResult"), value: row.expectedResult },
  ].filter(section => Boolean(section.value));
  return <article id={id} ref={panelRef} className={styles.details} tabIndex={-1} aria-label={row.title}>
    <header className={styles.detailToolbar}>
      <Button size="sm" variant="light" disableRipple className={`${shared.button} ${styles.back}`}
        startContent={<ArrowLeft size={14} aria-hidden="true" />} onPress={onDismiss} isDisabled={saving}>{copy.backToInbox}</Button>
      <span className={styles.key}>{row.key}</span>
      {onOpen && <Button size="sm" variant="light" disableRipple className={shared.button} onPress={onOpen} isDisabled={saving}
        endContent={<ArrowUpRight size={13} aria-hidden="true" />}>{copy.openDefect}</Button>}
      <Button size="sm" isIconOnly variant="light" disableRipple className={`${shared.iconButton} ${styles.close}`}
        onPress={onDismiss} isDisabled={saving} aria-label={copy.backToInbox}><X size={15} aria-hidden="true" /></Button>
    </header>
    <h3>{row.title}</h3>
    <dl className={styles.properties}>
      <div><dt>{t("reports.status")}</dt><dd><DefectStatusIcon status={row.status} />{localizedLabel(locale, row.status)}</dd></div>
      <div><dt>{t("reports.priority")}</dt><dd><PriorityIcon level={row.priority} empty="circle" />{priorityLabel(locale, row.priority)}</dd></div>
      <div><dt>{t("reports.severity")}</dt><dd>{localizedLabel(locale, row.severity)}</dd></div>
      {row.component && <div><dt>{t("reports.component")}</dt><dd>{row.component}</dd></div>}
      <div><dt>{t("reports.created")}</dt><dd><time dateTime={row.createdAt}>{date.format(new Date(row.createdAt))}</time></dd></div>
      {row.assigneeIdentityId && <div><dt>{t("reports.assignee")}</dt>
        <dd><ResponsibleName workspaceId={workspaceId} identityId={row.assigneeIdentityId} /></dd></div>}
      {row.triageSnoozedUntil && <div><dt>{copy.returns}</dt>
        <dd><time dateTime={row.triageSnoozedUntil}>{date.format(new Date(row.triageSnoozedUntil))}</time></dd></div>}
    </dl>
    {sections.map(({ label, value }) => <section className={styles.text} key={label}>
      <h4>{label}</h4><p>{value}</p>
    </section>)}
    {row.labels.length > 0 && <ul className={styles.labels} aria-label={t("reports.labels")}>
      {row.labels.map(label => <li key={label}>{label}</li>)}
    </ul>}
    <div className={styles.decision}>
      {saving && <p className={shared.context} role="status">{copy.saving}</p>}
      <ErrorToast message={error} />
      {canManage ? <DefectDecision key={`${row.id}:${row.rowVersion}`} row={row} view={view} saving={saving}
        source={source} onReset={onReset} onDecide={onDecide} /> : <p className={shared.context}>{copy.managePermission}</p>}
    </div>
  </article>;
}
