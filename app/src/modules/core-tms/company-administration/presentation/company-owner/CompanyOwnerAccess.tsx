"use client";

import { useCallback, useState } from "react";
import type { Company, CompanyChange, MemberMutation } from "../../domain/administration";
import type { AdministrationPort } from "../../application/ports/administration-port";
import { useAdministrationResource } from "../../application/state/useAdministrationResource";
import { useAdministrationList } from "../../application/list/useAdministrationList";
import { useAdministrationCommand } from "../../application/state/useAdministrationCommand";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { AnimatedSelect } from "../../../presentation/common/select/AnimatedSelect";
import { ResourceState } from "../common/ResourceState";
import { StatusBadge } from "../common/StatusBadge";
import { CredentialHandoff } from "../handoff/CredentialHandoff";
import { SessionConfirmation } from "../reauthentication/SessionConfirmation";
import { administrationError } from "../copy/administration-errors";
import { administrationCopy } from "../copy/administration-copy";
import styles from "../layout/administration.module.css";

export function CompanyOwnerAccess({ company, client, pending, onChange }: {
  readonly company: Company; readonly client: AdministrationPort; readonly pending: boolean;
  readonly onChange: (change: CompanyChange) => Promise<void>;
}) {
  const { locale } = useTmsLocale();
  const copy = administrationCopy(locale);
  const owner = useAdministrationResource(useCallback((signal) => client.companyOwner(company.workspaceId, signal), [client, company.workspaceId]));
  const administrators = useAdministrationList(useCallback((_search, cursor, signal) => client.companyAdministrators(company.workspaceId, cursor, signal), [client, company.workspaceId]));
  const command = useAdministrationCommand();
  const [confirmation, setConfirmation] = useState<"reset" | "transfer" | null>(null);
  const [resetMfa, setResetMfa] = useState(false);
  const [handoff, setHandoff] = useState<MemberMutation | null>(null);
  const [successor, setSuccessor] = useState("");
  const disabled = pending || owner.refreshing || Boolean(owner.error) || command.pending || company.status === "archived";
  const candidates = administrators.items.filter((member) => !member.owner && member.status === "active" && member.mfaEnabled);
  async function reset() {
    const member = owner.value;
    if (!member) return;
    const result = await command.execute(JSON.stringify([company.workspaceId, member.version, resetMfa]),
      (key, signal) => client.recoverCompanyOwner(company.workspaceId, member, resetMfa, key, signal));
    if (!result) return;
    setConfirmation(null);
    if (result.temporaryPassword) setHandoff(result); else owner.refresh();
  }
  if (handoff?.temporaryPassword) return <section className={styles.section}>
    <CredentialHandoff login={handoff.member.login} password={handoff.temporaryPassword} hostname={company.domain?.hostname ?? null}
      onDone={() => { setHandoff(null); owner.refresh(); administrators.refresh(); }} />
  </section>;
  return <section className={styles.section}>
    <h2>{locale === "ru" ? "Главный администратор" : "Primary administrator"}</h2>
    {owner.loading || !owner.value ? <ResourceState loading={owner.loading} error={owner.error} retry={owner.refresh} /> : <>
      <div className={styles.ownerIdentity}><span className={styles.avatar} aria-hidden="true">{owner.value.name.slice(0, 2).toUpperCase()}</span>
        <div className={styles.ownerDetails}><strong>{owner.value.name}</strong><span>{owner.value.email}</span>
          <span>{copy.login}: <b>{owner.value.login}</b></span></div><StatusBadge status={owner.value.status} member /></div>
      {!confirmation && <div className={styles.actions}><button className={styles.button} disabled={disabled} onClick={() => setConfirmation("reset")}>{copy.resetPassword}</button></div>}
      {confirmation === "reset" && command.error !== "REAUTHENTICATION_REQUIRED" && <div className={styles.confirmation}>
        <h3>{copy.resetPassword}</h3>
        <p>{locale === "ru" ? "Новый временный пароль будет показан один раз. Все текущие сеансы администратора завершатся." : "The new temporary password is shown once. All administrator sessions will end."}</p>
        {owner.value.mfaEnabled && <label className={styles.checkLine}><input type="checkbox" checked={resetMfa} disabled={disabled} onChange={(event) => setResetMfa(event.target.checked)} />
          {locale === "ru" ? "Также сбросить второй фактор" : "Also reset the second factor"}</label>}
        <div className={styles.actions}><button className={styles.primary} disabled={disabled} onClick={() => void reset()}>{copy.resetPassword}</button>
          <button className={styles.button} disabled={disabled} onClick={() => setConfirmation(null)}>{copy.cancel}</button></div>
      </div>}
      {candidates.length > 0 && <div className={styles.actions}>
        <AnimatedSelect label={locale === "ru" ? "Передать управление" : "Transfer ownership"} value={successor} disabled={disabled}
          options={[{ value: "", label: locale === "ru" ? "Выберите администратора" : "Choose an administrator" }, ...candidates.map((member) => ({ value: member.identityId, label: member.name }))]}
          onChange={setSuccessor} />
        <button className={styles.button} disabled={disabled || !successor} onClick={() => setConfirmation("transfer")}>{copy.ownerTransfer}</button>
      </div>}
      {administrators.cursor && <div className={styles.actions}><button className={styles.button} disabled={administrators.pending} onClick={() => void administrators.more()}>
        {locale === "ru" ? "Загрузить ещё администраторов" : "Load more administrators"}</button></div>}
      {confirmation === "transfer" && <div className={styles.confirmation}>
        <p>{copy.ownerTransfer}: {candidates.find((member) => member.identityId === successor)?.name}?</p>
        <div className={styles.actions}><button className={styles.primary} disabled={disabled} onClick={() => void onChange({ kind: "owner", identityId: successor }).then(() => setConfirmation(null))}>{copy.confirm}</button>
          <button className={styles.button} disabled={disabled} onClick={() => setConfirmation(null)}>{copy.cancel}</button></div>
      </div>}
    </>}
    {owner.value && owner.error && <ResourceState loading={false} error={owner.error} retry={owner.refresh} />}
    {administrators.error && <ResourceState loading={false} error={administrators.error} retry={administrators.refresh} />}
    {command.error === "REAUTHENTICATION_REQUIRED" ? <SessionConfirmation client={client} platform submitLabel={copy.resetPassword}
      onCancel={() => { command.clearError(); setConfirmation(null); }} onConfirmed={reset} />
      : command.error && <p className={styles.error} role="alert">{administrationError(command.error, locale)}</p>}
  </section>;
}
