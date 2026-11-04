"use client";
import { useState } from "react";
import type { useCompanySso } from "../../application/useCompanySso";
import type { AdministrationPort } from "../../../application/ports/administration-port";
import { useTmsLocale } from "../../../../localization/context/useTmsLocale";
import { ResourceState } from "../../../presentation/common/ResourceState";
import { SessionConfirmation } from "../../../presentation/reauthentication/SessionConfirmation";
import { ssoCopy } from "../copy/sso-copy";
import { SsoServiceProvider } from "../sp/SsoServiceProvider";
import { SsoProviderForm } from "../editor/SsoProviderForm";
import { SsoSubjects } from "../subjects/SsoSubjects";
import styles from "./sso.module.css";

export function CompanySsoScreen({ model, client }: { readonly model: ReturnType<typeof useCompanySso>; readonly client: AdministrationPort }) {
  const { locale } = useTmsLocale();
  const copy = ssoCopy(locale);
  const [agreed, setAgreed] = useState(false);
  const { resource, command, subjects } = model;
  const config = resource.value;
  const busy = command.pending || resource.refreshing || !!resource.error;
  return <div className={styles.page}><header className={styles.heading}><h1>{copy.title}</h1><p>{copy.intro}</p></header>
    {resource.loading || !config ? <ResourceState loading={resource.loading} error={resource.error} retry={resource.refresh} /> : <>
      {resource.error && <ResourceState loading={false} error={resource.error} retry={resource.refresh} />}
      {command.error === "REAUTHENTICATION_REQUIRED" ? <SessionConfirmation client={client} onConfirmed={command.clearError} />
        : command.error && <p className={styles.error} role="alert">{command.error === "SSO_CONFLICT" ? copy.conflict : copy.error}</p>}
      <div className={styles.status} role="status">{config.enforced ? copy.enforced : config.enabled ? copy.enabled : config.testedAt ? copy.tested : copy.draft}</div>
      <SsoServiceProvider config={config} copy={copy} />
      <SsoProviderForm key={config.version ?? "new"} config={config} copy={copy} pending={busy} save={model.save} />
      {subjects.loading || !subjects.value ? <ResourceState loading={subjects.loading} error={subjects.error} retry={subjects.refresh} />
        : <SsoSubjects client={client} value={subjects.value} copy={copy} pending={busy || subjects.refreshing} bind={model.bind} />}
      <section className={styles.section}><h2>{copy.policy}</h2><p className={styles.hint}>{copy.testHint}</p>
        <div className={styles.actions}>
          <button className={styles.button} disabled={busy || !config.configured} onClick={() => void model.test()}>{copy.test}</button>
          <button className={styles.button} disabled={command.pending || resource.refreshing} onClick={resource.refresh}>{copy.refresh}</button>
          <button className={styles.primary} disabled={busy || (!config.enabled && !config.testedAt)} onClick={() => void model.enable(!config.enabled)}>{config.enabled ? copy.disable : copy.enable}</button>
        </div>
        <p className={styles.hint}>{copy.recovery}</p>
        {!config.enforced && <label className={styles.agreement}><input type="checkbox" checked={agreed} onChange={event => setAgreed(event.target.checked)} disabled={busy} />{copy.agree}</label>}
        <button className={styles.button} disabled={busy || (!config.enforced && (!config.enabled || !config.testedAt || !agreed))}
          onClick={() => void model.enforce(!config.enforced)}>{config.enforced ? copy.optional : copy.enforce}</button>
      </section>
    </>}
  </div>;
}
