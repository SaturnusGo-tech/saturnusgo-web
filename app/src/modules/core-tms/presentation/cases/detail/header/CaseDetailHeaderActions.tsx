import { LoadingOrb } from "../../../../../../shared/components/loading/LoadingOrb";
import { Button, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger } from "@heroui/react";
import {
  Archive, Bug, Check, Copy, Files, Link2, Maximize2, Minimize2,
  MoreHorizontal, Play, RotateCcw, X,
} from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { TestCaseSummary } from "../../../../../../core/tms/contracts/legacy-contract";
import type { TmsLocale } from "../../../../localization/model/locale";
import { buildCaseDeepLink } from "../../../../test-cases/navigation/case-deep-link";
import { ProductDocModal } from "../../../../product-docs/presentation/overlay/ProductDocModal";
import overlays from "./case-header-overlays.module.css";
import layout from "../../cases.module.css";
import inspector from "../../inspector/caseInspector.module.css";

type Props = {
  locale: TmsLocale;
  testCase?: TestCaseSummary;
  creating: boolean;
  editorOpen: boolean;
  readOnly?: boolean;
  children?: ReactNode;
  fullscreen: boolean;
  onRunCase: () => void;
  onToggleFullscreen: () => void;
  onClone: () => void;
  onCreateDefect?: () => void;
  onArchive: () => void | boolean | Promise<void | boolean>;
  onClose?: () => void;
};

