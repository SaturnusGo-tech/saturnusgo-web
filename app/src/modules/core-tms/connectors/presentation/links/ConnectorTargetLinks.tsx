"use client";
import { ExternalLink } from "lucide-react";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { useConnectorTargetLinks } from "../../application/links/useConnectorTargetLinks";
import { connectorLinkDisplay } from "../../model/links/connector-link-display";
import styles from "./target-links.module.css";
export function ConnectorTargetLinks({ workspaceId, projectId, targetId }: {
  workspaceId: string; projectId: string; targetId: string;
}) {
  const { locale } = useTmsLocale(); const ru = locale === "ru";
  const state = useConnectorTargetLinks({ workspaceId, projectId }, targetId);
  return <section className={styles.section}><h2>{ru ? "Интеграции" : "Integrations"}</h2>
    {state.status === "loading" && <small role="status">{ru ? "Загружаем связи…" : "Loading links…"}</small>}
    {state.status === "error" && <div role="alert"><small>{ru ? "Не удалось загрузить связи." : "Could not load links."}</small>
      <button type="button" onClick={state.retry}>{ru ? "Повторить" : "Retry"}</button></div>}
    {state.status === "ready" && !state.links.length && <small>{ru ? "Связанных записей пока нет." : "No linked records yet."}</small>}
    {state.links.map((link) => {
      const display = connectorLinkDisplay(link);
      return <a key={link.connectionId} href={link.url} target="_blank" rel="noreferrer">
        <span><strong>{display.provider} · {link.remoteKey}</strong>{display.status && <small>{display.status}</small>}</span><ExternalLink size={14} /></a>;
    })}
  </section>;
}
