import type { MemberDraft } from "../../domain/administration";
import type { AdministrationCopy } from "../copy/administration-copy";
import { AccessField } from "../../../auth/managed/presentation/fields/AccessField";
import styles from "../layout/administration.module.css";

export function MemberFields({ draft, onChange, copy, disabled, showLogin = true }: {
  readonly draft: Pick<MemberDraft, "name" | "login" | "email" | "phone">;
  readonly onChange: (draft: Pick<MemberDraft, "name" | "login" | "email" | "phone">) => void;
  readonly copy: AdministrationCopy; readonly disabled: boolean; readonly showLogin?: boolean;
}) {
  return <div className={styles.fields}>
    <AccessField label={copy.personName} value={draft.name} required maxLength={200} disabled={disabled} autoComplete="off"
      onChange={(event) => onChange({ ...draft, name: event.target.value })} />
    {showLogin && <AccessField label={copy.login} value={draft.login} required minLength={3} maxLength={64} autoComplete="off"
      pattern="[a-z0-9][a-z0-9._-]{2,63}" disabled={disabled} onChange={(event) => onChange({ ...draft, login: event.target.value.toLowerCase() })} />}
    <AccessField label={copy.email} type="email" value={draft.email} required maxLength={254} autoComplete="off" disabled={disabled}
      onChange={(event) => onChange({ ...draft, email: event.target.value })} />
    <AccessField label={copy.phone} type="tel" value={draft.phone ?? ""} maxLength={16} placeholder="+7…" pattern="[+][1-9][0-9]{7,14}|"
      disabled={disabled} onChange={(event) => onChange({ ...draft, phone: event.target.value })} />
  </div>;
}
