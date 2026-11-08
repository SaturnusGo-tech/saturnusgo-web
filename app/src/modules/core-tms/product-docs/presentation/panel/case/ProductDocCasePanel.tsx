"use client";

import { Drawer, DrawerContent } from "@heroui/react";
import { AnimatePresence, motion, useIsPresent, useReducedMotion } from "framer-motion";
import { ArrowUpRight, X } from "lucide-react";
import { useLayoutEffect, useRef, useState, type CSSProperties, type RefObject } from "react";
import { useGuidePanelWidth } from "../../../../documentation/panel/resize/useGuidePanelWidth";
import { useTmsLocale } from "../../../../localization/context/useTmsLocale";
import { CaseLocationBreadcrumbs } from "../../../../presentation/cases/detail/location/CaseLocationBreadcrumbs";
import { CaseDetailPanel } from "../../../../presentation/cases/detail/CaseDetailPanel";
import { AppOverlay } from "../../../../presentation/common/overlay/AppOverlay";
import { useSharedSteps } from "../../../../shared-steps/state/useSharedSteps";
import { useCaseCollaboration } from "../../../../state/case-collaboration/useCaseCollaboration";
import { visitWorkspace } from "../../../../state/navigation/browser/workspace-history";
import { buildCaseDeepLink } from "../../../../test-cases/navigation/case-deep-link";
import type { Activity } from "../../../../../../core/tms/contracts/legacy-contract";
import type { ProductDocScope } from "../../../domain/product-docs";
import { productDocsCopy } from "../../../localization/copy";
import { useProductDocCase } from "../../../state/inspector/useProductDocCase";
import { ReadState } from "../../status/ReadState";
import styles from "../../product-docs.module.css";
import caseStyles from "./product-doc-case-panel.module.css";

type Props = {
  caseId: string;
  scope: ProductDocScope;
  projectName?: string;
  trigger?: HTMLElement;
  contentRef: RefObject<HTMLDivElement | null>;
  onClose(): void;
  onOpenDefect?(id: string): void;
  activity?: Activity[];
};

const panelId = "falcon-doc-case-panel";

export function ProductDocCasePanel({ caseId, ...props }: Omit<Props, "caseId"> & { caseId?: string }) {
  const returnFocus = useRef<HTMLElement | undefined>(undefined);
  const dismissed = useRef(false);
  const size = useGuidePanelWidth(props.contentRef, "falcon.product-doc-case.width.v1");
  const { locale } = useTmsLocale();
  const reduced = useReducedMotion();
  useLayoutEffect(() => {
    if (caseId) {
      returnFocus.current = props.trigger;
      dismissed.current = false;
    }
  }, [caseId, props.trigger]);

  function dismiss() {
    dismissed.current = true;
    props.onClose();
  }

  if (!size.desktop) return <Drawer isOpen={Boolean(caseId)} onClose={props.onClose} placement="right"
    aria-label={locale === "ru" ? "Тест-кейс" : "Test case"} hideCloseButton isDismissable={false}
    disableAnimation={Boolean(reduced)} classNames={{
      wrapper: caseStyles.drawerWrapper, backdrop: caseStyles.drawerBackdrop, base: caseStyles.drawer,
    }}>
    <DrawerContent id={panelId}>
      {caseId && <CompactCasePreview key={caseId} caseId={caseId} {...props} />}
    </DrawerContent>
  </Drawer>;

  return <AppOverlay><AnimatePresence initial={false} onExitComplete={() => {
    const trigger = returnFocus.current;
    if (dismissed.current && trigger?.isConnected) requestAnimationFrame(() => trigger.focus({ preventScroll: true }));
  }}>
    {caseId && <DesktopCasePanel key={caseId} caseId={caseId} size={size} {...props} onClose={dismiss} />}
  </AnimatePresence></AppOverlay>;
}

type PreviewProps = Omit<Props, "trigger" | "contentRef">;

function CompactCasePreview(props: PreviewProps) {
  const [expanded, setExpanded] = useState(false);
  return <CasePreview {...props} present expanded={expanded} onExpand={() => setExpanded(value => !value)} />;
}