export function CaseDetailHeaderActions(props: Props) {
  const [copied, setCopied] = useState<"key" | "link" | null>(null);
  const [confirmation, setConfirmation] = useState<"quarantine" | "restore" | null>(null);
  const [archivePending, setArchivePending] = useState(false);
  const [archiveFailed, setArchiveFailed] = useState(false);
  const pendingRef = useRef(false);
  const menuButton = useRef<HTMLButtonElement>(null!);
  const returnToMenu = useRef(false);
  const ru = props.locale === "ru";
  const item = props.testCase;
  const archived = Boolean(item?.archivedAt);
  const more = ru ? "Другие действия" : "More actions";
  const restoreTitle = ru ? "Сначала восстановите тест-кейс" : "Restore the test case first";
  const archiveAction = archived ? "restore" : "quarantine";
  const archiveLabel = archived ? (ru ? "Восстановить" : "Restore") : (ru ? "Карантин" : "Quarantine");
  useEffect(() => {
    setCopied(null);
    setConfirmation(null);
    setArchiveFailed(false);
    setArchivePending(false);
    pendingRef.current = false;
  }, [item?.id, props.editorOpen]);
  useEffect(() => {
    if (confirmation || !returnToMenu.current) return;
    returnToMenu.current = false;
    const frame = requestAnimationFrame(() => menuButton.current?.focus({ preventScroll: true }));
    return () => cancelAnimationFrame(frame);
  }, [confirmation]);

  async function copy(value: string, kind: "key" | "link") {
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(value);
    } catch {
      const field = document.createElement("textarea");
      field.value = value;
      field.setAttribute("readonly", "");
      field.style.cssText = "position:fixed;opacity:0";
      document.body.appendChild(field);
      field.select();
      document.execCommand("copy");
      field.remove();
    }
    setCopied(kind);
    window.setTimeout(() => setCopied((current) => current === kind ? null : current), 1800);
  }

  const actions: { key: string; label: string; icon: typeof Copy; disabled?: boolean; danger?: boolean; run: () => void }[] = [
    ...(item ? [
      { key: "key", label: ru ? "Копировать ID" : "Copy ID", icon: copied === "key" ? Check : Copy,
        run: () => void copy(item.key, "key") },
      { key: "link", label: ru ? "Копировать ссылку" : "Copy link", icon: copied === "link" ? Check : Link2,
        run: () => void copy(buildCaseDeepLink(window.location.href, { caseId: item.id, projectId: item.projectId }), "link") },
    ] : []),
    ...(!props.readOnly ? [{ key: "clone", label: ru ? "Создать копию" : "Create a copy", icon: Files, disabled: archived, run: props.onClone }] : []),
    ...(item && props.onCreateDefect ? [{ key: "defect", label: ru ? "Завести баг-репорт" : "Create bug report", icon: Bug,
      disabled: archived, run: props.onCreateDefect }] : []),
    ...(item && !props.readOnly ? [{ key: archiveAction, label: archiveLabel, icon: archived ? RotateCcw : Archive,
      danger: !archived, run: () => setConfirmation(archiveAction) }] : []),
  ];
  const restoring = confirmation === "restore";
  const confirmTitle = restoring
    ? (ru ? "Восстановить тест-кейс?" : "Restore this test case?")
    : (ru ? "Отправить тест-кейс в карантин?" : "Move this test case to quarantine?");
  const confirmDescription = restoring
    ? (ru ? "Тест-кейс снова появится среди активных." : "The test case will return to the active list.")
    : (ru ? "Кейс исчезнет из активного списка. Вы сможете восстановить его из карантина." : "The case will leave the active list. You can restore it from quarantine.");
  async function confirmArchive(dismiss: () => void) {
    if (pendingRef.current || confirmation !== archiveAction) return;
    pendingRef.current = true;
    setArchivePending(true);
    setArchiveFailed(false);
    let succeeded = false;
    try {
      succeeded = await props.onArchive() !== false;
    } catch {
      succeeded = false;
    }
    if (succeeded) dismiss();
    else {
      setArchiveFailed(true);
      setArchivePending(false);
      pendingRef.current = false;
    }
  }
  function closeConfirmation() {
    returnToMenu.current = true;
    setConfirmation(null);
    setArchivePending(false);
    setArchiveFailed(false);
    pendingRef.current = false;
  }

  return <div className={inspector.utilityRow}>
    {props.creating && <div className={inspector.caseIdentity}>
      <span className={inspector.caseKey}>{ru ? "Новый тест-кейс" : "New test case"}</span>
    </div>}
    <div className={inspector.headerActions}>
      {!props.creating && (props.children || !props.readOnly) && <div className={inspector.headerPrimarySlot}>
        <div key={props.editorOpen ? "edit" : "run"} className={inspector.headerPrimaryContent}>
          {props.children ?? (!props.editorOpen && !props.readOnly &&
            <button type="button" disabled={archived} title={archived ? restoreTitle : undefined}
              className={`${inspector.headerTextButton} ${inspector.headerRunButton}`} onClick={() => { if (!archived) props.onRunCase(); }}>
              <Play size={14} aria-hidden="true" />{ru ? "Запустить" : "Run"}
            </button>)}
        </div>
      </div>}
      {!props.creating && actions.length > 0 && <Dropdown triggerRef={menuButton} placement="bottom-end" offset={5} disableAnimation
        classNames={{ base: overlays.positioner, content: overlays.menu }} shouldBlockScroll={false}>
        <DropdownTrigger>
          <Button type="button" isIconOnly variant="light" disableRipple isDisabled={props.editorOpen}
            className={inspector.iconButton} aria-label={more}><MoreHorizontal size={15} aria-hidden="true" /></Button>
        </DropdownTrigger>
        <DropdownMenu aria-label={more} classNames={{ list: overlays.menuList }}
          disabledKeys={actions.filter((action) => action.disabled).map((action) => action.key)}
          onAction={(key) => {
            if (props.editorOpen) return;
            const action = actions.find((action) => action.key === key);
            if (action && !action.disabled) action.run();
          }}>
          {actions.map(({ key, label, icon: Icon, danger }) => <DropdownItem key={key} textValue={label}
            className={danger ? `${overlays.menuItem} ${overlays.danger}` : overlays.menuItem}
            startContent={<Icon size={14} aria-hidden="true" />}>{label}</DropdownItem>)}
        </DropdownMenu>
      </Dropdown>}
      <button type="button" className={inspector.iconButton} onClick={props.onToggleFullscreen}
        aria-label={props.fullscreen ? (ru ? "Выйти из полного экрана" : "Exit full screen") : (ru ? "На весь экран" : "Open full screen")}
        aria-pressed={props.fullscreen}>{props.fullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}</button>
      {props.onClose && <button type="button" className={inspector.iconButton}
        onClick={props.onClose} aria-label={ru ? "Закрыть" : "Close"}><X size={15} /></button>}
    </div>
    {confirmation && item && !props.readOnly && !props.editorOpen &&
      <ProductDocModal title={confirmTitle} subtitle={confirmDescription} closeLabel={ru ? "Закрыть" : "Close"}
        busy={archivePending} onClose={closeConfirmation}>
        {(dismiss) => <>
          {archiveFailed && <p className={overlays.confirmError} role="alert">{ru ? "Не удалось обновить тест-кейс. Повторите попытку." : "Could not update this test case. Try again."}</p>}
          <div className={overlays.confirmActions}>
            <Button type="button" size="sm" variant="light" disableRipple autoFocus isDisabled={archivePending}
              onPress={dismiss}>{ru ? "Отмена" : "Cancel"}</Button>
            <Button type="button" size="sm" disableRipple isLoading={archivePending} spinner={<LoadingOrb />} className={overlays.confirm}
              onPress={() => void confirmArchive(dismiss)}>{restoring ? (ru ? "Восстановить" : "Restore") : (ru ? "В карантин" : "Move to quarantine")}</Button>
          </div>
        </>}
      </ProductDocModal>}
    <span className={layout.visuallyHidden} role="status" aria-live="polite">{copied === "key"
      ? (ru ? "ID тест-кейса скопирован" : "Test case ID copied")
      : copied === "link" ? (ru ? "Ссылка на тест-кейс скопирована" : "Test case link copied") : ""}</span>
  </div>;
}
