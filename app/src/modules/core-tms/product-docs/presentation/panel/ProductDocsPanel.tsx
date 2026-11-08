"use client";

import { AnimatePresence, motion, useIsPresent, useReducedMotion } from "framer-motion";
import { BookOpen, Maximize2, X } from "lucide-react";
import { useLayoutEffect, useRef, type CSSProperties, type RefObject } from "react";
import { useGuidePanelWidth } from "../../../documentation/panel/resize/useGuidePanelWidth";
import type { TmsLocale } from "../../../localization/model/locale";
import { AppOverlay } from "../../../presentation/common/overlay/AppOverlay";
import type { ProductDocsApi, ProductDocScope, ProductDocSelection } from "../../domain/product-docs";
import { productDocsCopy } from "../../localization/copy";
import { useProductDocSelection } from "../../state/useProductDocSelection";
import { ProductDocArticle } from "../article/ProductDocArticle";
import { ReadState } from "../status/ReadState";
import styles from "../product-docs.module.css";

type Props = {
  api: ProductDocsApi;
  scope: ProductDocScope;
  locale: TmsLocale;
  projectName?: string;
  selection?: ProductDocSelection;
  onClose(): void;
  onOpenFull?(selection: ProductDocSelection): void;
  trigger?: HTMLElement | null;
  contentRef?: RefObject<HTMLDivElement | null>;
};

const panelId = "falcon-product-docs-panel";

export function ProductDocsPanel(props: Props) {
  return <AppOverlay><AnimatePresence initial={false}>
    {props.selection && <ArticlePanel {...props} selection={props.selection} />}
  </AnimatePresence></AppOverlay>;
}

function ArticlePanel({ api, scope, locale, projectName, selection, onClose, onOpenFull, trigger, contentRef }:
  Omit<Props, "selection"> & { selection: ProductDocSelection }) {
  const copy = productDocsCopy(locale);
  const panel = useRef<HTMLElement>(null);
  const dismissed = useRef(false);
  const reduced = useReducedMotion();
  const present = useIsPresent();
  const size = useGuidePanelWidth(contentRef, "falcon.product-docs.width.v1");
  const article = useProductDocSelection(api, scope, selection);
  const modal = present && !size.desktop;

  useLayoutEffect(() => {
    const element = panel.current;
    if (!element) return;
    const focusPanel = () => {
      if (!element.contains(document.activeElement)) element.focus({ preventScroll: true });
    };
    const outgoing = document.activeElement?.closest('[role="dialog"][aria-modal="true"]');
    if (!outgoing || outgoing === element || outgoing.contains(element)) {
      focusPanel();
      return;
    }

    // The outgoing drawer keeps its focus scope until the exit animation finishes.
    let frame = 0;
    const observer = new MutationObserver(() => {
      if (outgoing.isConnected) return;
      observer.disconnect();
      frame = requestAnimationFrame(focusPanel);
    });
    observer.observe(document.body, { childList: true, subtree: true });
    return () => { observer.disconnect(); cancelAnimationFrame(frame); };
  }, [selection.docId, selection.version, selection.sectionId]);
  useLayoutEffect(() => {
    if (panel.current) panel.current.inert = !present;
    if (!present && dismissed.current && trigger?.isConnected) trigger.focus({ preventScroll: true });
  }, [present, trigger]);
  useLayoutEffect(() => {
    if (!modal || !panel.current?.parentElement) return;
    const siblings = Array.from(panel.current.parentElement.children).filter((element): element is HTMLElement =>
      element instanceof HTMLElement && element !== panel.current && !element.inert);
    siblings.forEach((element) => { element.inert = true; });
    return () => siblings.forEach((element) => { element.inert = false; });
  }, [modal]);

  function dismiss() { dismissed.current = true; onClose(); }

  return <motion.aside className={styles.panel} id={panelId} role="dialog" ref={panel} tabIndex={-1}
    aria-label={copy.title} aria-modal={modal || undefined} aria-hidden={!present || undefined} data-exiting={!present || undefined}
    style={{ "--product-docs-panel-width": size.width ? size.width + "px" : undefined } as CSSProperties}
    initial={{ x: reduced ? 0 : "100%" }} animate={{ x: 0 }}
    exit={{ x: reduced ? 0 : "100%", transition: { duration: reduced ? 0 : .2 } }}
    transition={{ duration: reduced ? 0 : .3, ease: [.16, 1, .3, 1] }}
    onKeyDown={(event) => {
      if (event.defaultPrevented) return;
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        dismiss();
      }
      if (event.key === "Tab" && modal) {
        const items = Array.from(event.currentTarget.querySelectorAll<HTMLElement>("a[href], button, [tabindex]")).filter(
          (item) => item.tabIndex >= 0 && !item.matches(":disabled") && item.getClientRects().length > 0,
        );
        const first = items[0], last = items[items.length - 1];
        const atStart = event.target === first || event.target === event.currentTarget;
        if (event.shiftKey ? atStart : event.target === last) {
          event.preventDefault();
          (event.shiftKey ? last : first)?.focus();
        }
      }
    }}>
    {size.desktop && <div className={styles.resizeHandle} role="separator" tabIndex={0}
      aria-label={copy.panelWidth} aria-orientation="vertical" aria-controls={panelId}
      aria-valuemin={size.minWidth} aria-valuemax={size.maxWidth} aria-valuenow={size.width}
      {...size.handleProps} />}
    <header className={styles.panelHeader}>
      <span className={styles.panelTitle}><BookOpen size={17} aria-hidden="true" />{copy.title}</span>
      <div className={styles.topActions}>
        {onOpenFull && <button className={styles.iconButton} type="button" title={copy.openFull} aria-label={copy.openFull}
          onClick={() => onOpenFull(selection)}><Maximize2 size={16} aria-hidden="true" /></button>}
        <button className={styles.iconButton} type="button" title={copy.close} aria-label={copy.close} onClick={dismiss}>
          <X size={18} aria-hidden="true" />
        </button>
      </div>
    </header>
    <div className={styles.scroll}>
      {article.status === "ready"
        ? <ProductDocArticle document={article.data} copy={copy} scope={scope} locale={locale} projectName={projectName} versionPinned={selection.version !== undefined} sectionId={selection.sectionId} />
        : <ReadState copy={copy} status={article.status} retry={article.retry} />}
    </div>
  </motion.aside>;
}
