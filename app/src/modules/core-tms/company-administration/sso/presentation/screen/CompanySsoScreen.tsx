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
import { SsoDisclosure } from "./SsoDisclosure";
import styles from "./sso.module.css";

export function CompanySsoScreen({ model, client }: { readonly model: ReturnType<typeof useCompanySso>; readonly client: AdministrationPort }) {
  const { locale } = useTmsLocale();
  const copy = ssoCopy(locale);
  const [agreedVersion, setAgreedVersion] = useState<number | null>(null);
  const { resource, command, subjects } = model;
  const config = resource.value;
  const busy = command.pending || resource.refreshing || !!resource.error;
  const status = config && (config.enforced ? copy.enforced : config.enabled ? copy.enabled
    : config.testedAt ? copy.tested : config.configured ? copy.draft : copy.unconfigured);
  const canRequire = !!(config?.enabled && config.testedAt && config.version !== null);
  const agreed = agreedVersion !== null && agreedVersion === config?.version;

  return <div className={styles.page}>
    <header className={styles.heading}>
      <h1>{copy.title}</h1>
      <p>{copy.intro}</p>
      {status && <span className={styles.status} data-ready={!!(config?.enabled || config?.testedAt)} role="status">
        <span className={styles.statusDot} aria-hidden="true" />{status}
      </span>}
    </header>
    {resource.loading || !config ? <ResourceState loading={resource.loading} error={resource.error} retry={resource.refresh} /> : <div className={styles.sections}>
      {resource.error && <ResourceState loading={false} error={resource.error} retry={resource.refresh} />}
      {command.error === "REAUTHENTICATION_REQUIRED" ? <SessionConfirmation client={client} onConfirmed={command.clearError} />
        : command.error && <p className={styles.error} role="alert">{command.error === "SSO_CONFLICT" ? copy.conflict : copy.error}</p>}
      <section className={styles.section} aria-labelledby="sso-setup">
        <h2 id="sso-setup">{copy.setup}</h2>
        <SsoServiceProvider config={config} copy={copy} />
        <SsoDisclosure title={copy.edit} description={copy.providerHint}>
          <SsoProviderForm key={config.version ?? "new"} config={config} copy={copy} pending={busy} save={model.save} />
        </SsoDisclosure>
      </section>
      <section className={styles.section} aria-labelledby="sso-access">
        <h2 id="sso-access">{copy.access}</h2>
        <SsoDisclosure title={copy.subjects} description={copy.mappingHint}>
          {(subjects.loading || subjects.error || !subjects.value) &&
            <ResourceState loading={subjects.loading} error={subjects.error} retry={subjects.refresh} />}
          {subjects.value && <SsoSubjects client={client} value={subjects.value} copy={copy}
            pending={busy || subjects.refreshing || !!subjects.error} bind={model.bind} />}
        </SsoDisclosure>
      </section>
      <section className={styles.section} aria-labelledby="sso-policy">
        <h2 id="sso-policy">{copy.policy}</h2>
        <div className={styles.row}>
          <div className={styles.rowCopy}><h3 className={styles.rowTitle}>{copy.testTitle}</h3><p className={styles.hint}>{copy.testHint}</p></div>
          <div className={styles.actions}>
            <button className={styles.button} type="button" disabled={command.pending || resource.refreshing} onClick={resource.refresh}>{copy.refresh}</button>
            <button className={config.configured && !config.testedAt ? styles.primary : styles.button}
              type="button" disabled={busy || !config.configured} onClick={() => void model.test()}>{copy.test}</button>
          </div>
        </div>
        <div className={styles.row}>
          <div className={styles.rowCopy}><h3 className={styles.rowTitle}>{copy.availability}</h3><p className={styles.hint}>{copy.enableHint}</p></div>
          <button className={!config.enabled && config.testedAt ? styles.primary : styles.button} type="button"
            disabled={busy || (!config.enabled && !config.testedAt)} onClick={() => void model.enable(!config.enabled)}>
            {config.enabled ? copy.disable : copy.enable}
          </button>
        </div>
        <SsoDisclosure title={copy.requirement} description={copy.enforcementHint}>
          <p className={styles.recovery}>{copy.recovery}</p>
          {!config.enforced && <label className={styles.agreement}>
            <input type="checkbox" checked={agreed} disabled={busy || !canRequire}
              onChange={event => setAgreedVersion(event.target.checked ? config.version : null)} />
            {copy.agree}
          </label>}
          <button className={styles.button} type="button" disabled={busy || (!config.enforced && (!canRequire || !agreed))}
            onClick={() => void model.enforce(!config.enforced)}>{config.enforced ? copy.optional : copy.enforce}</button>
        </SsoDisclosure>
      </section>
    </div>}
  </div>;
}
