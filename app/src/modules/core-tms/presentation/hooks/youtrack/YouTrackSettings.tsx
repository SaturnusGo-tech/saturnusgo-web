import type { YouTrackIntegrationStatus } from "../../../application/integrations/getYouTrackIntegrationStatus";
import surface from "../hooks.module.css";
import type { IntegrationUiStatus } from "../shared/IntegrationStatusBadge";
import { hooksCopy } from "../shared/hooks-copy";
import {
  YouTrackSettingsAside,
  YouTrackSettingsFailure,
  YouTrackSettingsSkeleton,
} from "./chrome/YouTrackSettingsAside";
import {
  YouTrackSettingsHeader,
  YouTrackSettingsToolbar,
} from "./chrome/YouTrackSettingsChrome";
import { YouTrackSettingsForm } from "./form/YouTrackSettingsForm";
import { useYouTrackSettings } from "./use-youtrack-settings";

export function YouTrackSettings({
  workspaceId,
  status,
  languageTag,
  russian,
  onBack,
  onStatusChange,
}: {
  workspaceId: string;
  status: YouTrackIntegrationStatus | null;
  languageTag: "en-US" | "ru-RU";
  russian: boolean;
  onBack: () => void;
  onStatusChange: () => void;
}) {
  const copy = hooksCopy(russian);
  const state = useYouTrackSettings(workspaceId, copy, onStatusChange);
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
      <YouTrackSettingsHeader onBack={onBack} copy={copy} status={uiStatus} />
      <YouTrackSettingsToolbar
        baseUrl={state.configuration.baseUrl ?? ""}
        action={state.action}
        notice={state.notice}
        copy={copy}
        onTest={() => void state.runConnectionTest()}
        onSave={() => void state.save()}
      />
      <div className={surface.settingsLayout}>
        <YouTrackSettingsForm copy={copy} state={state} />
        <YouTrackSettingsAside
          configuration={state.configuration}
          status={status}
          languageTag={languageTag}
          copy={copy}
        />
      </div>
    </div>
  );
}
