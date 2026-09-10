"use client";

import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import type { MemberDraft, MemberMutation } from "../../domain/administration";
import type { AdministrationPort } from "../../application/ports/administration-port";
import { useAdministrationCommand } from "../../application/state/useAdministrationCommand";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { MemberFields } from "../fields/MemberFields";
import { RoleField } from "../permissions/RoleField";
import { CredentialHandoff } from "../handoff/CredentialHandoff";
import { administrationCopy } from "../copy/administration-copy";
import { administrationError } from "../copy/administration-errors";
import styles from "../layout/administration.module.css";

export function CreateMember({ client, owner, onBack, onCreated }: {
  readonly client: AdministrationPort; readonly owner: boolean; readonly onBack: () => void; readonly onCreated: (id: string) => void;
}) {
  const { locale } = useTmsLocale();
  const copy = administrationCopy(locale);
  const [draft, setDraft] = useState<MemberDraft>({ name: "", login: "", email: "", phone: "", role: "tester" });
  const [result, setResult] = useState<MemberMutation | null>(null);
  const command = useAdministrationCommand();
  if (result?.temporaryPassword) return <CredentialHandoff login={result.member.login} password={result.temporaryPassword}
    hostname={window.location.hostname} onDone={() => onCreated(result.member.identityId)} />;
  return <>
    <button className={styles.back} disabled={command.pending} onClick={onBack}><ArrowLeft size={16} />{copy.employees}</button>
    <header className={styles.heading}><h1>{copy.newMember}</h1></header>
    <form className={styles.sections} onSubmit={(event) => {
      event.preventDefault(); void command.execute(JSON.stringify(draft), (key, signal) => client.createMember(draft, key, signal)).then((value) => {
        if (!value) return;
        if (value.temporaryPassword) setResult(value); else onCreated(value.member.identityId);
      });
    }}>
      <section className={styles.section}><MemberFields draft={draft} copy={copy} disabled={command.pending} onChange={(fields) => setDraft({ ...draft, ...fields })} /></section>
      <section className={styles.section}><h2>{copy.access}</h2><RoleField role={draft.role} disabled={command.pending} allowAdmin={owner}
        onChange={(role) => setDraft({ ...draft, role })} /><p className={styles.hint}>{copy.temporaryHelp}</p></section>
      {command.error && <p className={styles.error} role="alert">{administrationError(command.error, locale)}</p>}
      <div className={styles.formFooter}><button className={styles.primary} type="submit" disabled={command.pending}>{copy.newMember}</button>
        <button className={styles.button} type="button" disabled={command.pending} onClick={onBack}>{copy.cancel}</button></div>
    </form>
  </>;
}
