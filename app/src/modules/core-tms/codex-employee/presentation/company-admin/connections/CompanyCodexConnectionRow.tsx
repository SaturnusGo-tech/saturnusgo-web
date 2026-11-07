import { useId, useState, type ReactNode } from "react";
import { ChevronDown, UserRound } from "lucide-react";
import type { CompanyCodexConnection } from "../../../domain/admin/company-codex-admin";
import { useDisclosureMotion } from "../../../../presentation/common/disclosure/useDisclosureMotion";
import { permissionLabel } from "./permission-labels";
import css from "../company-codex-admin.module.css";

export function CompanyCodexConnectionRow({ connection, ru, disabled, onRevoke, confirmation }: {
  connection: CompanyCodexConnection;
  ru: boolean;
  disabled: boolean;
  onRevoke: () => void;
  confirmation?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const motion = useDisclosureMotion(open, true);
  const formatter = new Intl.DateTimeFormat(ru ? "ru-RU" : "en-US", { dateStyle: "medium" });
  const date = (value: string) => formatter.format(new Date(value));
  const status = {
    active: ru ? "Активно" : "Active",
    revoked: ru ? "Отозвано" : "Revoked",
    expired: ru ? "Истекло" : "Expired",
  }[connection.status];
  const expiry = connection.status === "expired" ? (ru ? "Истекло" : "Expired") : (ru ? "До" : "Expires");
  return <li className={css.connection}>
    <div className={css.connectionRow}>
      <button type="button" className={css.connectionToggle} aria-expanded={open} aria-controls={id} onClick={() => setOpen(value => !value)}>
        <span className={css.avatar}><UserRound size={17} aria-hidden="true" /></span>
        <span className={css.identity}>
          <strong>{connection.person.name}</strong>
          <span className={css.connectionMeta}>
            <span>{ru ? "Проектов" : "Projects"}: {connection.projects.length}</span>
            <span>{expiry} <time dateTime={connection.expiresAt}>{date(connection.expiresAt)}</time></span>
          </span>
        </span>
        <span className={css.status} data-status={connection.status}>{status}</span>
        <ChevronDown className={css.chevron} size={14} aria-hidden="true" />
      </button>
      {connection.status === "active" && <button type="button" className={css.secondary} disabled={disabled} aria-expanded={Boolean(confirmation)} aria-controls={`${id}-revoke`} onClick={onRevoke}>
        {ru ? "Отозвать доступ" : "Revoke access"}
      </button>}
    </div>
    <div id={`${id}-revoke`} hidden={!confirmation}>{confirmation}</div>
    <div ref={motion.ref} id={id} aria-hidden={!open} className={css.disclosure} style={{ display: motion.present ? undefined : "none" }}>
      <div className={css.connectionDetails}>
        <div>
          <h3>{ru ? "Проекты" : "Projects"}</h3>
          <ul>{connection.projects.map(project => <li key={project.id}>{project.name ?? (ru ? "Проект недоступен" : "Project unavailable")}</li>)}</ul>
        </div>
        <div>
          <h3>{ru ? "Разрешения" : "Permissions"}</h3>
          <ul>{connection.scopes.map(scope => <li key={scope}>{permissionLabel(scope, ru)}</li>)}</ul>
        </div>
        <p>{ru ? "Подключено" : "Connected"} <time dateTime={connection.createdAt}>{date(connection.createdAt)}</time>
          {connection.revokedAt && <> · {ru ? "Отозвано" : "Revoked"} <time dateTime={connection.revokedAt}>{date(connection.revokedAt)}</time></>}
        </p>
      </div>
    </div>
  </li>;
}
