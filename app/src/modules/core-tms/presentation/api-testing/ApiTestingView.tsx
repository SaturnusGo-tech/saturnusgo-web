"use client";

import { ExternalLink, LogOut, RefreshCw, Send } from "lucide-react";
import { useState } from "react";
import { useTmsLocale } from "../../localization/context/useTmsLocale";
import { SaturnLoader } from "../common/loading/SaturnLoader";
import styles from "../../tms.module.css";
import surface from "./api-testing.module.css";
import {
  UMBRELLA_API_SWAGGER_LOGOUT_URL,
  UMBRELLA_API_SWAGGER_URL,
  POSTMAN_WEB_URL,
} from "./model";

type ApiTool = "swagger" | "postman";

export function ApiTestingView() {
  const { t } = useTmsLocale();
  const [activeTool, setActiveTool] = useState<ApiTool>("swagger");
  const [loaded, setLoaded] = useState(false);
  const [frameKey, setFrameKey] = useState(0);
  const [frameUrl, setFrameUrl] = useState(UMBRELLA_API_SWAGGER_URL);
  const [loggingOut, setLoggingOut] = useState(false);

  function reload() {
    setLoaded(false);
    setLoggingOut(false);
    setFrameUrl(UMBRELLA_API_SWAGGER_URL);
    setFrameKey((current) => current + 1);
  }

  function signOut() {
    setLoaded(false);
    setLoggingOut(true);
    setFrameUrl(UMBRELLA_API_SWAGGER_LOGOUT_URL);
  }

  function handleFrameLoad() {
    if (loggingOut) {
      setLoggingOut(false);
      setFrameUrl(UMBRELLA_API_SWAGGER_URL);
      return;
    }
    setLoaded(true);
  }

  function selectSwagger() {
    setActiveTool("swagger");
  }

  function selectPostman() {
    setActiveTool("postman");
  }

  return <section className={surface.page} data-testid="api-testing-view">
    <header className={surface.header}>
      <div>
        <h1>{t("apiTesting.title")}</h1>
        <p>{activeTool === "swagger" ? t("apiTesting.description") : t("apiTesting.postmanDescription")}</p>
        <small>{activeTool === "swagger" ? t("apiTesting.authHint") : t("apiTesting.postmanAuthHint")}</small>
      </div>
      {activeTool === "swagger" && <div className={surface.actions}>
        <button className={styles.secondaryButton} type="button" onClick={reload}>
          <RefreshCw size={16} />{t("apiTesting.reload")}
        </button>
        <button className={styles.secondaryButton} type="button" onClick={signOut}>
          <LogOut size={16} />{t("apiTesting.signOut")}
        </button>
        <a className={styles.secondaryButton} href={UMBRELLA_API_SWAGGER_URL} target="_blank" rel="noreferrer">
          <ExternalLink size={16} />{t("apiTesting.openExternal")}
        </a>
      </div>}
    </header>
    <nav className={surface.toolTabs} aria-label={t("apiTesting.toolsLabel")}>
      <button className={activeTool === "swagger" ? surface.toolTabActive : surface.toolTab} type="button" aria-current={activeTool === "swagger" ? "page" : undefined} onClick={selectSwagger}>
        Swagger
      </button>
      <a className={activeTool === "postman" ? surface.toolTabActive : surface.toolTab} aria-current={activeTool === "postman" ? "page" : undefined} href={POSTMAN_WEB_URL} target="_blank" rel="noreferrer noopener" onClick={selectPostman}>
        <Send size={15} />Postman<ExternalLink size={13} className={surface.externalMark} />
      </a>
    </nav>
    {activeTool === "swagger" ? <div className={surface.webview} role="tabpanel">
        {!loaded && <div className={surface.loading}><SaturnLoader pane label={t("apiTesting.loading")} testId="api-swagger-loading" /></div>}
        <iframe
          key={frameKey}
          className={surface.frame}
          src={frameUrl}
          title={t("apiTesting.frameTitle")}
          onLoad={handleFrameLoad}
          referrerPolicy="no-referrer"
          sandbox="allow-downloads allow-forms allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts"
          allow="clipboard-write"
        />
      </div> : <div className={surface.postmanPanel} role="tabpanel">
        <div className={surface.postmanCopy}>
          <Send size={24} aria-hidden="true" />
          <h2>Postman Web</h2>
          <p>{t("apiTesting.postmanExternalOnly")}</p>
          <a className={styles.primaryButton} href={POSTMAN_WEB_URL} target="_blank" rel="noreferrer noopener">
            {t("apiTesting.openPostman")}<ExternalLink size={16} />
          </a>
        </div>
      </div>}
  </section>;
}