function DesktopCasePanel({ contentRef, size, ...props }: Props & { size: ReturnType<typeof useGuidePanelWidth> }) {
  const { locale } = useTmsLocale();
  const copy = productDocsCopy(locale);
  const panel = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const present = useIsPresent();
  const [expanded, setExpanded] = useState(false);
  const modal = present && expanded;

  useLayoutEffect(() => {
    const element = panel.current;
    if (element) element.inert = !present;
    if (present) element?.focus({ preventScroll: true });
  }, [present]);

  useLayoutEffect(() => {
    if (!modal || !contentRef.current) return;
    const parent = contentRef.current;
    const previous = parent.inert;
    parent.inert = true;
    return () => { parent.inert = previous; };
  }, [modal, contentRef]);

  return <motion.aside ref={panel} tabIndex={-1} role="dialog" aria-label={locale === "ru" ? "Тест-кейс" : "Test case"}
    aria-modal={modal || undefined} aria-hidden={!present || undefined} id={panelId}
    className={`${styles.panel} ${caseStyles.panel}`} data-exiting={!present || undefined}
    style={{ "--product-docs-panel-width": expanded ? "100vw" : size.width ? `${size.width}px` : undefined } as CSSProperties}
    initial={{ x: reduced ? 0 : "100%" }} animate={{ x: 0 }} exit={{ x: reduced ? 0 : "100%" }}
    transition={{ duration: reduced ? 0 : .26, ease: [.16, 1, .3, 1] }}
    onKeyDown={event => {
      if (event.defaultPrevented) return;
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        props.onClose();
      } else if (event.key === "Tab" && modal) {
        const stops = Array.from(event.currentTarget.querySelectorAll<HTMLElement>("a[href], button, input, [tabindex]"))
          .filter(element => element.tabIndex >= 0 && !element.matches(":disabled") && element.getClientRects().length > 0);
        const first = stops[0], last = stops[stops.length - 1];
        if (event.shiftKey ? event.target === first || event.target === panel.current : event.target === last) {
          event.preventDefault();
          (event.shiftKey ? last : first)?.focus();
        }
      }
    }}>
    {!expanded && <div className={styles.resizeHandle} role="separator" tabIndex={0}
      aria-label={copy.panelWidth} aria-orientation="vertical" aria-controls={panelId}
      aria-valuemin={size.minWidth} aria-valuemax={size.maxWidth} aria-valuenow={size.width} {...size.handleProps} />}
    <CasePreview {...props} present={present} expanded={expanded} onExpand={() => setExpanded(value => !value)} />
  </motion.aside>;
}

function CasePreview({ caseId, scope, projectName, onClose, onOpenDefect, activity = [], expanded, present, onExpand }:
  PreviewProps & { expanded: boolean; present: boolean; onExpand(): void }) {
  const { locale, languageTag } = useTmsLocale();
  const ru = locale === "ru";
  const copy = productDocsCopy(locale);
  const title = ru ? "Тест-кейс" : "Test case";
  const resource = useProductDocCase(caseId, scope.projectId);
  const record = resource.status === "ready" ? resource.data : undefined;
  const collaboration = useCaseCollaboration({ active: Boolean(record && present), connected: true, projectId: scope.projectId,
    caseId, canComment: false, canConfirmFix: false });
  const sharedSteps = useSharedSteps(scope.projectId, "connected");
  const repository = record && new URL(buildCaseDeepLink(window.location.href, { ...scope, caseId }));
  repository?.searchParams.set("view", "cases");
  if (record?.data.folderId) repository?.searchParams.set("folderId", record.data.folderId);

  return <>
    <header className={caseStyles.header}>
      {record
        ? <CaseLocationBreadcrumbs ru={ru} projectName={projectName} path={record.data.folderPath} title={record.data.current.title} />
        : <span className={caseStyles.placeholder}>{projectName || title}</span>}
      {repository && <a className={styles.iconButton} href={repository.href} aria-label={ru ? "Открыть в репозитории" : "Open in repository"}
        title={ru ? "Открыть в репозитории" : "Open in repository"} onClick={(event) => {
          if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
          event.preventDefault();
          visitWorkspace(repository.href);
        }}><ArrowUpRight size={16} aria-hidden="true" /></a>}
      {!record && <button className={styles.iconButton} type="button" aria-label={copy.close} onClick={onClose}>
        <X size={17} aria-hidden="true" />
      </button>}
    </header>
    <div className={caseStyles.body}>
      {record ? <CaseDetailPanel locale={locale} languageTag={languageTag} testCase={{ ...record.data, etag: record.etag ?? "" }}
        revision={record.data.current} linkIds={record.data.linkIds} activity={activity} collaboration={collaboration}
        onOpenDefect={onOpenDefect ?? (() => {})} sharedSteps={sharedSteps.items} onResolveSharedStep={sharedSteps.resolve}
        selectedFolder={record.data.folderPath} readOnly canAttach={false} onNew={() => {}} onEdit={() => {}} onClone={() => {}}
        onArchive={() => {}} onRunCase={() => {}} fullscreen={expanded} onToggleFullscreen={onExpand}
        onClose={onClose} />
        : <ReadState copy={copy} status={resource.status === "ready" ? "error" : resource.status} retry={resource.retry} />}
    </div>
  </>;
}
