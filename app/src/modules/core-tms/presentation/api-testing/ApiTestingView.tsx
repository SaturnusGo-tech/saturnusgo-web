"use client";

import { Send } from "lucide-react";
import { useEffect, useState } from "react";
import { useColorMode } from "../../../../shared/_hooks/useColorMode";
import { useTmsLocale } from "../../localization/context/useTmsLocale";
import { TessiqLoader } from "../common/loading/TessiqLoader";
import surface from "./api-testing.module.css";
import { POSTMAN_WEB_URL, swaggerFrameUrl } from "./model";

export function ApiTestingView() {
  const { locale, t } = useTmsLocale();
  const { theme } = useColorMode();
  const [loaded, setLoaded] = useState(false);
  const frameUrl = swaggerFrameUrl(theme, locale);

  useEffect(() => setLoaded(false), [frameUrl]);

  function handleFrameLoad() {
    setLoaded(true);
  }

  return <section className={surface.page} data-testid="api-testing-view">
    <header className={surface.header}>
      <h1>{t("apiTesting.title")}</h1>
    </header>
    <nav className={surface.toolTabs} aria-label={t("apiTesting.toolsLabel")}>
      <button className={surface.toolTabActive} type="button" aria-current="page">
        Swagger
      </button>
      <a className={surface.toolTab} href={POSTMAN_WEB_URL} target="_blank" rel="noopener noreferrer">
        <Send size={15} />Postman
      </a>
    </nav>
    <div className={surface.webview} role="tabpanel">
      {!loaded && <div className={surface.loading}><TessiqLoader pane label={t("apiTesting.loading")} testId="api-swagger-loading" /></div>}
      <iframe
        className={surface.frame}
        src={frameUrl}
        title={t("apiTesting.frameTitle")}
        onLoad={handleFrameLoad}
        referrerPolicy="no-referrer"
        sandbox="allow-downloads allow-forms allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts"
        allow="clipboard-write"
      />
    </div>
  </section>;
}
