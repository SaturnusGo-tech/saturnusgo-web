"use client";

import dynamic from "next/dynamic";
import { AnimatePresence, motion, useIsPresent, useReducedMotion } from "framer-motion";
import { Maximize2, Minimize2, X } from "lucide-react";
import { createContext, useContext, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from "react";
import { AppOverlay } from "../../presentation/common/overlay/AppOverlay";
import { useTmsLocale } from "../../localization/context/useTmsLocale";
import styles from "./guide-panel.module.css";
import { useGuidePanelWidth } from "./resize/useGuidePanelWidth";

const GuidePanelReader = dynamic(() => import("./GuidePanelReader").then(module => module.GuidePanelReader));
type OpenGuide = (article: string, trigger: HTMLElement) => void;
type GuideRequest = { article: string; scope: string; trigger: HTMLElement; menuTrigger: HTMLElement | null };
const GuideContext = createContext<{ open: OpenGuide } | null>(null);
export const useIntegrationGuide = () => useContext(GuideContext);
const panelId = "integration-guide-panel";

type GuideContentRef = RefObject<HTMLDivElement | null>;

export function GuidePanelProvider({ scope, children, contentRef }: { scope: string; children: ReactNode; contentRef?: GuideContentRef }) {
  const [guide, setGuide] = useState<GuideRequest | null>(null);
  const open: OpenGuide = (article, trigger) => {
    const popupId = trigger.closest("[popover][id]")?.id;
    const menuTrigger = popupId ? document.querySelector<HTMLElement>(`[aria-controls="${CSS.escape(popupId)}"]`) : null;
    setGuide({ article, scope, trigger, menuTrigger });
  };
  useLayoutEffect(() => { setGuide(null); }, [scope]);

  return <GuideContext.Provider value={{ open }}>
    {children}
    <AppOverlay><AnimatePresence>{guide?.scope === scope && <GuidePanel request={guide} contentRef={contentRef} onClose={() => setGuide(null)} />}</AnimatePresence></AppOverlay>
  </GuideContext.Provider>;
}

function GuidePanel({ request, contentRef, onClose }: { request: GuideRequest; contentRef?: GuideContentRef; onClose: () => void }) {
  const { locale } = useTmsLocale();
  const ru = locale === "ru";
  const [expanded, setExpanded] = useState(false);
  const size = useGuidePanelWidth(contentRef);
  const panel = useRef<HTMLElement>(null);
  const restore = useRef(false);
  const present = useIsPresent();
  const reduced = useReducedMotion();
  const modal = present && (expanded || !size.desktop);
  const resize = expanded ? (ru ? "Свернуть панель" : "Restore panel width") : (ru ? "Развернуть на весь экран" : "Expand to full screen");
  const close = ru ? "Закрыть документацию" : "Close documentation";

  useLayoutEffect(() => {
    const content = contentRef?.current;
    return () => { content?.style.removeProperty("--integration-guide-reserve"); };
  }, [contentRef]);
  useLayoutEffect(() => {
    const content = contentRef?.current;
    content?.style.setProperty("--integration-guide-reserve", present && size.desktop ? `${size.width}px` : "0px");
  }, [contentRef, present, size.desktop, size.width]);
  useLayoutEffect(() => { panel.current?.focus({ preventScroll: true }); }, [request]);
  useLayoutEffect(() => {
    const element = panel.current;
    if (!modal || !element?.parentElement) return;
    const siblings = [...element.parentElement.children].filter((node): node is HTMLElement =>
      node instanceof HTMLElement && node !== element && !node.inert);
    siblings.forEach(node => { node.inert = true; });
    if (!element.contains(document.activeElement)) element.focus({ preventScroll: true });
    return () => siblings.forEach(node => { node.inert = false; });
  }, [modal]);
  useLayoutEffect(() => {
    if (panel.current) panel.current.inert = !present;
    if (!present && restore.current) {
      const trigger = request.trigger.isConnected ? request.trigger : request.menuTrigger;
      if (trigger?.isConnected) trigger.focus({ preventScroll: true });
    }
  }, [present, request]);

  function dismiss() { restore.current = true; onClose(); }

  return <motion.aside ref={panel} id={panelId} className={styles.panel} tabIndex={-1} role="dialog"
    aria-label={ru ? "Документация Falcon" : "Falcon documentation"} aria-hidden={!present || undefined} aria-modal={modal || undefined}
    data-expanded={expanded} data-exiting={!present} data-dragging={size.dragging || undefined} data-integration-guide
    style={{ "--guide-panel-width": `${size.width}px` } as CSSProperties}
    initial={{ x: reduced ? 0 : "100%" }} animate={{ x: 0 }}
    exit={{ x: reduced ? 0 : "100%", transition: { duration: reduced ? 0 : .2, ease: [.4, 0, 1, 1] } }}
    transition={{ duration: reduced ? 0 : .32, ease: [.16, 1, .3, 1] }}
    onKeyDown={event => {
      if (event.defaultPrevented || (event.target as HTMLElement).closest("dialog[open]")) return;
      if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); dismiss(); }
      if (modal && event.key === "Tab") {
        const items = [...event.currentTarget.querySelectorAll<HTMLElement>("a[href], button, summary, input, [tabindex]")].filter(node =>
          node.tabIndex >= 0 && !node.matches(":disabled") && !node.closest("[inert]") && node.getClientRects().length > 0 && getComputedStyle(node).visibility === "visible");
        const first = items[0], last = items[items.length - 1];
        if (event.shiftKey ? event.target === first || event.target === event.currentTarget : event.target === last) {
          event.preventDefault(); (event.shiftKey ? last : first)?.focus();
        }
      }
    }}>
    {size.desktop && !expanded && <div className={styles.resizeHandle} role="separator" tabIndex={0}
      aria-label={ru ? "Ширина панели документации" : "Documentation panel width"} aria-orientation="vertical"
      aria-controls={panelId} aria-valuemin={size.minWidth} aria-valuemax={size.maxWidth} aria-valuenow={size.width}
      {...size.handleProps} />}
    <div className={styles.actions}>
      <button type="button" className={styles.resize} aria-label={resize} title={resize} onClick={() => setExpanded(value => !value)}>
        {expanded ? <Minimize2 size={16} aria-hidden="true" /> : <Maximize2 size={16} aria-hidden="true" />}
      </button>
      <button type="button" aria-label={close} title={close} onClick={dismiss}><X size={19} aria-hidden="true" /></button>
    </div>
    <GuidePanelReader request={request} />
  </motion.aside>;
}
