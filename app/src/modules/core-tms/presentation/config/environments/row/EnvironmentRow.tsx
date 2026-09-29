import { Archive, ArchiveRestore, Check, Copy, MoreHorizontal, Pencil } from "lucide-react";
import type { ReactNode } from "react";
import type { Environment } from "../../../../../../core/tms/contracts/legacy-contract";
import { useTmsLocale } from "../../../../localization/context/useTmsLocale";
import { EnvironmentExpansion } from "../motion/EnvironmentExpansion";
import css from "../environments.module.css";

export function EnvironmentRow({ environment, editor, disabled, onEdit, onToggle, copied, onCopy }: {
  environment: Environment; editor?: ReactNode; disabled: boolean; onEdit(): void; onToggle(): void; copied: boolean; onCopy(): void;
}) {
  const { t, locale } = useTmsLocale(); const archived = environment.status === "archived";
  return <li className={css.item} style={{ viewTransitionName: `env-${environment.id.replace(/[^a-zA-Z0-9_-]/g, "-")}` }}>
    <div className={css.row} data-editing={Boolean(editor)}>
      <div className={css.name}><strong title={environment.description || environment.name}>{environment.name}</strong>
        {(archived || environment.isDefault) && <span className={css.badge}>{t(archived ? "common.archived" : "common.default")}</span>}</div>
      <code className={css.key}>{environment.key}</code>
      <div className={css.url}><span title={environment.baseUrl}>{environment.baseUrl || "—"}</span>
        {environment.baseUrl && <button type="button" className={css.icon} onClick={onCopy} aria-label={`${t("config.copyBaseUrl")}: ${environment.name}`}>
          {copied ? <Check size={14} /> : <Copy size={14} />}</button>}</div>
      <div className={css.actions}><button className={css.icon} type="button" disabled={disabled} aria-expanded={Boolean(editor)} onClick={onEdit} aria-label={`${t("common.edit")}: ${environment.name}`}><Pencil size={15} /></button>
        <details className={css.menu}><summary aria-label={`${locale === "ru" ? "Действия" : "Actions"}: ${environment.name}`}><MoreHorizontal size={17} /></summary>
          <div><button type="button" disabled={disabled} onClick={event => { event.currentTarget.closest("details")?.removeAttribute("open"); onToggle(); }}>
            {archived ? <ArchiveRestore size={15} /> : <Archive size={15} />}{t(archived ? "common.restore" : "common.archive")}</button></div>
        </details></div>
    </div>
    <EnvironmentExpansion>{editor}</EnvironmentExpansion>
  </li>;
}
