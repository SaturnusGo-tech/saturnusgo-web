import { ExternalLink, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { useTmsHttpClient } from "../../auth/http/TmsHttpClientContext";
import type { YouTrackIntegrationStatus } from "../../application/integrations/getYouTrackIntegrationStatus";
import { getYouTrackIntegrationStatus } from "../../application/integrations/getYouTrackIntegrationStatus";
import { useTmsLocale } from "../../localization/context/useTmsLocale";
import { SaturnLoader } from "../common/loading/SaturnLoader";
import styles from "../../tms.module.css";
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
        if (!(error instanceof DOMException && error.name === "AbortError")) setFailure(true);
      });
    return () => controller.abort();
  }, [http, workspaceId, reload]);

  if (!status && !failure) {
    return <div className={`${styles.pane} ${styles.centeredPane}`}>
      <SaturnLoader pane label={t("hooks.loading")} testId="youtrack-status-loading" />
    </div>;
  }
  if (!status) {
    return <div className={`${styles.pane} ${styles.centeredPane}`}>
      <div className={surface.failure}><strong>{t("hooks.loadError")}</strong>
        <button className={styles.secondaryButton} onClick={refresh}>
          <RefreshCw size={16} />{t("hooks.retry")}
        </button></div>
    </div>;
  }
  const lastSync = status.lastSyncedAt ? new Intl.DateTimeFormat(locale === "ru" ? "ru-RU" : "en-US",
    { dateStyle: "medium", timeStyle: "short" }).format(new Date(status.lastSyncedAt)) : "—";
  return <div className={`${styles.pane} ${styles.pageScroll} ${surface.root}`}>
    <header className={surface.header}>
      <div><span>{t("hooks.integration")}</span><h1>YouTrack</h1></div>
      <a className={styles.secondaryButton} href={status.baseUrl} target="_blank" rel="noreferrer">
        {t("hooks.openYouTrack")}<ExternalLink size={15} />
      </a>
    </header>
    <dl className={surface.metrics}>
      <div><dt>{t("hooks.linked")}</dt><dd>{status.linked}</dd></div>
      <div><dt>{t("hooks.pending")}</dt><dd>{status.pending}</dd></div>
      <div data-warning={status.failed > 0}><dt>{t("hooks.failed")}</dt><dd>{status.failed}</dd></div>
      <div><dt>{t("hooks.lastSync")}</dt><dd>{lastSync}</dd></div>
    </dl>
    <section className={surface.targets}>
      <header><div><h2>{t("hooks.routing")}</h2><p>{t("hooks.routingHint")}</p></div>
        <button className={styles.textButton} onClick={refresh}><RefreshCw size={14} />{t("hooks.refresh")}</button>
      </header>
      {(["android", "ios", "backend"] as const).map((target) => <div key={target}>
        <span>{target === "ios" ? "iOS" : target[0]?.toUpperCase() + target.slice(1)}</span>
        <code>{status.targets[target].shortName}</code>
      </div>)}
    </section>
  </div>;
}
