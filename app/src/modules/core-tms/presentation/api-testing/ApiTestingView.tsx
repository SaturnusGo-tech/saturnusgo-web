"use client";

import { ExternalLink, RefreshCw } from "lucide-react";
import { useState } from "react";
import { useTmsLocale } from "../../localization/context/useTmsLocale";
import { SaturnLoader } from "../common/loading/SaturnLoader";
import styles from "../../tms.module.css";
import surface from "./api-testing.module.css";
import { UMBRELLA_API_SWAGGER_URL } from "./model";

export function ApiTestingView() {
  const { t } = useTmsLocale();
  const [loaded, setLoaded] = useState(false);
  const [frameKey, setFrameKey] = useState(0);

  function reload() {
    setLoaded(false);
    setFrameKey((current) => current + 1);
  }

  return <section className={surface.page} data-testid="api-testing-view">
    <header className={surface.header}>
      <div>
        <h1>{t("apiTesting.title")}</h1>
        <p>{t("apiTesting.description")}</p>
        <small>{t("apiTesting.authHint")}</small>
      </div>
      <div className={surface.actions}>
        <button className={styles.secondaryButton} type="button" onClick={reload}>
          <RefreshCw size={16} />{t("apiTesting.reload")}
        </button>
        <a className={styles.secondaryButton} href={UMBRELLA_API_SWAGGER_URL} target="_blank" rel="noreferrer">
          <ExternalLink size={16} />{t("apiTesting.openExternal")}
        </a>
      </div>
    </header>
    <div className={surface.webview}>
      {!loaded && <div className={surface.loading}><SaturnLoader pane label={t("apiTesting.loading")} testId="api-swagger-loading" /></div>}
      <iframe
        key={frameKey}
        className={surface.frame}
        src={UMBRELLA_API_SWAGGER_URL}
        title={t("apiTesting.frameTitle")}
        onLoad={() => setLoaded(true)}
        referrerPolicy="no-referrer"
        sandbox="allow-downloads allow-forms allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts"
        allow="clipboard-write"
      />
    </div>
  </section>;
}
