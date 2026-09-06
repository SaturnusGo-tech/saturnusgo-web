import { ArrowLeft, ExternalLink, Save } from "lucide-react";

import type { YouTrackIntegrationStatus } from "../../../../application/integrations/getYouTrackIntegrationStatus";
import surface from "../../hooks.module.css";
import { IntegrationStatusBadge, type IntegrationUiStatus } from "../../shared/IntegrationStatusBadge";
import type { HooksCopy } from "../../shared/hooks-copy";

export function YouTrackSettingsHeader({
  onBack,
  copy,
  status,
  integrationStatus,
  languageTag,
  baseUrl,
  action = "idle",
  onSave,
}: {
  onBack: () => void;
  copy: HooksCopy;
  status: IntegrationUiStatus;
  integrationStatus?: YouTrackIntegrationStatus | null;
  languageTag?: "en-US" | "ru-RU";
  baseUrl?: string;
  action?: "idle" | "connecting" | "saving" | "disconnecting";
  onSave?: () => void;
}) {
  const failed = integrationStatus?.failed ?? 0;
  return (
    <header className={surface.settingsHeader}>
      <button type="button" className={surface.backButton} onClick={onBack} aria-label={copy.back}>
        <ArrowLeft size={18} aria-hidden="true" />
      </button>
      <span className={surface.providerLogo} aria-hidden="true">
        <img src="/falcon/integrations/youtrack.svg" alt="" />
      </span>
      <div className={surface.settingsTitle}>
        <span>{copy.integrations}</span>
        <div><h1>YouTrack</h1><IntegrationStatusBadge status={status} copy={copy} /></div>
        {integrationStatus ? (
          <p>
            {copy.syncSummary(
              integrationStatus.linked,
              formatDate(integrationStatus.lastSyncedAt ?? null, languageTag, copy.never),
            )}
            {failed > 0 ? <strong>{copy.syncErrors(failed)}</strong> : null}
          </p>
        ) : null}
      </div>
      {onSave ? <div className={surface.headerActions}>
        {baseUrl ? (
          <a className={surface.secondaryButton} href={baseUrl} target="_blank" rel="noreferrer">
            {copy.openYouTrack}<ExternalLink size={15} aria-hidden="true" />
          </a>
        ) : null}
        <button type="button" className={surface.primaryButton} onClick={onSave} disabled={action !== "idle"}>
          <Save size={15} aria-hidden="true" />
          {action === "saving" ? copy.saving : copy.save}
        </button>
      </div> : null}
    </header>
  );
}

function formatDate(value: string | null, languageTag = "ru-RU", empty: string) {
  if (!value) return empty;
  return new Intl.DateTimeFormat(languageTag, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
