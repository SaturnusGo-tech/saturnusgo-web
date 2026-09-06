import { RefreshCw } from "lucide-react";

import type { YouTrackIntegrationStatus } from "../../../../application/integrations/getYouTrackIntegrationStatus";
import type { YouTrackConfiguration } from "../../../../youtrack/model/youtrack-settings";
import surface from "../../hooks.module.css";
import type { HooksCopy } from "../../shared/hooks-copy";

export function YouTrackSettingsAside({ configuration, status, languageTag, copy }: {
  configuration: YouTrackConfiguration;
  status: YouTrackIntegrationStatus | null;
  languageTag: "en-US" | "ru-RU";
  copy: HooksCopy;
}) {
  const source = configuration.source === "runtime" ? copy.runtimeSource
    : configuration.source === "tenant_default" ? copy.tenantSource : copy.workspaceSource;
  return (
    <aside className={surface.settingsAside}>
      <section>
        <h2>{copy.syncState}</h2>
        <dl className={surface.syncMetrics}>
          <div><dt>{copy.linked}</dt><dd>{status?.linked ?? "—"}</dd></div>
          <div><dt>{copy.pending}</dt><dd>{status?.pending ?? "—"}</dd></div>
          <div data-warning={(status?.failed ?? 0) > 0}>
            <dt>{copy.failed}</dt><dd>{status?.failed ?? "—"}</dd>
          </div>
        </dl>
      </section>
      <section className={surface.asideDetails}>
        <h2>{copy.connectionDetails}</h2>
        <dl>
          <div><dt>{copy.lastCheck}</dt><dd>{formatDate(configuration.connection.checkedAt, languageTag)}</dd></div>
          <div><dt>{copy.lastSync}</dt><dd>{formatDate(status?.lastSyncedAt ?? null, languageTag)}</dd></div>
          <div><dt>{copy.configurationSource}</dt><dd>{source}</dd></div>
        </dl>
      </section>
    </aside>
  );
}

export function YouTrackSettingsSkeleton({ copy }: { copy: HooksCopy }) {
  return (
    <div className={surface.settingsSkeleton} aria-label={copy.loading}>
      <span /><span /><span /><span /><span />
    </div>
  );
}

export function YouTrackSettingsFailure({ copy, onRetry }: {
  copy: HooksCopy;
  onRetry: () => void;
}) {
  return (
    <div className={surface.settingsFailure} role="alert">
      <strong>{copy.loadError}</strong>
      <p>{copy.loadErrorHint}</p>
      <button type="button" className={surface.secondaryButton} onClick={onRetry}>
        <RefreshCw size={15} aria-hidden="true" />{copy.retry}
      </button>
    </div>
  );
}

function formatDate(value: string | null, languageTag: string) {
  if (!value) return "—";
  return new Intl.DateTimeFormat(languageTag, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
