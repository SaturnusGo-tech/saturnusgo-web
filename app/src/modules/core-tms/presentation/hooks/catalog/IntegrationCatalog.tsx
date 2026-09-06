import { ChevronRight, RefreshCw } from "lucide-react";

import type { YouTrackIntegrationStatus } from "../../../application/integrations/getYouTrackIntegrationStatus";
import type { YouTrackConfiguration } from "../../../youtrack/model/youtrack-settings";
import surface from "../hooks.module.css";
import { IntegrationStatusBadge, type IntegrationUiStatus } from "../shared/IntegrationStatusBadge";
import type { HooksCopy } from "../shared/hooks-copy";
import {
  INTEGRATIONS,
  INTEGRATION_GROUPS,
  type IntegrationDefinition,
} from "./integration-definitions";

export function IntegrationCatalog({
  russian,
  copy,
  configuration,
  status,
  statusFailed,
  onRefresh,
  onOpenYouTrack,
}: {
  russian: boolean;
  copy: HooksCopy;
  configuration: YouTrackConfiguration | null;
  status: YouTrackIntegrationStatus | null;
  statusFailed: boolean;
  onRefresh: () => void;
  onOpenYouTrack: () => void;
}) {
  return (
    <main className={surface.catalog}>
      <header className={surface.catalogHeader}>
        <span className={surface.eyebrow}>{copy.workspaceSettings}</span>
        <div className={surface.titleRow}>
          <div>
            <h1>{copy.integrations}</h1>
            <p>{copy.integrationsHint}</p>
          </div>
          {statusFailed ? (
            <button type="button" className={surface.quietButton} onClick={onRefresh}>
              <RefreshCw size={15} aria-hidden="true" />
              {copy.refresh}
            </button>
          ) : null}
        </div>
      </header>
      <div className={surface.directory}>
        {INTEGRATION_GROUPS.map((group) => (
          <section key={group} className={surface.integrationGroup} aria-labelledby={`integration-${group}`}>
            <header className={surface.groupHeader}>
              <h2 id={`integration-${group}`}>{copy.groups[group]}</h2>
              <span>{copy.groupHints[group]}</span>
            </header>
            <div className={surface.integrationList}>
              {INTEGRATIONS.filter((entry) => entry.group === group).map((entry) => (
                <IntegrationRow
                  key={entry.id}
                  integration={entry}
                  russian={russian}
                  status={entry.id === "youtrack"
                    ? catalogIntegrationStatus(configuration, status, statusFailed)
                    : "planned"}
                  onOpen={entry.id === "youtrack" ? onOpenYouTrack : undefined}
                  copy={copy}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}

function IntegrationRow({ integration, russian, status, onOpen, copy }: {
  integration: IntegrationDefinition;
  russian: boolean;
  status: IntegrationUiStatus;
  onOpen?: () => void;
  copy: HooksCopy;
}) {
  const Icon = integration.icon;
  const content = <>
    <span className={surface.integrationIcon} data-provider={integration.id} aria-hidden="true">
      {integration.id === "youtrack"
        ? <img src="/falcon/integrations/youtrack.svg" alt="" />
        : Icon ? <Icon /> : null}
    </span>
    <span className={surface.integrationCopy}>
      <strong>{integration.name}</strong>
      <span>{russian ? integration.description.ru : integration.description.en}</span>
    </span>
    <span className={surface.integrationMeta}>
      <IntegrationStatusBadge status={status} copy={copy} />
      {onOpen ? <ChevronRight size={18} aria-hidden="true" /> : null}
    </span>
  </>;
  return onOpen
    ? <button type="button" className={surface.integrationRow} onClick={onOpen}>{content}</button>
    : <div className={surface.integrationRow} data-disabled="true" aria-disabled="true">{content}</div>;
}

function catalogIntegrationStatus(
  configuration: YouTrackConfiguration | null,
  status: YouTrackIntegrationStatus | null,
  statusFailed: boolean,
): IntegrationUiStatus {
  if (configuration) {
    if (configuration.source === "runtime" && configuration.enabled &&
      configuration.tokenConfigured) return "connected";
    if (!configuration.enabled || configuration.connection.status === "unconfigured") return "available";
    return configuration.connection.status === "connected" ? "connected" : "attention";
  }
  if (status) return "connected";
  return statusFailed ? "attention" : "checking";
}
