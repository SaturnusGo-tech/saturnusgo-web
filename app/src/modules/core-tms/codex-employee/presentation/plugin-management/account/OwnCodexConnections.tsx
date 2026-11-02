import type { useCodexEmployee } from "../../../application/state/useCodexEmployee";
import { codexCopy } from "../../copy/codex-copy";
import { CodexResourceState } from "../../shared/CodexResourceState";
import surface from "../../plugin-surface/plugin.module.css";
import css from "../manager.module.css";

export function OwnCodexConnections({ state, locale }: { state: ReturnType<typeof useCodexEmployee>; locale: "en" | "ru" }) {
  const ru = locale === "ru", copy = codexCopy(locale);
  const date = (value: string) => new Date(value).toLocaleString(locale, { dateStyle: "medium", timeStyle: "short" });
  return <section className={surface.section} aria-label={copy.own}>
    <h2 className={surface.sectionTitle}>{copy.own}<span>{state.connections.length}</span></h2>
    <div className={surface.group}>
      <div className={css.resource}><CodexResourceState loading={state.loading} error={state.connectionsError} locale={locale} retry={state.refresh} /></div>
      {!state.loading && !state.connectionsError && !state.connections.length && <p className={css.empty}>{copy.empty}</p>}
      {!state.connectionsError && state.connections.map(connection => <div key={connection.id} className={surface.row}>
        <div className={surface.rowCopy}>
          <h3 className={surface.rowTitle}>{date(connection.createdAt)}</h3>
          <p className={surface.rowDescription}>{copy.projects}: {connection.projectIds.length} · {connection.revokedAt ? `${copy.revoked}: ${date(connection.revokedAt)}` : `${copy.expires}: ${date(connection.expiresAt)}`}</p>
          <details className={css.connectionDetails}><summary>{ru ? "Проекты и разрешения" : "Projects and permissions"}</summary>
            <p>{ru ? "Проекты" : "Projects"}: {connection.projectIds.join(", ") || "—"}</p>
            <p>{ru ? "Разрешения" : "Scopes"}: {connection.scopes.join(", ") || "—"}</p>
          </details>
        </div>
        {!connection.revokedAt && <button type="button" className={surface.quiet} disabled={state.pending || state.loading}
          onClick={() => void state.revoke(connection.id)}>{copy.revoke}</button>}
      </div>)}
    </div>
  </section>;
}
