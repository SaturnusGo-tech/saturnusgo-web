import { ArrowLeft, ExternalLink } from "lucide-react";
import type { YouTrackIntegrationStatus } from "../../../../application/integrations/getYouTrackIntegrationStatus";
import { IntegrationStatusBadge, type IntegrationUiStatus } from "../../shared/IntegrationStatusBadge";
import { IntegrationThemeToggle } from "../../shared/theme/IntegrationThemeToggle";
import type { HooksCopy } from "../../shared/hooks-copy";
import styles from "../youtrack.module.css";

export function YouTrackSettingsHeader({ onBack, copy, status, integrationStatus, languageTag,
  baseUrl, action = "idle", onSave, russian }: {
  onBack: () => void; copy: HooksCopy; status: IntegrationUiStatus;
  integrationStatus?: YouTrackIntegrationStatus | null; languageTag?: "en-US" | "ru-RU";
  baseUrl?: string; action?: "idle" | "connecting" | "saving" | "disconnecting"; onSave?: () => void; russian: boolean;
}) {
  const failed = integrationStatus?.failed ?? 0;
  return <header className={styles.header}>
    <div className={styles.breadcrumb}>
      <button type="button" onClick={onBack} aria-label={copy.back}><ArrowLeft size={15} aria-hidden="true" />{copy.integrations}</button>
      <span>/</span><span>YouTrack</span>
      <IntegrationThemeToggle russian={russian} className={styles.themeButton} />
    </div>
    <div className={styles.titleRow}>
      <img className={styles.logo} src="/falcon/integrations/youtrack.svg" alt="" />
      <div className={styles.title}><h1>YouTrack <IntegrationStatusBadge status={status} copy={copy} /></h1>
        <p>{russian ? "Дефекты и рабочие процессы" : "Defects and workflows"}</p></div>
      <div className={styles.actions}>
        {baseUrl && <a href={baseUrl} target="_blank" rel="noreferrer">{copy.openYouTrack}<ExternalLink size={14} /></a>}
        {onSave && <button type="button" onClick={onSave} disabled={action !== "idle"}>{action === "saving" ? copy.saving : copy.save}</button>}
      </div>
    </div>
    {integrationStatus && <div className={styles.syncLine}>
      <span>{copy.syncSummary(integrationStatus.linked, formatDate(integrationStatus.lastSyncedAt ?? null, languageTag, copy.never))}</span>
      {failed > 0 && <strong>{copy.syncErrors(failed)}</strong>}
    </div>}
  </header>;
}
function formatDate(value: string | null, languageTag = "ru-RU", empty: string) {
  return value ? new Intl.DateTimeFormat(languageTag, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : empty;
}
