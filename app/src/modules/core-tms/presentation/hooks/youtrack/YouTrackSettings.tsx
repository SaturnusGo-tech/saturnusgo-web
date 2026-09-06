import { useState } from "react";

import type { YouTrackIntegrationStatus } from "../../../application/integrations/getYouTrackIntegrationStatus";
import surface from "../hooks.module.css";
import type { IntegrationUiStatus } from "../shared/IntegrationStatusBadge";
import { hooksCopy } from "../shared/hooks-copy";
import {
  YouTrackSettingsFailure,
  YouTrackSettingsSkeleton,
} from "./chrome/YouTrackSettingsAside";
import { YouTrackSettingsHeader } from "./chrome/YouTrackSettingsChrome";
import { YouTrackSettingsForm } from "./form/YouTrackSettingsForm";
import { useYouTrackSettings } from "./state/use-youtrack-settings";
import { useYouTrackWebhookSetup } from "./state/webhook/use-youtrack-webhook-setup";
import { DisconnectYouTrackDialog } from "./DisconnectYouTrackDialog";

export function YouTrackSettings({
  workspaceId,
  status,
  languageTag,
  russian,
  canManage,
  onBack,
  onStatusChange,
}: {
  workspaceId: string;
  status: YouTrackIntegrationStatus | null;
  languageTag: "en-US" | "ru-RU";
  russian: boolean;
  canManage: boolean;
  onBack: () => void;
  onStatusChange: () => void;
}) {
  const copy = hooksCopy(russian);
  const state = useYouTrackSettings(workspaceId, copy, onStatusChange, canManage);
  const webhook = useYouTrackWebhookSetup(workspaceId, state.configuration, canManage);
  const [disconnectOpen, setDisconnectOpen] = useState(false);
  const uiStatus: IntegrationUiStatus = state.configuration?.connection.status === "connected" ||
    (state.configuration?.source === "runtime" && state.configuration.enabled &&
      state.configuration.tokenConfigured)
    ? "connected"
    : state.configuration?.connection.status === "failed" ? "attention" : "available";

  if (state.loading) {
    return <div className={surface.root}>
      <YouTrackSettingsHeader onBack={onBack} copy={copy} status="checking" />
      <YouTrackSettingsSkeleton copy={copy} />
    </div>;
  }
  if (state.loadFailed || !state.configuration || !state.draft) {
    return <div className={surface.root}>
      <YouTrackSettingsHeader onBack={onBack} copy={copy} status="attention" />
      <YouTrackSettingsFailure copy={copy} onRetry={state.retry} />
    </div>;
  }
  return (
    <div className={surface.root} data-testid="youtrack-settings">
      <YouTrackSettingsHeader
        onBack={onBack}
        copy={copy}
        status={uiStatus}
        integrationStatus={status}
        languageTag={languageTag}
        baseUrl={state.configuration.baseUrl ?? ""}
        action={state.action}
        onSave={canManage ? () => void state.save() : undefined}
      />
      <YouTrackSettingsForm copy={copy} state={state} webhook={webhook} canManage={canManage}
        onChangeConnection={() => setDisconnectOpen(true)} />
      {canManage && disconnectOpen ? <DisconnectYouTrackDialog copy={copy} busy={state.action === "disconnecting"}
        onClose={() => setDisconnectOpen(false)} onConfirm={() => {
          void state.disconnect().then((done) => { if (done) setDisconnectOpen(false); });
        }} /> : null}
    </div>
  );
}
