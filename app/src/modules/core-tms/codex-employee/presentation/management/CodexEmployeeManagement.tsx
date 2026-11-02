import React from "react";
import type { useCodexEmployee } from "../../application/state/useCodexEmployee";
import { CodexMark } from "../branding/CodexMark";
import { codexCopy } from "../copy/codex-copy";
import { CodexResourceState } from "../shared/CodexResourceState";
import styles from "../shared/employee.module.css";
export function CodexEmployeeManagement({ state, locale, setupHere = false }: {
    state: ReturnType<typeof useCodexEmployee>;
    locale: "en" | "ru";
    setupHere?: boolean;
}) {
    const copy = codexCopy(locale);
    const employee = state.employee;
    return <section className={styles.panel} aria-label={copy.management}>
    <header className={styles.header}><CodexMark /><h2>{copy.management}</h2>{employee && <small>{copy[employee.status]}</small>}</header>
    <p>{copy.explanation}</p>
    <CodexResourceState loading={state.loading} error={state.error} locale={locale} retry={state.refresh}/>
    {employee && <>
      <p>{copy.seats}: <strong>{employee.capacity.occupied} / {employee.capacity.limit}</strong></p>
      {employee.status !== "active" && employee.capacity.occupied >= employee.capacity.limit && <p>{copy.full}</p>}
      <div className={styles.actions}>
        {employee.canActivate && <a href={setupHere ? "#codex-setup" : employee.connectUrl}>{copy.activate}</a>}
        {employee.canDeactivate && <button type="button" disabled={state.pending} onClick={() => void state.deactivate()}>{copy.disable}</button>}
        <button type="button" disabled={state.pending || state.loading} onClick={state.refresh}>{copy.refresh}</button>
      </div>
      {employee.canActivate && <p className={styles.notice}>{copy.connectNote}</p>}
    </>}
  </section>;
}
