import { Bell, Bug, CircleHelp, FilePlus2, Plus, Settings } from "lucide-react";
import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { useTmsLocale } from "../../localization/context/useTmsLocale";
import shellStyles from "../workspace/tms-shell.module.css";

export function NavigationUtilityMenu({
  disabled,
  settingsActive,
  onCreateCase,
  onCreateDefect,
  onOpenSettings,
}: {
  disabled: boolean;
  settingsActive: boolean;
  onCreateCase: () => void;
  onCreateDefect: () => void;
  onOpenSettings: () => void;
}) {
  const { t } = useTmsLocale();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    menuRef.current?.querySelector<HTMLButtonElement>("button")?.focus();
    const dismiss = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      triggerRef.current?.focus();
    };
    document.addEventListener("pointerdown", dismiss);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", dismiss);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);

  function run(action: () => void) {
    setOpen(false);
    action();
  }

  function moveMenuFocus(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    const items = Array.from(menuRef.current?.querySelectorAll<HTMLButtonElement>("button") ?? []);
    if (items.length === 0) return;
    event.preventDefault();
    const current = items.indexOf(document.activeElement as HTMLButtonElement);
    const direction = event.key === "ArrowDown" ? 1 : -1;
    items[(current + direction + items.length) % items.length]?.focus();
  }

  return (
    <div className={shellStyles.navigationUtilities}>
      <div className={shellStyles.navigationCreateSlot} ref={rootRef}>
        <button
          ref={triggerRef}
          type="button"
          className={`${shellStyles.navigationUtilityButton} ${shellStyles.navigationCreateButton}`}
          disabled={disabled}
          aria-haspopup="menu"
          aria-expanded={open}
          onClick={() => setOpen((current) => !current)}
        >
          <span className={shellStyles.navigationIcon} aria-hidden="true"><Plus size={21} /></span>
          <span className={shellStyles.navigationLabel}>{t("nav.create")}</span>
        </button>
        {open && (
          <div
            ref={menuRef}
            className={shellStyles.navigationCreateMenu}
            role="menu"
            aria-label={t("nav.create")}
            onKeyDown={moveMenuFocus}
          >
            <button type="button" role="menuitem" onClick={() => run(onCreateCase)}>
              <FilePlus2 size={18} aria-hidden="true" />
              <span><strong>{t("nav.createCase")}</strong><small>{t("nav.createCaseHint")}</small></span>
            </button>
            <button type="button" role="menuitem" onClick={() => run(onCreateDefect)}>
              <Bug size={18} aria-hidden="true" />
              <span><strong>{t("nav.createDefect")}</strong><small>{t("nav.createDefectHint")}</small></span>
            </button>
          </div>
        )}
      </div>

      <button
        type="button"
        className={`${shellStyles.navigationUtilityButton} ${settingsActive ? shellStyles.navigationUtilityButtonActive : ""}`}
        onClick={onOpenSettings}
        disabled={disabled}
        aria-current={settingsActive ? "page" : undefined}
      >
        <span className={shellStyles.navigationIcon} aria-hidden="true"><Settings size={20} /></span>
        <span className={shellStyles.navigationLabel}>{t("nav.config")}</span>
      </button>
      <button type="button" className={shellStyles.navigationUtilityButton} data-placeholder="true">
        <span className={shellStyles.navigationIcon} aria-hidden="true"><CircleHelp size={20} /></span>
        <span className={shellStyles.navigationLabel}>{t("nav.help")}</span>
      </button>
      <button type="button" className={shellStyles.navigationUtilityButton} data-placeholder="true">
        <span className={shellStyles.navigationIcon} aria-hidden="true"><Bell size={20} /></span>
        <span className={shellStyles.navigationLabel}>{t("nav.notifications")}</span>
      </button>
    </div>
  );
}
