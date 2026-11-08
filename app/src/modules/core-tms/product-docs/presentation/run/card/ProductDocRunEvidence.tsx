"use client";

import { Button, Popover, PopoverContent, PopoverTrigger, Skeleton } from "@heroui/react";
import { ArrowUpRight, History, PanelRight, PlayCircle } from "lucide-react";
import { useContext, useMemo, useRef, type CSSProperties } from "react";
import { useTmsLocale } from "../../../../localization/context/useTmsLocale";
import { localizedLabel } from "../../../../localization/format/labels";
import { DetailProgress } from "../../../../presentation/dashboard/detail/records/RecordSignals";
import { buildWorkspaceDeepLink } from "../../../../state/navigation/workspace-deep-link";
import { useProductDocsWorkspace } from "../../../composition/context/ProductDocsContext";
import { useProductDocRunGateway } from "../../../state/run/useProductDocRunGateway";
import { useProductDocResource } from "../../../state/useProductDocResource";
import { ProductDocEmbedContext } from "../../embeds/context/productDocEmbedContext";
import { runSnapshotPattern, type RunEmbedPlacement } from "../markdown/runDirective";
import { RunEmbedPlacementTools } from "./placement/RunEmbedPlacementTools";
import styles from "./run-evidence.module.css";

const outcomes = ["passed", "failed", "blocked", "in_progress", "not_run", "skipped"] as const;

type Props = {
  snapshotId: string;
  placement?: RunEmbedPlacement;
  onPlacementChange?(placement: RunEmbedPlacement): void;
  onCompose?(alignment: NonNullable<RunEmbedPlacement["align"]>): void;
  onRemove?(): void;
};

export function ProductDocRunEvidence({ snapshotId, placement, onPlacementChange, onCompose, onRemove }: Props) {
  const { locale, languageTag } = useTmsLocale();
  const ru = locale === "ru";
  const scope = useContext(ProductDocEmbedContext);
  const workspace = useProductDocsWorkspace();
  const gateway = useProductDocRunGateway();
  const frame = useRef<HTMLDivElement>(null);
  const request = useMemo(() => scope && gateway && runSnapshotPattern.test(snapshotId)
    ? (signal: AbortSignal) => gateway.read(scope, snapshotId, signal) : undefined, [scope, gateway, snapshotId]);
  const result = useProductDocResource(request);
  const value = result.status === "ready" ? result.data : null;
  const title = ru ? "Результаты прогона" : "Run evidence";
  const detailsLabel = ru ? "Детали снимка" : "Snapshot details";
  const projectId = value?.runProjectId ?? scope?.projectId;
  const runLink = value && scope && projectId && typeof window !== "undefined"
    ? buildWorkspaceDeepLink(window.location.href, { workspaceId: scope.workspaceId, projectId, view: "runs", runId: value.runId }) : null;
  const openRun = workspace?.scope.workspaceId === scope?.workspaceId ? workspace?.openRun : undefined;
  const LinkIcon = openRun ? PanelRight : ArrowUpRight;
  const date = new Intl.DateTimeFormat(languageTag, { dateStyle: "medium", timeStyle: "short" });
  const number = new Intl.NumberFormat(languageTag);
  const counts = value?.counts;
  const progress = counts && {
    total: outcomes.reduce((total, outcome) => total + counts[outcome], 0),
    passed: counts.passed, failed: counts.failed, blocked: counts.blocked, skipped: counts.skipped,
    inProgress: counts.in_progress, notRun: counts.not_run,
  };
  const frameStyle = placement?.width === undefined ? undefined : {
    "--run-embed-width": `${placement.width}%`,
  } as CSSProperties;

  return <div className={styles.track} contentEditable={onRemove ? false : undefined}>
    <div ref={frame} className={styles.frame} style={frameStyle} data-run-embed-frame data-align={placement?.align}
      role="group" aria-label={title}>
      <div className={styles.summary}>
        <div className={styles.identity}>
          <PlayCircle size={17} className={styles.glyph} aria-hidden="true" />
          {runLink ? <a className={styles.runLink} href={runLink} title={ru ? "Открыть прогон" : "Open run"}
            aria-haspopup={openRun ? "dialog" : undefined} onClick={event => {
              if (!openRun || !value || !projectId || event.defaultPrevented || event.button !== 0
                || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
              event.preventDefault();
              openRun({ runId: value.runId, projectId, trigger: event.currentTarget });
            }}>
            <span>{value?.title || value?.runKey}</span>
            <LinkIcon size={13} aria-hidden="true" />
          </a> : <strong>{value?.title || value?.runKey || title}</strong>}
        </div>
        {value && progress && <div className={styles.progress}>
          {progress.total > 0
            ? <DetailProgress progress={progress} />
            : <span>{ru ? "Нет проверок" : "No checks"}</span>}
        </div>}
        {value && <Popover placement="bottom-end" offset={6} shouldBlockScroll={false} classNames={{ content: styles.details }}
          style={{ zIndex: 160 }}>
          <PopoverTrigger>
            <Button type="button" size="sm" variant="light" isIconOnly disableRipple className={styles.detailsTrigger}
              aria-label={detailsLabel} title={detailsLabel}><History size={16} aria-hidden="true" /></Button>
          </PopoverTrigger>
          <PopoverContent aria-label={detailsLabel} data-editor-dialog>
            <strong>{detailsLabel}</strong>
            <dl className={styles.facts}>
              <dt>{ru ? "Прогон" : "Run"}</dt><dd>{value.runKey}</dd>
              <dt>{ru ? "Статус" : "Status"}</dt><dd>{localizedLabel(locale, value.status)}</dd>
              {value.environmentName && <><dt>{ru ? "Окружение" : "Environment"}</dt><dd>{value.environmentName}</dd></>}
              <dt>{ru ? "Снимок от" : "Captured"}</dt><dd><time dateTime={value.capturedAt}>{date.format(new Date(value.capturedAt))}</time></dd>
              <dt>{ru ? "Версия статьи" : "Article version"}</dt>
              <dd>{value.requirementVersions.length ? value.requirementVersions.map(version => number.format(version)).join(", ")
                : ru ? "Статья не закреплена в прогоне" : "Article wasn’t pinned in the run"}</dd>
              {outcomes.filter(outcome => value.counts[outcome] > 0).map(outcome => <div key={outcome} className={styles.fact}>
                <dt>{localizedLabel(locale, outcome)}</dt><dd>{number.format(value.counts[outcome])}</dd>
              </div>)}
            </dl>
          </PopoverContent>
        </Popover>}
        {!value && (!request || result.status === "error" ? <div className={styles.message} role="status">
          {ru ? "Снимок недоступен" : "Snapshot unavailable"}
          {request && <Button type="button" size="sm" variant="light" disableRipple onPress={result.retry}>
            {ru ? "Повторить" : "Retry"}
          </Button>}
        </div> : <div className={styles.message} role="status" aria-label={ru ? "Загружаем снимок прогона" : "Loading run snapshot"}>
          <Skeleton className={styles.skeleton} aria-hidden="true" />
        </div>)}
      </div>
      {onPlacementChange && onRemove && <RunEmbedPlacementTools frame={frame} placement={placement} onChange={onPlacementChange}
        onRemove={onRemove} onCompose={onCompose} ru={ru} />}
    </div>
  </div>;
}
