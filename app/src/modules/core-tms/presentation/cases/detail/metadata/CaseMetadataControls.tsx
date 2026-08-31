import {
  Ban, CheckCircle2, ChevronUp, ChevronsDown, ChevronsUp, CircleDashed,
  Clock3, FileText, ListChecks, Minus,
} from "lucide-react";
import type { TestCaseRevision } from "../../../../../../core/tms/contracts/legacy-contract";
import { localizedLabel } from "../../../../localization/format/labels";
import type { TmsLocale } from "../../../../localization/model/locale";
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
  onChange?: (revision: TestCaseRevision) => void;
};

export function CaseMetadataControls(props: Props) {
  const ru = props.locale === "ru";
  if (!props.editing || !props.onChange) {
    return <>
      <LifecycleBadge locale={props.locale} lifecycle={props.revision.lifecycle} archived={props.archived} />
      <PriorityBadge locale={props.locale} priority={props.revision.priority} />
      <TypeBadge locale={props.locale} type={props.revision.type} />
      <EstimateBadge locale={props.locale} minutes={props.revision.estimatedMinutes} />
    </>;
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
    { value: "manual", label: localizedLabel(props.locale, "manual"), icon: <FileText size={11} />, tone: styles.typeManual },
    { value: "checklist", label: localizedLabel(props.locale, "checklist"), icon: <ListChecks size={11} />, tone: styles.typeChecklist },
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

  return <div className={styles.controls}>
    <MetadataSelect label={ru ? "Статус" : "Status"} value={props.revision.lifecycle} options={lifecycle} onChange={(value) => update("lifecycle", value)} autoFocus={props.autoFocus} />
    <MetadataSelect label={ru ? "Приоритет" : "Priority"} value={props.revision.priority} options={priority} onChange={(value) => update("priority", value)} />
    <MetadataSelect label={ru ? "Тип" : "Type"} value={props.revision.type} options={type} onChange={(value) => update("type", value)} />
    <MetadataSelect label={ru ? "Оценка" : "Estimate"} value={rawEstimate} options={estimate} onChange={(value) => update("estimatedMinutes", value === "none" ? null : Number(value))} />
  </div>;
}
