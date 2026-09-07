import { useState } from "react";
import { ArrowDownToLine, ArrowUpRight, RefreshCw, Link2 } from "lucide-react";
import type { Snapshot } from "../../model/connector-types";
import { connectorLinkDisplay } from "../../model/links/connector-link-display";
import { eventLabel, statusLabel } from "../../localization/connector-copy";
import { connectorFailureLabel } from "../../localization/connector-failure-copy";
import { reportRepublishAvailable } from "./report-republish-action";
import styles from "../styles/connector.module.css";
export function ActivityPanel({ snapshot, ru, canManage, pending, refreshFailed, onRecover, onMore, onRefresh, onRepublish }: {
  snapshot: Snapshot; ru: boolean; canManage: boolean; pending: string | null;
  refreshFailed: boolean;
  onRecover: (id: string, remoteId?: string) => void; onMore: () => void; onRefresh: () => void;
  onRepublish: (runId: string) => void;
}) {
  const [reconcile, setReconcile] = useState<string | null>(null); const [remoteId, setRemoteId] = useState("");
  const refreshing = pending === "activity" || pending === "load";
  return <div className={styles.activityGrid} aria-busy={refreshing}>
    <section className={styles.panel}>
      <header><h2>{ru ? "Доставка событий" : "Event deliveries"}</h2><button type="button" className={styles.secondary}
        onClick={onRefresh} disabled={Boolean(pending)}><RefreshCw size={15} />{ru ? "Обновить" : "Refresh"}</button></header>
      {refreshing && <p role="status">{ru ? "Обновляем журнал и связи…" : "Refreshing activity and links…"}</p>}
      {!refreshing && !refreshFailed && snapshot.deliveries.length === 0 && <div className={styles.empty}><ArrowDownToLine size={24} /><h3>{ru ? "Событий пока нет" : "No events yet"}</h3>
        <p>{ru ? "После подключения подходящие события проекта и подписанные вебхуки появятся здесь." : "Matching project events and signed webhooks will appear here after setup."}</p></div>}
      <div className={styles.deliveries}>{snapshot.deliveries.map((d) => <article key={d.id} className={styles.delivery}>
        <div className={styles.deliveryMain}><strong>{eventLabel(d.event, ru)}</strong><span className={styles.deliveryBadge} data-status={d.status}>{statusLabel(d.status, ru)}</span></div>
        <p><time dateTime={d.createdAt}>{new Date(d.createdAt).toLocaleString(ru ? "ru-RU" : "en-US")}</time> · {d.direction === "inbound" ? "→ Falcon" : "Falcon →"} · {ru ? "попыток" : "attempts"}: {d.attempts}</p>
        <code>{d.targetId}</code>{d.errorCode && <small className={styles.deliveryError}>{connectorFailureLabel(d.errorCode, ru)}</small>}
        {d.status === "failed" && canManage && <button type="button" className={styles.secondary} disabled={Boolean(pending)} onClick={() => onRecover(d.id)}>{ru ? "Повторить" : "Retry"}</button>}
        {canManage && reportRepublishAvailable(snapshot, d) && <div>
          <button type="button" className={styles.secondary} disabled={Boolean(pending)} onClick={() => onRepublish(d.targetId)}>
            <RefreshCw size={15} />{ru ? "Обновить отчёт" : "Republish report"}</button>
          <small>{ru ? "Обновить существующую страницу Confluence отчётом этого прогона." : "Update the existing Confluence page with this run’s report."}</small>
        </div>}
        {d.status === "uncertain" && <><p>{snapshot.connection?.provider === "confluence"
          ? (ru ? "Ответ Confluence потерян. Проверьте содержимое и версию страницы отчёта, затем укажите её ID для проверки связи. Повторная публикация автоматически не запускается." :
            "The Confluence response was lost. Check the report page content and version, then enter its page ID to verify the link. Publication is not retried automatically.")
          : (ru ? "Ответ сервиса потерян. Проверьте, создалась ли запись, и укажите её ID для восстановления связи." :
            "The service response was lost. Check whether the record exists and enter its ID to restore the link.")}</p>
          {canManage && (reconcile === d.id ? <div className={styles.reconcile}><label>{ru ? "ID созданной записи" : "Created record ID"}
            <input value={remoteId} onChange={(e) => setRemoteId(e.target.value)} /></label><button type="button" className={styles.secondary}
              disabled={!remoteId.trim() || Boolean(pending)} onClick={() => onRecover(d.id, remoteId.trim())}>{ru ? "Проверить и связать" : "Verify and link"}</button></div> :
            <button type="button" className={styles.secondary} onClick={() => { setReconcile(d.id); setRemoteId(""); }}>{ru ? "Восстановить связь" : "Restore link"}</button>)}</>}
      </article>)}</div>
      {snapshot.nextCursor && <button type="button" className={styles.secondary} disabled={Boolean(pending)} onClick={onMore}>{ru ? "Показать ещё" : "Load more"}</button>}
    </section>
    <section className={styles.panel}><header><Link2 size={18} /><h2>{ru ? "Связанные записи" : "Linked records"}</h2></header>
      <small>{ru ? "Последние 50 обновлённых связей" : "The 50 most recently updated links"}</small>
      {!refreshing && !refreshFailed && snapshot.links.length === 0 && <div className={styles.empty}>{ru ? "Здесь появятся созданные задачи, карточки, отчёты и сообщения." : "Created issues, cards, reports and messages will appear here."}</div>}
      {snapshot.links.map((link) => {
        const display = connectorLinkDisplay(link);
        return <a key={link.targetId} href={link.url} target="_blank" rel="noreferrer" className={styles.linkRow}>
          <div><strong>{display.provider} · {link.remoteKey}</strong><small>{link.targetId}</small>
            {display.status && <span>{display.status}</span>}</div><ArrowUpRight size={16} /></a>;
      })}
    </section>
  </div>;
}
