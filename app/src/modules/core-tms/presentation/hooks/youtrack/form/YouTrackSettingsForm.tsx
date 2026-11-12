import { IntegrationControlScope } from "../../../common/integration-controls/scope/IntegrationControlScope";
import { useState } from "react";
import { YouTrackNavigation, type YouTrackTab } from "../navigation/YouTrackNavigation";
import identity from "../youtrack.module.css";
import type { HooksCopy } from "../../shared/hooks-copy";
import surface from "../../hooks.module.css";
import type { YouTrackSettingsState } from "../state/use-youtrack-settings";
import { ConnectionSection } from "../sections/ConnectionSection";
import { RoutingSection } from "../sections/RoutingSection";
import { WorkflowSection } from "../sections/workflow/WorkflowSection";
import { WebhookSection } from "../sections/webhook/WebhookSection";
import type { useYouTrackWebhookSetup } from "../state/webhook/use-youtrack-webhook-setup";

export function YouTrackSettingsForm({ copy, state, webhook, canManage, onChangeConnection, russian, embedded = false }: {
  russian: boolean;
  copy: HooksCopy;
  state: YouTrackSettingsState;
  webhook: ReturnType<typeof useYouTrackWebhookSetup>;
  canManage: boolean;
  onChangeConnection: () => void;
  embedded?: boolean;
}) {
  const [tab, setTab] = useState<YouTrackTab>("connection");
  const Content = embedded ? "div" : "main";
  if (!state.configuration || !state.draft) return null;
  return (
    <div className={identity.layout}>
      <YouTrackNavigation embedded={embedded} tab={tab} onTab={setTab} copy={copy} canManage={canManage} russian={russian} />
      <Content className={surface.settingsMain} data-youtrack-body key={tab}>
      {state.notice ? (
        <div className={surface.settingsNotice} data-tone={state.notice.tone} role="status">
          {state.notice.text}
        </div>
      ) : null}
      {!canManage ? <div className={surface.settingsNotice} data-tone="neutral" role="note">
        <strong>{copy.readOnly}</strong> {copy.readOnlyHint}
      </div> : null}
      {state.catalogIssue && <p className={surface.projectLoading} role="status">
        {state.catalogIssue === "empty_fields"
          ? (russian ? "YouTrack не вернул поля статуса выбранных проектов. Текущие сопоставления не изменены." : "YouTrack returned no state fields for the selected projects. Current mappings are unchanged.")
          : state.catalogIssue === "missing_field"
          ? (russian ? "YouTrack не вернул настроенное поле статуса выбранного проекта. Текущие сопоставления не изменены." : "YouTrack did not return the configured state field for a selected project. Current mappings are unchanged.")
          : state.catalogIssue === "legacy_mapping"
          ? (russian ? "Не удалось однозначно сопоставить прежние настройки с полями и статусами YouTrack. Текущие сопоставления не изменены." : "Legacy mappings could not be matched unambiguously to YouTrack fields and statuses. Current mappings are unchanged.")
          : (russian ? "Не удалось загрузить поля и статусы YouTrack. Текущие сопоставления не изменены." : "Could not load YouTrack fields and statuses. Current mappings are unchanged.")}
        {" "}{russian ? "Проверьте доступ к проектам и полям, затем нажмите «Обновить доступ» в разделе «Подключение»." : "Check project and field access, then use Refresh access in Connection."}
      </p>}
      <IntegrationControlScope disabled={!canManage || state.action !== "idle"}><fieldset className={surface.settingsFields} disabled={!canManage || state.action !== "idle"}>
      {tab === "connection" && <ConnectionSection
        copy={copy}
        draft={state.draft}
        tokenConfigured={state.configuration.tokenConfigured}
        showToken={state.showToken}
        connectedProjects={state.selectedProjects.length}
        action={state.action}
        onToggleToken={() => state.setShowToken((value) => !value)}
        onUpdate={state.updateDraft}
        onConnect={() => void state.connect()}
        canDisconnect={state.configuration.source === "workspace" && state.configuration.tokenConfigured}
        onChangeConnection={onChangeConnection}
      />}
      {tab === "projects" && <RoutingSection russian={russian}
        copy={copy}
        draft={state.draft}
        projects={state.selectedProjects}
        loadingProjectId={state.loadingProjectId}
        onUpdate={state.updateDraft}
        onSelectProject={(routeId, projectId) => void state.selectRouteProject(routeId, projectId)}
      />}
      {tab === "workflow" && <WorkflowSection
        copy={copy}
        draft={state.draft}
        projects={state.selectedProjects}
        loadingProjectId={state.loadingProjectId}
        onUpdate={state.updateDraft}
      />}
      {canManage && tab === "webhook" ? <WebhookSection copy={copy} setup={webhook.setup} status={webhook.status} /> : null}
      </fieldset></IntegrationControlScope>
    </Content>
    </div>
  );
}
