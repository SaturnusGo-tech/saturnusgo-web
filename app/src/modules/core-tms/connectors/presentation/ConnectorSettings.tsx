"use client";
import { useState } from "react";
import { LoaderCircle, Save, RefreshCw } from "lucide-react";
import type { Provider } from "../model/connector-types";
import { useConnector } from "../application/useConnector";
import { ConnectorChrome, type ConnectorTab } from "./chrome/ConnectorChrome";
import { ConnectionPanel } from "./connection/ConnectionPanel";
import { AutomationPanel } from "./automation/AutomationPanel";
import { DisconnectPanel } from "./lifecycle/DisconnectPanel";
import { ActivityPanel } from "./activity/ActivityPanel";
import styles from "./styles/connector.module.css";
export function ConnectorSettings({ workspaceId, projectId, provider, ru, canManage, onBack, onSaved }: {
  workspaceId: string; projectId: string; provider: Provider; ru: boolean; canManage: boolean;
  onBack: () => void; onSaved: () => void;
}) {
  const [tab, setTab] = useState<ConnectorTab>("connection");
  const state = useConnector({ workspaceId, projectId }, provider, ru, onSaved, tab === "activity");
  const project = state.snapshot?.catalog.projects.find((p) => p.id === projectId)?.name ?? projectId;
  const snapshot = state.snapshot;
  return <ConnectorChrome provider={provider} ru={ru} project={project} tab={tab} onTab={setTab} onBack={onBack}
    enabled={Boolean(snapshot?.connection?.enabled)}>
    {state.error && <div className={styles.error} role="alert"><p>{state.error}</p>
      <button type="button" className={styles.secondary} onClick={() => void (tab === "activity" && snapshot && !state.configurationReloadRequired ? state.refreshActivity() : state.load())}
        disabled={Boolean(state.pending)}><RefreshCw size={14} />{ru ? "Загрузить заново" : "Reload"}</button></div>}
    {state.notice && <div className={styles.notice} role="status">{state.notice}</div>}
    {!snapshot && state.pending && <div className={styles.loading} role="status"><LoaderCircle size={22} />{ru ? "Загружаем настройки…" : "Loading settings…"}</div>}
    {snapshot && <>
      {!canManage && <p className={styles.notice}>{ru ? "Режим просмотра. Управление доступно администратору или QA-менеджеру." : "Read-only. An administrator or QA manager can manage this integration."}</p>}
      {tab === "activity" ? <ActivityPanel snapshot={snapshot} ru={ru} canManage={canManage} pending={state.pending}
        refreshFailed={state.activityFailed} onRecover={(id, remote) => void state.recover(id, remote)}
        onMore={() => void state.more()} onRefresh={() => void state.refreshActivity()} onRepublish={(id) => void state.republish(id)} /> :
        <form onSubmit={(event) => { event.preventDefault(); void state.save(); }}>
          <fieldset className={styles.form} disabled={!canManage || Boolean(state.pending)}>
            <legend className={styles.srOnly}>{ru ? "Настройки интеграции" : "Integration settings"}</legend>
            {tab === "connection" ? <ConnectionPanel provider={provider} ru={ru} draft={state.draft} snapshot={snapshot}
              discovery={state.discovery} pending={state.pending} onChange={state.setDraft} onDiscover={() => void state.discover()} /> :
              <AutomationPanel provider={provider} ru={ru} draft={state.draft} discovery={state.discovery} catalog={snapshot.catalog} onChange={state.setDraft} />}
          </fieldset>
          {canManage && <footer className={styles.footer}><label className={styles.check}><input type="checkbox" checked={state.draft.enabled}
            disabled={Boolean(state.pending)} onChange={(e) => state.setDraft({ ...state.draft, enabled: e.target.checked })} />
            <span>{ru ? "Включить интеграцию" : "Enable integration"}</span></label>
            <small>{state.draft.enabled ? (ru ? "Изменения применятся после сохранения." : "Changes take effect after saving.") :
              (ru ? "Подключение сохранится без запуска автоматизации." : "The connection will be saved without starting automation.")}</small>
            <button type="submit" className={styles.primary} disabled={Boolean(state.pending) || !snapshot.etag}>
              {state.pending === "save" ? <LoaderCircle size={16} /> : <Save size={16} />}{state.pending === "save" ? (ru ? "Сохраняем…" : "Saving…") :
                !snapshot.connection ? (ru ? "Сохранить подключение" : "Save connection") : (ru ? "Сохранить" : "Save changes")}</button></footer>}
          {tab === "connection" && snapshot.connection && canManage && <DisconnectPanel ru={ru}
            pending={Boolean(state.pending)} onDisconnect={() => void state.disconnect()} />}
        </form>}
    </>}
  </ConnectorChrome>;
}
