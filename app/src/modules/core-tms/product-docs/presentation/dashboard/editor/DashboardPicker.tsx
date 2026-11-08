"use client";

import { addToast, Button, Modal, ModalContent, ModalHeader, Spinner } from "@heroui/react";
import { X } from "lucide-react";
import { useContext, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import type { WidgetDefinition } from "../../../../dashboards/layout/model/widget-catalog";
import { useTmsLocale } from "../../../../localization/context/useTmsLocale";
import { DashboardSegments, dashboardTabId } from "../../../../presentation/dashboard/common/segments/DashboardSegments";
import { WidgetCatalog } from "../../../../presentation/dashboard/customize/catalog/WidgetCatalog";
import { WidgetRenderer } from "../../../../presentation/dashboard/customize/render/WidgetRenderer";
import theme from "../../../../presentation/dashboard/dashboard.module.css";
import type { CaptureDashboardEmbed, DashboardEmbedPeriod } from "../../../domain/dashboard/dashboardEmbed";
import { useProductDocDashboardPreviews } from "../../../state/dashboard/useProductDocDashboardPreviews";
import { ProductDocEmbedContext } from "../../embeds/context/productDocEmbedContext";
import { dashboardSnapshotPattern } from "../markdown/dashboardDirective";
import styles from "./dashboard-picker.module.css";

const periods = [{ key: "7", days: 7 }, { key: "30", days: 30 }, { key: "90", days: 90 }] as const;
type PeriodKey = (typeof periods)[number]["key"];

type PickerProps = {
  capture(input: CaptureDashboardEmbed, signal: AbortSignal): Promise<string>;
  onChoose(id: string): void;
  onClose(): void;
};

export function DashboardPicker({ phase, onExitMotionEnd, onExited, ...props }: PickerProps & {
  phase: "closed" | "open" | "closing"; onExitMotionEnd(): void; onExited(): void;
}) {
  const closing = phase === "closing";
  const end = useRef(onExitMotionEnd);
  useLayoutEffect(() => { end.current = onExitMotionEnd; }, [onExitMotionEnd]);
  useEffect(() => {
    if (!closing) return;
    const fallback = window.setTimeout(() => end.current(), 240);
    return () => window.clearTimeout(fallback);
  }, [closing]);
  return <Modal isOpen={phase !== "closed"} onClose={props.onClose} hideCloseButton isDismissable={false} disableAnimation
    placement="center" scrollBehavior="inside" classNames={{
      wrapper: styles.wrapper, backdrop: `${styles.backdrop} ${closing ? styles.closing : ""}`,
      base: `${theme.widgetTheme} ${styles.picker} ${closing ? styles.closing : ""}`,
    }}>
    <ModalContent onTransitionEnd={(event) => {
      if (closing && event.target === event.currentTarget && event.propertyName === "opacity") onExitMotionEnd();
    }}><DashboardPickerContent {...props} onExited={onExited} /></ModalContent>
  </Modal>;
}

function DashboardPickerContent({ capture, onChoose, onClose, onExited }: PickerProps & { onExited(): void }) {
  const { locale } = useTmsLocale();
  const ru = locale === "ru";
  const scope = useContext(ProductDocEmbedContext);
  const panelId = useId();
  const [periodKey, setPeriodKey] = useState<PeriodKey>("30");
  const period: DashboardEmbedPeriod = periods.find(({ key }) => key === periodKey)?.days ?? 30;
  const [busy, setBusy] = useState(false);
  const request = useRef<AbortController | null>(null);
  const command = useRef<{ key: string; id: string }>(null);
  const finish = useRef(onExited);
  const previews = useProductDocDashboardPreviews(scope, period);
  const title = ru ? "Добавить дашборд" : "Add dashboard";

  useLayoutEffect(() => { finish.current = onExited; }, [onExited]);
  useEffect(() => () => {
    request.current?.abort();
    finish.current();
  }, []);

  async function submit(widget: WidgetDefinition) {
    if (request.current) return;
    const controller = new AbortController();
    const key = JSON.stringify([widget.key, period]);
    if (command.current?.key !== key) command.current = { key, id: crypto.randomUUID() };
    request.current = controller;
    setBusy(true);
    try {
      const id = await capture({ widgetKey: widget.key, periodDays: period, commandId: command.current.id }, controller.signal);
      if (!dashboardSnapshotPattern.test(id)) throw new Error("Invalid dashboard ID");
      if (!controller.signal.aborted) onChoose(id);
    } catch {
      if (!controller.signal.aborted) {
        setBusy(false);
        addToast({ title: ru ? "Не удалось сохранить снимок. Попробуйте ещё раз." : "Couldn’t save the snapshot. Try again.", severity: "danger" });
      }
    } finally {
      request.current = null;
    }
  }

  const close = ru ? "Закрыть каталог дашбордов" : "Close dashboard catalog";
  const status = busy ? (ru ? "Сохраняем снимок…" : "Capturing snapshot…")
    : previews.refreshing ? (ru ? "Обновляем предпросмотр…" : "Refreshing preview…") : undefined;
  return <>
    <header className={styles.header}>
      <ModalHeader as="h2">{title}</ModalHeader>
      <div className={styles.periodControls}>
        <DashboardSegments<PeriodKey> label={ru ? "Период данных" : "Data period"} panelId={panelId}
          listClassName={styles.period} selectedKey={periodKey} disabled={busy}
          items={periods.map(({ key, days }) => ({ key, label: ru ? `${days} дн.` : `${days}d` }))}
          onSelect={setPeriodKey} />
      </div>
      <div className={styles.status} role="status" aria-label={status} data-refreshing={previews.refreshing && !busy || undefined}>
        {status && <Spinner size="sm" color="current" variant="simple" aria-hidden="true" />}
      </div>
      <Button disableRipple isIconOnly variant="light" size="sm" className={styles.close} aria-label={close} title={close} onPress={onClose}>
        <X size={17} aria-hidden="true" />
      </Button>
    </header>
    <div className={styles.body} id={panelId} role="tabpanel" aria-labelledby={dashboardTabId(panelId, periodKey)}
      data-preview-refreshing={previews.refreshing || undefined}>
      <WidgetCatalog dashboardName="" selected={emptySelection} onBack={onClose}
        documentInsert={{ label: title, busy }} onAdd={([widget]) => { if (widget) void submit(widget); }}
        renderPreview={(widget) => {
          const usesWorkbench = widget === "queue" || widget === "freshness" || widget === "readyForRetest";
          if (!(usesWorkbench ? previews.workbench : previews.summary)) return null;
          return <WidgetRenderer widget={widget} evidence={{
            snapshot: previews.summary, workbench: previews.workbench, valueContext: !usesWorkbench && previews.refreshing
              ? ru ? "Предыдущий период" : "Previous period" : ru ? "Предпросмотр" : "Preview",
          }} />;
        }} />
    </div>
  </>;
}

const emptySelection = new Set<string>();
