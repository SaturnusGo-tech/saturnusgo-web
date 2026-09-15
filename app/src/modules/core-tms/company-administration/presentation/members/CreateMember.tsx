"use client";

import { UserRoundPlus, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { MemberDraft, MemberMutation } from "../../domain/administration";
import type { AdministrationPort } from "../../application/ports/administration-port";
import { useAdministrationCommand } from "../../application/state/useAdministrationCommand";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { RoleField } from "../permissions/RoleField";
import { CredentialHandoff } from "../handoff/CredentialHandoff";
import { administrationCopy } from "../copy/administration-copy";
import { administrationError } from "../copy/administration-errors";
import styles from "../editor/editor.module.css";

export function CreateMember({ client, owner, onBack, onCreated, onBusy }: {
  readonly client: AdministrationPort; readonly owner: boolean; readonly onBack: () => void;
  readonly onCreated: (id: string) => void; readonly onBusy: (busy: boolean) => void;
}) {
  const { locale } = useTmsLocale();
  const copy = administrationCopy(locale);
  const [draft, setDraft] = useState<MemberDraft>({ name: "", email: "", phone: "", role: "tester" });
  const [result, setResult] = useState<MemberMutation | null>(null);
  const command = useAdministrationCommand();
  useEffect(() => { onBusy(command.pending || !!result); }, [command.pending, result, onBusy]);
  useEffect(() => () => onBusy(false), [onBusy]);
  if (result?.temporaryPassword) return <div className={styles.handoff}><CredentialHandoff login={result.member.login}
    password={result.temporaryPassword} hostname={window.location.hostname} onDone={() => onCreated(result.member.identityId)} /></div>;
  return <form className={styles.editor} onSubmit={(event) => {
    event.preventDefault();
    const value = { ...draft, name: draft.name.trim(), email: draft.email.trim().toLowerCase() };
    void command.execute(JSON.stringify(value), (key, signal) => client.createMember(value, key, signal)).then((saved) => {
      if (!saved) return;
      if (saved.temporaryPassword) setResult(saved); else onCreated(saved.member.identityId);
    });
  }}>
    <header className={styles.header}><h2>{locale === "ru" ? "Новый сотрудник" : "New person"}</h2>
      <div><button type="button" aria-label={copy.cancel} disabled={command.pending} onClick={onBack}><X size={20} /></button>
        <button className={styles.primary} type="submit" disabled={command.pending}>{command.pending ? (locale === "ru" ? "Создаём…" : "Creating…") : copy.create}</button></div>
    </header>
    <div className={`${styles.body} ${styles.createBody}`}><UserRoundPlus className={styles.createAvatar} size={64} strokeWidth={1.3} />
      <input className={styles.name} aria-label={locale === "ru" ? "Имя и фамилия" : "Full name"} placeholder={locale === "ru" ? "Имя и фамилия" : "Full name"}
        autoComplete="off" maxLength={200} required value={draft.name} disabled={command.pending}
        onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
      <label className={styles.field}><span>{locale === "ru" ? "Рабочая почта" : "Work email"}</span>
        <input type="email" autoComplete="off" required maxLength={254} value={draft.email} disabled={command.pending}
          onChange={(event) => setDraft({ ...draft, email: event.target.value })} /></label>
      <div className={styles.field}><span>{copy.role}</span><RoleField role={draft.role} disabled={command.pending}
        allowAdmin={owner} onChange={(role) => setDraft({ ...draft, role })} /></div>
      {command.error && <p className={styles.error} role="alert">{administrationError(command.error, locale)}</p>}
    </div>
  </form>;
}
