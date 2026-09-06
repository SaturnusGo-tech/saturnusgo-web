import { ArrowLeft, ExternalLink, RefreshCw, Save } from "lucide-react";

import surface from "../../hooks.module.css";
import { IntegrationStatusBadge, type IntegrationUiStatus } from "../../shared/IntegrationStatusBadge";
import type { HooksCopy } from "../../shared/hooks-copy";

export function YouTrackSettingsHeader({ onBack, copy, status }: {
  onBack: () => void;
  copy: HooksCopy;
  status: IntegrationUiStatus;
}) {
  return (
    <header className={surface.settingsHeader}>
      <button type="button" className={surface.backButton} onClick={onBack} aria-label={copy.back}>
        <ArrowLeft size={18} aria-hidden="true" />
      </button>
      <span className={surface.providerLogo} aria-hidden="true">
        <img src="/falcon/integrations/youtrack.svg" alt="" />
      </span>
      <div><span>{copy.integrations}</span><h1>YouTrack</h1></div>
      <IntegrationStatusBadge status={status} copy={copy} />
    </header>
  );
}

export function YouTrackSettingsToolbar({
  baseUrl,
  action,
  notice,
  copy,
  onTest,
  onSave,
}: {
  baseUrl: string;
  action: "idle" | "testing" | "saving";
  notice: { tone: "success" | "error"; text: string } | null;
  copy: HooksCopy;
  onTest: () => void;
  onSave: () => void;
}) {
  return (
    <div className={surface.settingsToolbar}>
      <div aria-live="polite">
        {notice ? <span className={surface.notice} data-tone={notice.tone}>{notice.text}</span> : null}
      </div>
      <div className={surface.toolbarActions}>
        {baseUrl ? (
          <a className={surface.secondaryButton} href={baseUrl} target="_blank" rel="noreferrer">
            {copy.openYouTrack}<ExternalLink size={15} aria-hidden="true" />
          </a>
        ) : null}
        <button type="button" className={surface.secondaryButton} onClick={onTest} disabled={action !== "idle"}>
          <RefreshCw size={15} aria-hidden="true" data-spin={action === "testing"} />
          {action === "testing" ? copy.checking : copy.checkConnection}
        </button>
        <button type="button" className={surface.primaryButton} onClick={onSave} disabled={action !== "idle"}>
          <Save size={15} aria-hidden="true" />
          {action === "saving" ? copy.saving : copy.save}
        </button>
      </div>
    </div>
  );
}
