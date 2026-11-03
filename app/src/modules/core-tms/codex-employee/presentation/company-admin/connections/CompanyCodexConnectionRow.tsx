import { useId, useState } from "react";
import { ChevronDown, UserRound } from "lucide-react";
import type { CompanyCodexConnection } from "../../../domain/admin/company-codex-admin";
import { useDisclosureMotion } from "../../../../presentation/common/disclosure/useDisclosureMotion";
import { permissionLabel } from "./permission-labels";
import css from "../company-codex-admin.module.css";

export function CompanyCodexConnectionRow({ connection, ru, disabled, onRevoke }: {
  connection: CompanyCodexConnection; ru: boolean; disabled: boolean; onRevoke: () => void;
}) {
  const [open, setOpen] = useState(false), id = useId(), motion = useDisclosureMotion(open, true);
  const date = (value: string) => new Intl.DateTimeFormat(ru ? "ru-RU" : "en-US", { dateStyle: "medium" }).format(new Date(value));
  const status = { active: ru ? "Активно" : "Active", revoked: ru ? "Отозвано" : "Revoked", expired: ru ? "Истекло" : "Expired" }[connection.status];
  return <div className={css.connection}>
    <div className={css.connectionRow}>
      <button type="button" className={css.connectionToggle} aria-expanded={open} aria-controls={id} onClick={() => setOpen(value => !value)}>
        <UserRound size={19} strokeWidth={1.5} aria-hidden="true" />
        <span className={css.identity}><strong>{connection.person.name}</strong><span>{ru ? "Проектов" : "Projects"}: {connection.projects.length} · {ru ? "До" : "Expires"} {date(connection.expiresAt)}</span></span>
        <span className={css.connectionStatus} data-status={connection.status}>{status}</span><ChevronDown className={open ? css.rotated : undefined} size={15} aria-hidden="true" />
      </button>
      {connection.status === "active" && <button type="button" className={css.quiet} disabled={disabled} onClick={onRevoke}>{ru ? "Отозвать доступ" : "Revoke access"}</button>}
    </div>
    <div ref={motion.ref} id={id} aria-hidden={!open} className={css.disclosure} style={{ display: motion.present ? undefined : "none" }}>
      <div className={css.connectionDetails}>
        <h3>{ru ? "Проекты" : "Projects"}</h3><ul>{connection.projects.map(project => <li key={project.id}>{project.name ?? (ru ? "Проект недоступен" : "Project unavailable")}</li>)}</ul>
        <h3>{ru ? "Разрешения" : "Permissions"}</h3><ul>{connection.scopes.map(scope => <li key={scope}>{permissionLabel(scope, ru)}</li>)}</ul>
        <p>{ru ? "Подключено" : "Connected"} {date(connection.createdAt)}{connection.revokedAt && <> · {ru ? "Отозвано" : "Revoked"} {date(connection.revokedAt)}</>}</p>
      </div>
    </div>
  </div>;
}
