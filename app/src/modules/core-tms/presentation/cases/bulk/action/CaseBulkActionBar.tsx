import { PiFolderSimpleMinusDuotone, PiArrowBendDownRightDuotone } from "react-icons/pi";
import { AlertTriangle, Archive, CheckCircle2, FilePenLine, Play, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { TestCaseRevision } from "../../../../../../core/tms/contracts/legacy-contract";
import type { TmsLocale } from "../../../../localization/model/locale";
import type { BulkCaseMutationResult } from "../../../../../../core/tms/contracts/test-cases/bulk-case-contract";
import { BulkActionMenu, type BulkMenuOption } from "./BulkActionMenu";
import styles from "../styles/caseBulk.module.css";

type Lifecycle = TestCaseRevision["lifecycle"];
type Priority = TestCaseRevision["priority"];

export function CaseBulkActionBar(props: {
  onMove?: () => void; onRemove?: () => void; onArchive?: () => void; externalBusy?: boolean;
  locale: TmsLocale;
  selectedCount: number;
  mutationLimit: number;
  mutationEnabled: boolean;
  onClear: () => void;
  onCreateRun: () => void;
  onChangeLifecycle: (value: Lifecycle) => Promise<BulkCaseMutationResult>;
  onChangePriority: (value: Priority) => Promise<BulkCaseMutationResult>;
}) {
  const ru = props.locale === "ru";
  const root = useRef<HTMLDivElement>(null);
  const [menu, setMenu] = useState<"lifecycle" | "priority" | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const overLimit = props.selectedCount > props.mutationLimit;
  const busy = pending || Boolean(props.externalBusy);
  const mutationDisabled = busy || overLimit || !props.mutationEnabled;
  const mutationHint = overLimit
    ? (ru ? `За один раз можно изменить до ${props.mutationLimit} кейсов` : `You can update up to ${props.mutationLimit} cases at once`)
    : !props.mutationEnabled
      ? (ru ? "Массовое изменение доступно при подключении к TMS" : "Bulk updates require a TMS connection")
      : undefined;

  useEffect(() => {
    function close(event: PointerEvent) {
      if (event.target instanceof Node && !root.current?.contains(event.target)) setMenu(null);
    }
    window.addEventListener("pointerdown", close);
    return () => window.removeEventListener("pointerdown", close);
  }, []);

  const lifecycleOptions: readonly BulkMenuOption<Lifecycle>[] = [
    { value: "draft", label: ru ? "Черновик" : "Draft", icon: <FilePenLine size={14} /> },
    { value: "ready", label: ru ? "Готов" : "Ready", icon: <CheckCircle2 size={14} /> },
    { value: "deprecated", label: ru ? "Устарел" : "Deprecated", icon: <Archive size={14} /> },
  ];
  const priorityOptions: readonly BulkMenuOption<Priority>[] = [
    { value: "critical", label: ru ? "Критический" : "Critical", icon: <AlertTriangle className={styles.critical} size={14} /> },
    { value: "high", label: ru ? "Высокий" : "High", icon: <AlertTriangle className={styles.high} size={14} /> },
    { value: "medium", label: ru ? "Средний" : "Medium", icon: <AlertTriangle className={styles.medium} size={14} /> },
    { value: "low", label: ru ? "Низкий" : "Low", icon: <AlertTriangle className={styles.low} size={14} /> },
  ];

  async function mutate(action: () => Promise<BulkCaseMutationResult>) {
    if (mutationDisabled) return;
    setPending(true);
    setError("");
    setMenu(null);
    const result = await action().catch(() => ({
      ok: false as const,
      message: ru ? "Не удалось изменить выбранные кейсы." : "The selected cases could not be updated.",
    }));
    if (!result.ok) setError(result.message);
    setPending(false);
  }

  return (
    <div ref={root} className={styles.bulkBar} role="region" aria-label={ru ? "Действия с выбранными тест-кейсами" : "Selected test case actions"} aria-busy={busy || undefined}>
      <strong className={styles.bulkCount} title={ru ? `Выбрано: ${props.selectedCount}` : `${props.selectedCount} selected`}>
        {ru ? `Выбрано: ${props.selectedCount}` : `${props.selectedCount} selected`}
      </strong>
      {props.onMove && <button type="button" className={styles.bulkAction} disabled={busy} onClick={props.onMove} aria-label={ru ? "Переместить выбранные кейсы" : "Move selected cases"}>
        <PiArrowBendDownRightDuotone size={17} aria-hidden="true" /><span>{ru ? "Переместить" : "Move"}</span>
      </button>}
      <button type="button" className={styles.bulkPrimary} disabled={busy} onClick={props.onCreateRun}><Play size={15} /><span>{ru ? "Создать тест-ран" : "Create test run"}</span></button>
      <BulkActionMenu id="bulk-lifecycle" label={ru ? "Изменить статус" : "Change status"} compactLabel={ru ? "Статус" : "Status"} icon={<FilePenLine size={15} />}
        open={menu === "lifecycle"} disabled={mutationDisabled} hint={mutationHint} options={lifecycleOptions}
        onToggle={() => setMenu((value) => value === "lifecycle" ? null : "lifecycle")} onClose={() => setMenu(null)}
        onSelect={(value) => void mutate(() => props.onChangeLifecycle(value))} />
      <BulkActionMenu id="bulk-priority" label={ru ? "Изменить приоритет" : "Change priority"} compactLabel={ru ? "Приоритет" : "Priority"} icon={<AlertTriangle size={15} />}
        open={menu === "priority"} disabled={mutationDisabled} hint={mutationHint} options={priorityOptions}
        onToggle={() => setMenu((value) => value === "priority" ? null : "priority")} onClose={() => setMenu(null)}
        onSelect={(value) => void mutate(() => props.onChangePriority(value))} />
      {props.onRemove && <button type="button" className={styles.bulkAction} disabled={busy} onClick={props.onRemove}><PiFolderSimpleMinusDuotone size={17} /><span>{ru ? "Убрать из папки" : "Unfile"}</span></button>}
      {props.onArchive && <button type="button" className={styles.bulkAction} disabled={busy} onClick={props.onArchive}><Archive size={15} /><span>{ru ? "В архив" : "Archive"}</span></button>}
      <button type="button" className={styles.bulkClose} disabled={busy} onClick={props.onClear} aria-label={ru ? "Снять выделение" : "Clear selection"}><X size={17} aria-hidden="true" /></button>
      {error && <span className={styles.bulkError} role="alert">{error}</span>}
    </div>
  );
}
