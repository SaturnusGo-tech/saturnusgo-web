import { ExternalLink, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { useTmsHttpClient } from "../../auth/http/TmsHttpClientContext";
import type { YouTrackIntegrationStatus } from "../../application/integrations/getYouTrackIntegrationStatus";
import { getYouTrackIntegrationStatus } from "../../application/integrations/getYouTrackIntegrationStatus";
import { useTmsLocale } from "../../localization/context/useTmsLocale";
import { SaturnLoader } from "../common/loading/SaturnLoader";
import surface from "./hooks.module.css";

export function HooksView({ workspaceId }: { workspaceId: string }) {
  const http = useTmsHttpClient();
  const { locale, t } = useTmsLocale();
  const [status, setStatus] = useState<YouTrackIntegrationStatus | null>(null);
  const [failure, setFailure] = useState(false);
  const [reload, setReload] = useState(0);
  const refresh = useCallback(() => setReload((value) => value + 1), []);

  useEffect(() => {
    const controller = new AbortController();
    setFailure(false);
    void getYouTrackIntegrationStatus(http, workspaceId, controller.signal)
      .then(setStatus)
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setFailure(true);
        }
      });
    return () => controller.abort();
  }, [http, workspaceId, reload]);

  if (!status && !failure) {
    return (
      <div className={surface.statePage}>
        <SaturnLoader pane label={t("hooks.loading")} testId="youtrack-status-loading" />
      </div>
    );
  }

  if (!status) {
    return (
      <div className={surface.statePage}>
        <div className={surface.failure} role="alert">
          <strong>{t("hooks.loadError")}</strong>
          <button type="button" className={surface.secondaryAction} onClick={refresh}>
            <RefreshCw size={15} aria-hidden="true" />
            {t("hooks.retry")}
          </button>
        </div>
      </div>
    );
  }

  const lastSync = status.lastSyncedAt
    ? new Intl.DateTimeFormat(locale === "ru" ? "ru-RU" : "en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(status.lastSyncedAt))
    : "—";

  return (
    <div className={surface.root} data-testid="hooks-view">
      <header className={surface.header}>
        <div>
          <span>{t("hooks.integration")}</span>
          <h1>YouTrack</h1>
        </div>
        <a className={surface.secondaryAction} href={status.baseUrl} target="_blank" rel="noreferrer">
          {t("hooks.openYouTrack")}
          <ExternalLink size={15} aria-hidden="true" />
        </a>
      </header>

      <dl className={surface.metrics}>
        <div><dt>{t("hooks.linked")}</dt><dd>{status.linked}</dd></div>
        <div><dt>{t("hooks.pending")}</dt><dd>{status.pending}</dd></div>
        <div data-warning={status.failed > 0}><dt>{t("hooks.failed")}</dt><dd>{status.failed}</dd></div>
        <div><dt>{t("hooks.lastSync")}</dt><dd>{lastSync}</dd></div>
      </dl>

      <section className={surface.targets} aria-labelledby="youtrack-routing-title">
        <header>
          <div>
            <h2 id="youtrack-routing-title">{t("hooks.routing")}</h2>
            <p>{t("hooks.routingHint")}</p>
          </div>
          <button type="button" className={surface.quietAction} onClick={refresh}>
            <RefreshCw size={14} aria-hidden="true" />
            {t("hooks.refresh")}
          </button>
        </header>
        {(["android", "ios", "backend"] as const).map((target) => (
          <div key={target}>
            <span>{target === "ios" ? "iOS" : target[0]?.toUpperCase() + target.slice(1)}</span>
            <code>{status.targets[target].shortName}</code>
          </div>
        ))}
      </section>
    </div>
  );
}
