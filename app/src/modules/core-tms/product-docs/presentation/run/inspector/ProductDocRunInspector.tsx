"use client";

import { Button, Drawer, DrawerContent } from "@heroui/react";
import { ArrowUpRight, PlayCircle, X } from "lucide-react";
import { useRef, useState, type RefObject } from "react";
import { useGuidePanelWidth } from "../../../../documentation/panel/resize/useGuidePanelWidth";
import { useTmsLocale } from "../../../../localization/context/useTmsLocale";
import { WorkspaceRunsStage } from "../../../../presentation/workspace-stage/runs/WorkspaceRunsStage";
import type { WorkspaceModel } from "../../../../state/model/useWorkspaceModel";
import { visitWorkspace } from "../../../../state/navigation/browser/workspace-history";
import { buildWorkspaceDeepLink } from "../../../../state/navigation/workspace-deep-link";
import { WorkspaceMaintenanceProvider } from "../../../../test-cases/maintenance/composition/WorkspaceMaintenanceProvider";
import { useProductDocRunModel, type ProductDocRunSelection } from "../../../state/run/inspector/useProductDocRunModel";
import styles from "./run-inspector.module.css";

const panelId = "falcon-product-doc-run-inspector";

export function ProductDocRunInspector({ selection, workspace, contentRef, onClose }: {
  selection?: ProductDocRunSelection;
  workspace: WorkspaceModel;
  contentRef: RefObject<HTMLDivElement | null>;
  onClose(): void;
}) {
  const { locale } = useTmsLocale();
  const ru = locale === "ru";
  const size = useGuidePanelWidth(contentRef, "falcon.product-doc-run.width.v1");
  const [locked, setLocked] = useState(false);
  const previous = useRef<ProductDocRunSelection | undefined>(undefined);
  if (selection) previous.current = selection;
  const visible = selection ?? previous.current;
  const title = ru ? "Прогон" : "Test run";
  const close = ru ? "Закрыть прогон" : "Close run";
  const openFull = ru ? "Открыть в разделе «Прогоны»" : "Open in Test runs";
  const fullLink = visible && typeof window !== "undefined" ? buildWorkspaceDeepLink(window.location.href, {
    workspaceId: workspace.data.workspace.id, projectId: visible.projectId, view: "runs", runId: visible.runId,
  }) : null;

  function dismiss() {
    if (locked) return;
    onClose();
    const trigger = selection?.trigger;
    if (trigger?.isConnected) window.requestAnimationFrame(() => trigger.focus({ preventScroll: true }));
  }

  return <Drawer isOpen={Boolean(selection)} onClose={dismiss} placement="right" hideCloseButton
    aria-label={title} isDismissable={false} isKeyboardDismissDisabled={locked}
    classNames={{ wrapper: styles.wrapper, backdrop: styles.backdrop, base: styles.drawer }}>
    <DrawerContent style={{ inlineSize: size.desktop ? size.width : "100%" }}>
      {size.desktop && <div className={styles.resize} role="separator" tabIndex={0}
        aria-label={ru ? "Ширина панели прогона" : "Run panel width"} aria-orientation="vertical" aria-controls={panelId}
        aria-valuemin={size.minWidth} aria-valuemax={size.maxWidth} aria-valuenow={size.width} {...size.handleProps} />}
      <header className={styles.header}>
        <span><PlayCircle size={17} aria-hidden="true" />{title}</span>
        <div className={styles.actions}>
          {fullLink && <a className={styles.iconButton} href={fullLink} title={openFull} aria-label={openFull}
            aria-disabled={locked || undefined} onClick={event => {
              if (event.defaultPrevented || event.button !== 0 || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
              event.preventDefault();
              if (!locked) {
                onClose();
                visitWorkspace(fullLink);
              }
            }}><ArrowUpRight size={16} aria-hidden="true" /></a>}
          <Button type="button" isIconOnly variant="light" disableRipple className={styles.iconButton}
            aria-label={close} title={close} isDisabled={locked} onPress={dismiss}><X size={17} aria-hidden="true" /></Button>
        </div>
      </header>
      {visible && <div className={styles.body} id={panelId}>
        <RunContent key={JSON.stringify([visible.projectId, visible.runId])} workspace={workspace}
          selection={visible} onCloseLockedChange={setLocked} />
      </div>}
    </DrawerContent>
  </Drawer>;
}

function RunContent({ workspace, selection, onCloseLockedChange }: {
  workspace: WorkspaceModel; selection: ProductDocRunSelection; onCloseLockedChange(locked: boolean): void;
}) {
  const model = useProductDocRunModel(workspace, selection);
  return <WorkspaceMaintenanceProvider model={model}>
    <WorkspaceRunsStage model={model} fixedRun onCloseLockedChange={onCloseLockedChange} />
  </WorkspaceMaintenanceProvider>;
}
