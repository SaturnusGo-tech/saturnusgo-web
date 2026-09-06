import type { HooksCopy } from "../../shared/hooks-copy";
import surface from "../../hooks.module.css";
import type { YouTrackSettingsState } from "../state/use-youtrack-settings";
import { ConnectionSection } from "../sections/ConnectionSection";
import { RoutingSection } from "../sections/RoutingSection";
import { WorkflowSection } from "../sections/workflow/WorkflowSection";
import { WebhookSection } from "../sections/webhook/WebhookSection";
import type { useYouTrackWebhookSetup } from "../state/webhook/use-youtrack-webhook-setup";

export function YouTrackSettingsForm({ copy, state, webhook, canManage, onChangeConnection }: {
  copy: HooksCopy;
  state: YouTrackSettingsState;
  webhook: ReturnType<typeof useYouTrackWebhookSetup>;
  canManage: boolean;
  onChangeConnection: () => void;
}) {
  if (!state.configuration || !state.draft) return null;
  return (
    <main className={surface.settingsMain}>
      {state.notice ? (
        <div className={surface.settingsNotice} data-tone={state.notice.tone} role="status">
          {state.notice.text}
        </div>
      ) : null}
      {!canManage ? <div className={surface.settingsNotice} data-tone="neutral" role="note">
        <strong>{copy.readOnly}</strong> {copy.readOnlyHint}
      </div> : null}
      <fieldset className={surface.settingsFields} disabled={!canManage}>
      <ConnectionSection
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
      />
      <RoutingSection
        copy={copy}
        draft={state.draft}
        projects={state.selectedProjects}
        loadingProjectId={state.loadingProjectId}
        onUpdate={state.updateDraft}
        onSelectProject={(routeId, projectId) => void state.selectRouteProject(routeId, projectId)}
      />
      <WorkflowSection
        copy={copy}
        draft={state.draft}
        projects={state.selectedProjects}
        loadingProjectId={state.loadingProjectId}
        onUpdate={state.updateDraft}
      />
      {canManage ? <WebhookSection copy={copy} setup={webhook.setup} status={webhook.status} /> : null}
      </fieldset>
    </main>
  );
}
