import {
  AlertTriangle, Ban, Bot, CheckCircle2, ChevronUp, ChevronsDown, ChevronsUp, CircleDashed,
  Clock3, Hand, ListChecks, Minus,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import type { TestCaseRevision } from "../../../../../../core/tms/contracts/legacy-contract";
import {
  changeRevisionType,
  discardedProcedureCount,
} from "../../../../helpers/cases/caseRevision";
import { localizedLabel } from "../../../../localization/format/labels";
import type { TmsLocale } from "../../../../localization/model/locale";
import shared from "../../../../tms.module.css";
import { Modal } from "../../../common/modal/Modal";
import {
  EstimateBadge,
  LifecycleBadge,
  PriorityBadge,
  TypeBadge,
} from "../../list/CaseBadges";
import styles from "./caseMetadata.module.css";
import { MetadataSelect, type MetadataOption } from "./MetadataSelect";

type Props = {
  locale: TmsLocale;
  revision: TestCaseRevision;
  archived?: boolean;
  editing: boolean;
  autoFocus?: boolean;
  showLabels?: boolean;
  onChange?: (revision: TestCaseRevision) => void;
};

export function CaseMetadataControls(props: Props) {
  const [pendingType, setPendingType] = useState<TestCaseRevision["type"] | null>(null);
  const ru = props.locale === "ru";
  if (!props.editing || !props.onChange) {
    const badges = [
      [ru ? "Статус" : "Status", <LifecycleBadge key="lifecycle" locale={props.locale} lifecycle={props.revision.lifecycle} archived={props.archived} />],
      [ru ? "Приоритет" : "Priority", <PriorityBadge key="priority" locale={props.locale} priority={props.revision.priority} />],
      [ru ? "Тип" : "Type", <TypeBadge key="type" locale={props.locale} type={props.revision.type} />],
      [ru ? "Оценка" : "Estimate", <EstimateBadge key="estimate" locale={props.locale} minutes={props.revision.estimatedMinutes} />],
    ] as const;
    return <div className={`${styles.controls} ${styles.readControls}`}>
      {badges.map(([label, badge]) => props.showLabels
        ? <div className={styles.labelledControl} key={label}><span className={styles.controlLabel}>{label}</span>{badge}</div>
        : badge)}
    </div>;
  }

  const lifecycle: Array<MetadataOption<TestCaseRevision["lifecycle"]>> = [
    { value: "draft", label: localizedLabel(props.locale, "draft"), icon: <CircleDashed size={11} />, tone: styles.lifecycleDraft },
    { value: "ready", label: localizedLabel(props.locale, "ready"), icon: <CheckCircle2 size={11} />, tone: styles.lifecycleReady },
    { value: "deprecated", label: localizedLabel(props.locale, "deprecated"), icon: <Ban size={11} />, tone: styles.lifecycleDeprecated },
  ];
  const priority: Array<MetadataOption<TestCaseRevision["priority"]>> = [
    { value: "low", label: localizedLabel(props.locale, "low"), icon: <ChevronsDown size={12} />, tone: styles.priorityLow },
    { value: "medium", label: localizedLabel(props.locale, "medium"), icon: <Minus size={12} />, tone: styles.priorityMedium },
    { value: "high", label: localizedLabel(props.locale, "high"), icon: <ChevronUp size={12} />, tone: styles.priorityHigh },
    { value: "critical", label: localizedLabel(props.locale, "critical"), icon: <ChevronsUp size={12} />, tone: styles.priorityCritical },
  ];
  const type: Array<MetadataOption<TestCaseRevision["type"]>> = [
    { value: "manual", label: localizedLabel(props.locale, "manual"), icon: <Hand size={11} />, tone: styles.typeManual },
    { value: "checklist", label: localizedLabel(props.locale, "checklist"), icon: <ListChecks size={11} />, tone: styles.typeChecklist },
    { value: "automated", label: localizedLabel(props.locale, "automated"), icon: <Bot size={11} />, tone: styles.typeAutomated },
  ];
  const rawEstimate = props.revision.estimatedMinutes === null
    ? "none" : String(props.revision.estimatedMinutes);
  const presets = [5, 10, 15, 30, 60, 120];
  const estimate: Array<MetadataOption<string>> = [
    { value: "none", label: ru ? "Без оценки" : "No estimate", icon: <Clock3 size={11} />, tone: styles.estimate },
    ...(!presets.includes(props.revision.estimatedMinutes ?? -1) && rawEstimate !== "none"
      ? [{ value: rawEstimate, label: `${rawEstimate} ${ru ? "мин" : "min"}`, icon: <Clock3 key="custom" size={11} />, tone: styles.estimate }]
      : []),
    ...presets.map((minutes) => ({
      value: String(minutes), label: `${minutes} ${ru ? "мин" : "min"}`,
      icon: <Clock3 key={minutes} size={11} />, tone: styles.estimate,
    })),
  ];
  const update = <Key extends keyof TestCaseRevision>(key: Key, value: TestCaseRevision[Key]) => {
    props.onChange?.({ ...props.revision, [key]: value });
  };
  const labelled = (label: string, control: ReactNode) => props.showLabels
    ? <div className={styles.labelledControl}><span className={styles.controlLabel}>{label}</span>{control}</div> : control;
  const requestTypeChange = (type: TestCaseRevision["type"]) => {
    if (discardedProcedureCount(props.revision, type) > 0) setPendingType(type);
    else props.onChange?.(changeRevisionType(props.revision, type));
  };
  const discardCount = pendingType
    ? discardedProcedureCount(props.revision, pendingType) : 0;

  return <>
    <div className={styles.controls}>
      {labelled(ru ? "Статус" : "Status", <MetadataSelect label={ru ? "Статус" : "Status"} value={props.revision.lifecycle} options={lifecycle} onChange={(value) => update("lifecycle", value)} autoFocus={props.autoFocus} />)}
      {labelled(ru ? "Приоритет" : "Priority", <MetadataSelect label={ru ? "Приоритет" : "Priority"} value={props.revision.priority} options={priority} onChange={(value) => update("priority", value)} />)}
      {labelled(ru ? "Тип" : "Type", <MetadataSelect label={ru ? "Тип" : "Type"} value={props.revision.type} options={type} onChange={requestTypeChange} />)}
      {labelled(ru ? "Оценка" : "Estimate", <MetadataSelect label={ru ? "Оценка" : "Estimate"} value={rawEstimate} options={estimate} onChange={(value) => update("estimatedMinutes", value === "none" ? null : Number(value))} />)}
    </div>
    {pendingType && <Modal
      title={ru ? "Сменить тип тест-кейса?" : "Change test case type?"}
      subtitle={ru ? "Процедура другого типа несовместима с новым типом." : "The existing procedure is incompatible with the new type."}
      onClose={() => setPendingType(null)}
      panelClassName={styles.typeChangeDialog}
    >
      <div className={styles.typeChangeWarning}><AlertTriangle size={20} aria-hidden="true" /><p>{ru
        ? `Будет удалено строк: ${discardCount}. Отмена сохранит текущий черновик.`
        : `${discardCount} procedure row${discardCount === 1 ? "" : "s"} will be removed. Cancel keeps the current draft.`}</p></div>
      <div className={styles.typeChangeActions}>
        <button autoFocus type="button" className={shared.textButton} onClick={() => setPendingType(null)}>{ru ? "Отмена" : "Cancel"}</button>
        <button type="button" className={shared.dangerButton} onClick={() => {
          props.onChange?.(changeRevisionType(props.revision, pendingType));
          setPendingType(null);
        }}>{ru ? "Сменить и удалить" : "Change and remove"}</button>
      </div>
    </Modal>}
  </>;
}
