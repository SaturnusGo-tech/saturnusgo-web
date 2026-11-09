"use client";

import { LoadingOrb } from "../../../../../../shared/components/loading/LoadingOrb";
import { ProductDocTooltip } from "../../overlay/ProductDocTooltip";

import { Button } from "@heroui/react";
import { Trash2 } from "lucide-react";
import { useContext, useEffect, useId, useState } from "react";
import { widgetByKey } from "../../../../dashboards/layout/model/widget-catalog";
import { useTmsLocale } from "../../../../localization/context/useTmsLocale";
import { DashboardSegments, dashboardTabId } from "../../../../presentation/dashboard/common/segments/DashboardSegments";
import { WidgetRenderer } from "../../../../presentation/dashboard/customize/render/WidgetRenderer";
import theme from "../../../../presentation/dashboard/dashboard.module.css";
import { ProductDocEmbedContext } from "../../embeds/context/productDocEmbedContext";
import type { ProductDocEmbedScope } from "../../../domain/embeds/productDocEmbedScope";
import type { DashboardEmbedMode, ProductDocDashboardData } from "../../../domain/dashboard/dashboardEmbed";
import { useProductDocDashboardGateway } from "../../../state/dashboard/useProductDocDashboardGateway";
import { dashboardSnapshotPattern } from "../markdown/dashboardDirective";
import { DashboardEmbedViewport } from "../visual/DashboardEmbedViewport";
import styles from "./dashboard-card.module.css";

type CardProps = { snapshotId: string; onRemove?(): void };
type Result = { request: number; value: ProductDocDashboardData | null };
type Visible = { mode: DashboardEmbedMode; value: ProductDocDashboardData };

export function ProductDocDashboard(props: CardProps) {
  const scope = useContext(ProductDocEmbedContext);
  return <DashboardEmbedCard {...props} scope={scope}
    key={JSON.stringify([scope?.workspaceId, scope?.projectId, scope?.docId, scope?.version, scope?.draft, scope?.archived, props.snapshotId])} />;
}

function DashboardEmbedCard({ snapshotId, onRemove, scope }: CardProps & { scope: ProductDocEmbedScope | null }) {
  const { locale, languageTag } = useTmsLocale();
  const ru = locale === "ru";
  const gateway = useProductDocDashboardGateway();
  const viewportId = useId();
  const [selection, setSelection] = useState<{ mode: DashboardEmbedMode; request: number }>({ mode: "snapshot", request: 0 });
  const [result, setResult] = useState<Result>();
  const [snapshot, setSnapshot] = useState<ProductDocDashboardData>();
  const [last, setLast] = useState<Visible>();
  const valid = Boolean(gateway && scope && dashboardSnapshotPattern.test(snapshotId));
  const { mode, request } = selection;
  const cached = mode === "snapshot" ? snapshot : undefined;
  const resolved = result?.request === request ? result.value : undefined;
  const visible = cached ? { mode: "snapshot" as const, value: cached } : resolved ? { mode, value: resolved } : last;
  const value = visible?.value;
  const definition = value ? widgetByKey.get(value.widgetKey) : undefined;
  const failed = !valid || resolved === null || (value && !definition);
  const pending = !failed && !cached && resolved === undefined;
  const title = definition ? ru ? definition.ru : definition.en : ru ? "Дашборд" : "Dashboard";
  const observedAt = visible && (visible.mode === "snapshot" ? visible.value.capturedAt : visible.value.generatedAt);
  const date = new Intl.DateTimeFormat(languageTag, { dateStyle: "medium", timeStyle: "short" });
  const formattedDate = observedAt ? date.format(new Date(observedAt)) : "";
  const removeLabel = ru ? "Убрать дашборд" : "Remove dashboard";
  const modeLabel = (type: DashboardEmbedMode) => type === "snapshot"
    ? ru ? "Снимок" : "Snapshot"
    : ru ? "Актуальные данные" : "Current";

  useEffect(() => {
    if (!scope || !gateway || !valid || cached) return;
    const controller = new AbortController();
    void gateway.read(scope, snapshotId, mode, controller.signal).then(
      (data) => {
        if (controller.signal.aborted) return;
        setResult({ request, value: data });
        setLast({ mode, value: data });
        if (mode === "snapshot") setSnapshot(data);
      },
      () => { if (!controller.signal.aborted) setResult({ request, value: null }); },
    );
    return () => controller.abort();
  }, [scope, gateway, valid, cached, snapshotId, mode, request]);

  function show(next: DashboardEmbedMode) {
    setSelection((previous) => previous.mode === next ? previous : { mode: next, request: previous.request + 1 });
  }

  const status = failed ? <div className={styles.state} data-overlay={Boolean(value)} role="alert">
    {value && visible?.mode === "snapshot" && mode === "current"
      ? ru ? "Не удалось обновить. Показан снимок." : "Couldn’t refresh. Showing the snapshot."
      : ru ? "Данные дашборда недоступны." : "Dashboard data is unavailable."}
    {valid && resolved === null && <Button type="button" size="sm" variant="light" disableRipple
      onPress={() => setSelection((previous) => ({ ...previous, request: previous.request + 1 }))}>
      {ru ? "Повторить" : "Retry"}
    </Button>}
  </div> : pending ? <div className={styles.state} data-overlay={Boolean(value)} role="status">
    {value && <LoadingOrb />}
    {ru ? "Загружаем данные…" : "Loading dashboard data…"}
  </div> : undefined;

  return <div className={`${theme.widgetTheme} ${styles.card}`} role="group" aria-label={title}
    data-doc-dashboard="" data-width={definition?.width} contentEditable={onRemove ? false : undefined}>
    <div className={styles.header}>
      <div className={styles.caption}>
        {observedAt && <time dateTime={observedAt} title={`${modeLabel(visible.mode)} · ${formattedDate}`}>{formattedDate}</time>}
        {value && <span>{ru ? `${value.periodDays} дн.` : `${value.periodDays}-day window`}</span>}
      </div>
      <div className={styles.controls}>
        <DashboardSegments label={ru ? "Режим данных" : "Data view"} panelId={viewportId}
          selectedKey={mode} onSelect={show} listClassName={styles.segments} tabClassName={styles.segment}
          items={[{ key: "snapshot", label: modeLabel("snapshot") }, { key: "current", label: ru ? "Актуально" : "Current" }]} />
        {onRemove && <ProductDocTooltip label={removeLabel}><Button type="button" size="sm" isIconOnly variant="light" disableRipple className={styles.remove}
          aria-label={removeLabel} onPress={onRemove}>
          <Trash2 size={16} aria-hidden="true" />
        </Button></ProductDocTooltip>}
      </div>
    </div>
    <DashboardEmbedViewport id={viewportId} labelledBy={dashboardTabId(viewportId, mode)}
      hasData={Boolean(value && definition)} status={status} pending={pending}>
      {value && definition && <WidgetRenderer widget={definition.key} title={title} evidence={{
        snapshot: value.summary, workbench: value.workbench, valueContext: modeLabel(visible!.mode),
      }} />}
    </DashboardEmbedViewport>
  </div>;
}
