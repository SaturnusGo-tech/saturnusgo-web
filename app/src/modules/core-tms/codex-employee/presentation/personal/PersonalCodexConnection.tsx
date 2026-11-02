import React from "react";
import type { useCodexEmployee } from "../../application/state/useCodexEmployee";
import { CodexMark } from "../branding/CodexMark";
import { codexCopy } from "../copy/codex-copy";
import { CodexResourceState } from "../shared/CodexResourceState";
import styles from "../shared/employee.module.css";
export function PersonalCodexConnection({ state, locale, setupHere = false }: {
    state: ReturnType<typeof useCodexEmployee>;
    locale: "en" | "ru";
    setupHere?: boolean;
}) {
    const copy = codexCopy(locale);
    const employee = state.employee;
    return <section className={styles.panel} aria-label={copy.personal}>
    <header className={styles.header}><CodexMark /><h2>{copy.personal}</h2>{employee && <small>{copy[employee.status]}</small>}</header>
    <p>{copy.explanation}</p>
    <CodexResourceState loading={state.loading} error={state.error} locale={locale} retry={state.refresh}/>
    {employee && (employee.canConnect ? <><div className={styles.actions}><a href={setupHere ? "#codex-setup" : employee.connectUrl}>{copy.connect}</a></div><p className={styles.notice}>{copy.connectNote}</p></> : <p>{copy.unavailable}</p>)}
    <details><summary>{copy.own} ({state.connections.length})</summary>
      <CodexResourceState loading={false} error={state.connectionsError} locale={locale} retry={state.refresh}/>
      {!state.loading && !state.connectionsError && !state.connections.length && <p>{copy.empty}</p>}
      <ul className={styles.connections}>{state.connections.map(connection => <li key={connection.id}>
        <span>{new Date(connection.createdAt).toLocaleDateString(locale)} · {copy.projects}: {connection.projectIds.length}
          <small>{connection.revokedAt ? copy.revoked : `${copy.expires}: ${new Date(connection.expiresAt).toLocaleString(locale)}`}</small></span>
        {!connection.revokedAt && <button type="button" disabled={state.pending} onClick={() => void state.revoke(connection.id)}>{copy.revoke}</button>}
      </li>)}</ul>
    </details>
    <div className={styles.actions}><button type="button" disabled={state.pending || state.loading} onClick={state.refresh}>{copy.refresh}</button></div>
  </section>;
}
