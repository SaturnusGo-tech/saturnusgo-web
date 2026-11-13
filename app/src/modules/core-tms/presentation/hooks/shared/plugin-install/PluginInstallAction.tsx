import { LoadingOrb } from "../../../../../../shared/components/loading/LoadingOrb";
import { Plus, Settings } from "@openai/apps-sdk-ui/components/Icon";
import { useEffect, useRef } from "react";
import css from "./plugin-install.module.css";

type Props = { installed: boolean; installing: boolean; disabled: boolean; ru: boolean;
  onInstall: () => void; onManage: () => void; canManage?: boolean };
/** Stable action geometry while internal integration registration becomes Manage. */
export function PluginInstallAction({ installed, installing, disabled, ru, onInstall, onManage, canManage = false }: Props) {
  const root = useRef<HTMLDivElement>(null), install = useRef<HTMLButtonElement>(null), manage = useRef<HTMLButtonElement>(null);
  const handoff = useRef(false);
  useEffect(() => {
    if (install.current) install.current.inert = installed;
    if (manage.current) manage.current.inert = !installed;
    if (installed && handoff.current) { manage.current?.focus({ preventScroll: true }); handoff.current = false; }
  }, [installed]);
  useEffect(() => {
    if (!installing || typeof document === "undefined") return;
    const leave = (event: Event) => { if (!root.current?.contains(event.target as Node)) handoff.current = false; };
    const blur = () => { handoff.current = false; };
    document.addEventListener("focusin", leave); document.addEventListener("pointerdown", leave, true); window.addEventListener("blur", blur);
    return () => { document.removeEventListener("focusin", leave); document.removeEventListener("pointerdown", leave, true); window.removeEventListener("blur", blur); };
  }, [installing]);
  const manageLabel = ru ? "Управлять" : "Manage";
  return <div className={css.root} ref={root}>
    {canManage && <div className={css.secondarySlot} data-hidden={installed}><button type="button" className={css.secondary} data-hidden={installed}
      aria-hidden={installed} tabIndex={installed ? -1 : 0} disabled={disabled || installed}
      onClick={() => { if (!disabled && !installed) onManage(); }}><Settings width={18} height={18} />{manageLabel}</button></div>}
    <div className={css.slot}>
      <button type="button" ref={install} className={css.action} data-hidden={installed} aria-hidden={installed}
        aria-busy={installing} tabIndex={installed ? -1 : 0} disabled={disabled || installing || installed}
        onFocus={() => { handoff.current = true; }} onClick={() => { if (!disabled && !installing && !installed) onInstall(); }}>
        {installing ? <LoadingOrb /> : <Plus width={17} height={17} aria-hidden="true" />}
        {installing ? (ru ? "Установка…" : "Installing…") : (ru ? "Установить плагин" : "Install plugin")}
      </button>
      <button type="button" ref={manage} className={css.action} data-hidden={!installed} aria-hidden={!installed}
        tabIndex={installed ? 0 : -1} disabled={disabled || !installed} onClick={() => { if (!disabled && installed) onManage(); }}>
        <Settings width={18} height={18} aria-hidden="true" />{manageLabel}
      </button>
    </div>
    <span className={css.srOnly} role="status" aria-live="polite">{installing ? (ru ? "Установка интеграции" : "Installing integration") : ""}</span>
  </div>;
}
