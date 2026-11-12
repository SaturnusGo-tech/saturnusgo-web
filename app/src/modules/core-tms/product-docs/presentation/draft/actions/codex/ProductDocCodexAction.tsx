"use client";
import { AnchoredPopover as Popover } from "../../../../../../../shared/components/anchored-popup/popover/AnchoredPopover";

import { LoadingOrb } from "../../../../../../../shared/components/loading/LoadingOrb";
import { Button, PopoverContent, PopoverTrigger } from "@heroui/react";
import { useReducedMotion } from "framer-motion";
import { ExternalLink, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { isFalconDesktop } from "../../../../../auth/sign-in/domain/desktop-mode";
import { CodexMark } from "../../../../../codex-employee/presentation/branding/CodexMark";
import { useIntegrationGuide } from "../../../../../documentation/panel/GuidePanelProvider";
import type { TmsLocale } from "../../../../../localization/model/locale";
import { IntegrationGuideLink } from "../../../../../presentation/hooks/shared/theme/IntegrationGuideLink";
import { visitWorkspace } from "../../../../../state/navigation/browser/workspace-history";
import type { ProductDocScope } from "../../../../domain/product-docs";
import { codexBrowserAddress, codexDesktopCommandAddress, codexSetupAddress } from "../../../../state/draft/codex/codexDocsLaunch";
import { useProductDocCodexConnection } from "../../../../state/draft/codex/useProductDocCodexConnection";
import styles from "./codex-action.module.css";

type Notice = "missing-app" | "desktop-version" | "launch-failed";
type Handoff = { requestId: string; timer: ReturnType<typeof setTimeout> };
const promptGuide = "codex-prompts-product-docs";

export function ProductDocCodexAction({ scope, locale, disabled }: { scope: ProductDocScope; locale: TmsLocale; disabled: boolean }) {
  const { status, refresh } = useProductDocCodexConnection(scope.workspaceId, scope.projectId);
  const guide = useIntegrationGuide();
  const reducedMotion = useReducedMotion();
  const ru = locale === "ru";
  const [open, setOpen] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [opening, setOpening] = useState(false);
  const pending = useRef<Handoff | null>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const guideRequested = useRef(false);

  useEffect(() => {
    function acknowledge(event: Event) {
      const detail = (event as CustomEvent<{ requestId?: string; status?: string }>).detail;
      if (!pending.current || detail?.requestId !== pending.current.requestId
        || !["opened", "unavailable", "failed"].includes(detail.status ?? "")) return;
      clearTimeout(pending.current.timer);
      pending.current = null;
      setOpening(false);
      if (detail.status === "opened") setOpen(false);
      setNotice(detail.status === "opened" ? null : detail.status === "unavailable" ? "missing-app" : "launch-failed");
    }
    window.addEventListener("falcon:codex-handoff", acknowledge);
    return () => {
      window.removeEventListener("falcon:codex-handoff", acknowledge);
      if (pending.current) clearTimeout(pending.current.timer);
    };
  }, []);

  function openSetup() {
    setOpen(false);
    visitWorkspace(codexSetupAddress(window.location.href, scope, locale));
  }

  function openGuide() {
    if (!guideRequested.current || !trigger.current) return;
    guideRequested.current = false;
    guide?.open(promptGuide, trigger.current);
  }

  function openCodex() {
    if (disabled || pending.current || status === "checking" || status === "unknown") return;
    setNotice(null);
    if (status === "available") { openSetup(); return; }
    if (!isFalconDesktop()) {
      setOpen(false);
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
  const notices: Record<Notice, string> = {
    "missing-app": ru ? "Установите приложение ChatGPT, чтобы открыть Codex." : "Install the ChatGPT desktop app to open Codex.",
    "desktop-version": ru ? "Обновите Falcon Desktop, чтобы открывать Codex из редактора." : "Update Falcon Desktop to open Codex from the editor.",
    "launch-failed": ru ? "Не удалось открыть Codex. Попробуйте ещё раз." : "Couldn’t open Codex. Try again.",
  };

  return <Popover isOpen={open} onOpenChange={setOpen} placement="bottom-end" offset={6} containerPadding={12}
    shouldBlockScroll={false} shouldCloseOnScroll={false} classNames={{ content: styles.panel }} style={{ zIndex: 160 }}
    disableAnimation={Boolean(reducedMotion)} motionProps={{ onAnimationComplete: (phase) => {
      if (phase === "exit") openGuide();
    } }}>
    <PopoverTrigger>
      <Button ref={trigger} className={styles.action} title="Codex" isDisabled={disabled}>
        <CodexMark className={styles.mark} />
        <span>Codex</span>
      </Button>
    </PopoverTrigger>
    <PopoverContent aria-label="Codex">
      <div className={styles.heading}>
        <CodexMark />
        <strong>Codex</strong>
        <Button className={styles.dismiss} isIconOnly aria-label={ru ? "Закрыть" : "Close"} onPress={() => setOpen(false)}>
          <X size={15} aria-hidden="true" />
        </Button>
      </div>
      <p>{capability}</p>
      {status === "read-only" && <p>{permission}</p>}
      {status === "unknown" && <p role="status">{ru ? "Не удалось проверить подключение Codex." : "Couldn’t check your Codex connection."}</p>}
      {notice && <p role="status">{notices[notice]}</p>}
      <div className={styles.links}>
        {guide ? <Button onPress={() => {
          guideRequested.current = true;
          setOpen(false);
          if (reducedMotion) requestAnimationFrame(openGuide);
        }}>{ru ? "Сценарии" : "Prompt examples"}</Button>
          : <IntegrationGuideLink article={promptGuide}>{ru ? "Сценарии" : "Prompt examples"}</IntegrationGuideLink>}
        {notice === "missing-app" && <a href="https://chatgpt.com/download/" target="_blank" rel="noopener noreferrer">
          {ru ? "Скачать ChatGPT" : "Download ChatGPT"} <ExternalLink size={12} aria-hidden="true" />
        </a>}
        {status === "unknown" && <Button onPress={() => { setNotice(null); refresh(); }}>
          {ru ? "Проверить снова" : "Retry"}
        </Button>}
      </div>
      <Button className={styles.primary} isDisabled={disabled || status === "checking"} isLoading={opening} spinner={<LoadingOrb />}
        onPress={status === "unknown" ? openSetup : openCodex}>
        {status === "unknown" ? (ru ? "Плагин Falcon" : "Falcon plugin") : label}
      </Button>
    </PopoverContent>
  </Popover>;
}
