"use client";

import { ExternalLink, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { isFalconDesktop } from "../../../../../auth/sign-in/domain/desktop-mode";
import { CodexMark } from "../../../../../codex-employee/presentation/branding/CodexMark";
import type { TmsLocale } from "../../../../../localization/model/locale";
import { IntegrationGuideLink } from "../../../../../presentation/hooks/shared/theme/IntegrationGuideLink";
import { visitWorkspace } from "../../../../../state/navigation/browser/workspace-history";
import type { ProductDocScope } from "../../../../domain/product-docs";
import { codexBrowserAddress, codexDesktopCommandAddress, codexSetupAddress } from "../../../../state/draft/codex/codexDocsLaunch";
import { useProductDocCodexConnection } from "../../../../state/draft/codex/useProductDocCodexConnection";
import styles from "./codex-action.module.css";

type Notice = "unknown" | "missing-app" | "desktop-version" | "launch-failed";
type Handoff = { requestId: string; timer: ReturnType<typeof setTimeout> };

export function ProductDocCodexAction({ scope, locale, disabled }: { scope: ProductDocScope; locale: TmsLocale; disabled: boolean }) {
  const { status, refresh } = useProductDocCodexConnection(scope.workspaceId, scope.projectId);
  const ru = locale === "ru";
  const [notice, setNotice] = useState<Notice | null>(null);
  const [opening, setOpening] = useState(false);
  const pending = useRef<Handoff | null>(null);

  useEffect(() => {
    function acknowledge(event: Event) {
      const detail = (event as CustomEvent<{ requestId?: string; status?: string }>).detail;
      if (!pending.current || detail?.requestId !== pending.current.requestId
        || !["opened", "unavailable", "failed"].includes(detail.status ?? "")) return;
      clearTimeout(pending.current.timer);
      pending.current = null;
      setOpening(false);
      setNotice(detail.status === "opened" ? null : detail.status === "unavailable" ? "missing-app" : "launch-failed");
    }
    window.addEventListener("falcon:codex-handoff", acknowledge);
    return () => {
      window.removeEventListener("falcon:codex-handoff", acknowledge);
      if (pending.current) clearTimeout(pending.current.timer);
    };
  }, []);

  function openSetup() {
    visitWorkspace(codexSetupAddress(window.location.href, scope, locale));
  }

  function openCodex() {
    if (disabled || pending.current || status === "checking") return;
    setNotice(null);
    if (status === "unknown") { setNotice("unknown"); return; }
    if (status === "available") { openSetup(); return; }
    if (!isFalconDesktop()) {
      window.location.assign(codexBrowserAddress(locale));
      return;
    }
    if (!navigator.userAgent.split(" ").includes("FalconCodexHandoff/1")) { setNotice("desktop-version"); return; }

    setOpening(true);
    const fail = () => {
      if (pending.current) clearTimeout(pending.current.timer);
      pending.current = null;
      setOpening(false);
      setNotice("launch-failed");
    };
    try {
      const requestId = crypto.randomUUID();
      pending.current = { requestId, timer: setTimeout(fail, 7000) };
      window.open(codexDesktopCommandAddress(window.location.origin, locale, requestId), "_blank", "noopener");
    } catch { fail(); }
  }

  const label = status === "checking"
    ? (ru ? "Проверяем подключение Codex" : "Checking your Codex connection")
    : status === "available" ? (ru ? "Подключить Codex к проекту" : "Connect Codex to this project")
    : (ru ? "Подготовить черновик в Codex" : "Draft with Codex");
  const capability = ru
    ? "Подготовьте страницу из требований QA, заметок или PDF. Проверьте её перед публикацией."
    : "Draft a QA page from requirements, notes or a PDF. Review it before publishing.";
  const permission = ru ? "Для сохранения черновиков обновите разрешения Falcon в Codex."
    : "To save drafts, update the Falcon permissions in Codex.";
  const title = status === "read-only" ? `${capability} ${permission}` : status === "connected" ? capability : label;
  const notices: Record<Notice, string> = {
    unknown: ru ? "Не удалось проверить подключение Codex." : "Couldn’t check your Codex connection.",
    "missing-app": ru ? "Установите приложение ChatGPT, чтобы открыть Codex." : "Install the ChatGPT desktop app to open Codex.",
    "desktop-version": ru ? "Обновите Falcon Desktop, чтобы открывать Codex из редактора." : "Update Falcon Desktop to open Codex from the editor.",
    "launch-failed": ru ? "Не удалось открыть Codex. Попробуйте ещё раз." : "Couldn’t open Codex. Try again.",
  };

  return <div className={styles.root} onKeyDown={(event) => {
    if (event.key === "Escape" && notice) { event.stopPropagation(); setNotice(null); }
  }}>
    <button type="button" className={styles.action} title={title} aria-label={label}
      aria-description={title !== label ? title : undefined}
      aria-busy={opening || status === "checking" || undefined}
      disabled={disabled || opening || status === "checking"} onClick={openCodex}>
      <CodexMark className={styles.mark} />
      <span>Codex</span>
    </button>
    {notice && <div className={styles.notice}>
      <button className={styles.dismiss} type="button" aria-label={ru ? "Закрыть" : "Close"} onClick={() => setNotice(null)}>
        <X size={15} aria-hidden="true" />
      </button>
      <p role="status">{notices[notice]}</p>
      <div className={styles.links}>
        {notice === "unknown" && <button type="button" onClick={() => { setNotice(null); refresh(); }}>
          {ru ? "Проверить снова" : "Retry"}
        </button>}
        {notice === "missing-app" && <a href="https://chatgpt.com/download/" target="_blank" rel="noopener noreferrer">
          {ru ? "Скачать ChatGPT" : "Download ChatGPT"} <ExternalLink size={12} aria-hidden="true" />
        </a>}
        {notice === "unknown"
          ? <button type="button" onClick={openSetup}>{ru ? "Плагин Falcon" : "Falcon plugin"}</button>
          : <IntegrationGuideLink article="codex-prompts-product-docs">{ru ? "Сценарии" : "Prompt examples"}</IntegrationGuideLink>}
      </div>
    </div>}
  </div>;
}
