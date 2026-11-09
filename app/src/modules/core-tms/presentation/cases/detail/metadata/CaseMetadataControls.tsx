import {
  AlertTriangle, Archive, Ban, Bot, CheckCircle2, CircleDashed, Clock3, Hand, ListChecks,
} from "lucide-react";
import { useEffect, useState } from "react";
import type { TestCaseRevision } from "../../../../../../core/tms/contracts/legacy-contract";
import {
  changeRevisionType,
  discardedProcedureCount,
} from "../../../../helpers/cases/caseRevision";
import { localizedLabel } from "../../../../localization/format/labels";
import type { TmsLocale } from "../../../../localization/model/locale";
import shared from "../../../../tms.module.css";
import { ProductDocModal } from "../../../../product-docs/presentation/overlay/ProductDocModal";
import { PriorityField } from "../../../common/properties/PriorityField";
import { PropertySelect, type PropertyOption } from "../../../common/properties/select/PropertySelect";
import styles from "./caseMetadata.module.css";
import rail from "../../inspector/propertyRail.module.css";

type Props = {
  locale: TmsLocale;
  revision: TestCaseRevision;
  archived?: boolean;
  editing: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
  onRequestEdit?: () => void;
  onChange?: (revision: TestCaseRevision) => void;
};

export function CaseMetadataControls(props: Props) {
  const [pendingType, setPendingType] = useState<TestCaseRevision["type"] | null>(null);
  const ru = props.locale === "ru";
  const [activeField, setActiveField] = useState<keyof TestCaseRevision | null>(null);
  useEffect(() => { if (!props.editing) setActiveField(null); }, [props.editing]);
  const disabled = props.archived || props.disabled;
  const lifecycle: PropertyOption<TestCaseRevision["lifecycle"] | "archived">[] = [
    { value: "draft", label: localizedLabel(props.locale, "draft"), icon: <CircleDashed size={15} aria-hidden="true" /> },
    { value: "ready", label: localizedLabel(props.locale, "ready"), icon: <CheckCircle2 size={15} aria-hidden="true" /> },
    { value: "deprecated", label: localizedLabel(props.locale, "deprecated"), icon: <Ban size={15} aria-hidden="true" /> },
  ];
  if (props.archived) lifecycle.push({ value: "archived", label: localizedLabel(props.locale, "archived"), icon: <Archive size={15} aria-hidden="true" /> });
  const type: PropertyOption<TestCaseRevision["type"]>[] = [
    { value: "manual", label: localizedLabel(props.locale, "manual"), icon: <Hand size={15} aria-hidden="true" /> },
    { value: "checklist", label: localizedLabel(props.locale, "checklist"), icon: <ListChecks size={15} aria-hidden="true" /> },
    { value: "automated", label: localizedLabel(props.locale, "automated"), icon: <Bot size={15} aria-hidden="true" /> },
  ];
  const rawEstimate = props.revision.estimatedMinutes === null
    ? "none" : String(props.revision.estimatedMinutes);
  const presets = [5, 10, 15, 30, 60, 120];
  const estimate: PropertyOption<string>[] = [
    { value: "none", label: ru ? "Без оценки" : "No estimate", icon: <Clock3 size={15} aria-hidden="true" /> },
    ...(!presets.includes(props.revision.estimatedMinutes ?? -1) && rawEstimate !== "none"
      ? [{ value: rawEstimate, label: `${rawEstimate} ${ru ? "мин" : "min"}`, icon: <Clock3 key="custom" size={15} aria-hidden="true" /> }]
      : []),
    ...presets.map((minutes) => ({
      value: String(minutes), label: `${minutes} ${ru ? "мин" : "min"}`,
      icon: <Clock3 key={minutes} size={15} aria-hidden="true" />,
    })),
  ];
  const update = <Key extends keyof TestCaseRevision>(key: Key, value: TestCaseRevision[Key]) => {
    props.onChange?.({ ...props.revision, [key]: value });
  };
  const controls = (field: keyof TestCaseRevision) => ({
    locale: props.locale,
    disabled,
    autoOpen: activeField === field,
    onRequestEdit: !disabled && props.onRequestEdit ? () => {
      setActiveField(field);
      props.onRequestEdit?.();
    } : undefined,
  });
  const active = (field: keyof TestCaseRevision) => props.editing && Boolean(props.onChange) && (activeField === null || activeField === field);
  const requestTypeChange = (type: TestCaseRevision["type"]) => {
    if (discardedProcedureCount(props.revision, type) > 0) setPendingType(type);
    else props.onChange?.(changeRevisionType(props.revision, type));
  };
  const discardCount = pendingType
    ? discardedProcedureCount(props.revision, pendingType) : 0;

  const labels = { lifecycle: ru ? "Статус" : "Status", priority: ru ? "Приоритет" : "Priority",
    type: ru ? "Тип" : "Type", estimatedMinutes: ru ? "Оценка" : "Estimate" };
  return <>
    <div className={rail.rows}>
      <PropertySelect {...controls("lifecycle")} label={labels.lifecycle}
        searchLabel={ru ? "Изменить статус…" : "Change status to…"} options={lifecycle}
        value={props.archived ? "archived" : props.revision.lifecycle}
        autoFocus={props.autoFocus && props.editing && !activeField}
        onChange={active("lifecycle") && !props.archived ? (value) => { if (value !== "archived") update("lifecycle", value); } : undefined} />
      <PriorityField {...controls("priority")}
        value={props.revision.priorityAssigned === false ? null : props.revision.priority}
        onChange={active("priority") ? (priority) => props.onChange?.({
          ...props.revision, priority: priority ?? "medium", priorityAssigned: priority !== null,
        }) : undefined} />
      <PropertySelect {...controls("type")} label={labels.type}
        searchLabel={ru ? "Изменить тип…" : "Change type to…"} options={type} value={props.revision.type}
        onChange={active("type") ? requestTypeChange : undefined} />
      <PropertySelect {...controls("estimatedMinutes")} label={labels.estimatedMinutes}
        searchLabel={ru ? "Изменить оценку…" : "Change estimate to…"} options={estimate} value={rawEstimate}
        onChange={active("estimatedMinutes") ? (value) => update("estimatedMinutes", value === "none" ? null : Number(value)) : undefined} />
    </div>
    {pendingType && <ProductDocModal
      title={ru ? "Сменить тип тест-кейса?" : "Change test case type?"}
      subtitle={ru ? "Процедура другого типа несовместима с новым типом." : "The existing procedure is incompatible with the new type."}
      onClose={() => setPendingType(null)}
      closeLabel={ru ? "Закрыть" : "Close"}
      className={styles.typeChangeDialog}
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
    </ProductDocModal>}
  </>;
}
