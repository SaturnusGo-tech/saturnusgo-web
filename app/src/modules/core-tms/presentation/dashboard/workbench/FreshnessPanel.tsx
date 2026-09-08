"use client";

import { useId, useRef, useState } from "react";
import { ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react";
import type { DashboardWorkbenchModel } from "../../../dashboards/workbench/application/useDashboardWorkbench";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { WorkbenchStatus } from "./controls/WorkbenchStatus";
import { freshnessPages, normalizeFreshnessPage, pageForKey } from "./freshness/model";
import { freshnessCopy, freshnessIcons } from "./freshness/presentation";
import styles from "./freshness/freshness.module.css";

type Props = { model: DashboardWorkbenchModel; page?: number; onPageChange?: (page: number) => void };

export function FreshnessPanel({ model, page, onPageChange }: Props) {
  const { locale, languageTag, t } = useTmsLocale();
  const [localPage, setLocalPage] = useState(0);
  const current = normalizeFreshnessPage(page ?? localPage);
  const id = useId();
  const viewport = useRef<HTMLDivElement>(null);
  const copy = freshnessCopy[locale];
  const pages = freshnessPages(model.snapshot);
  const pageLabel = copy.page(current + 1, pages.length);
  const changePage = (next: number) => {
    const normalized = normalizeFreshnessPage(next);
    if (normalized === current) return;
    if (page === undefined) setLocalPage(normalized);
    onPageChange?.(normalized);
  };
  return <section className={styles.panel} aria-labelledby={`${id}-title`} aria-busy={model.loading}
    aria-roledescription={copy.carousel} onKeyDown={(event) => {
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      const next = pageForKey(current, event.key);
      if (next === undefined) return;
      event.preventDefault();
      changePage(next);
      viewport.current?.focus();
    }}>
    <header className={styles.heading}>
      <h2 id={`${id}-title`}>{t("dashboardWorkbench.freshness")}</h2>
      <p>{copy.context}</p>
    </header>
    <WorkbenchStatus loading={model.loading} error={model.error} hasSnapshot={Boolean(model.snapshot)}
      enabled={model.enabled} onRetry={model.refresh} />
    <div ref={viewport} id={`${id}-pages`} className={styles.viewport} tabIndex={0} aria-label={pageLabel}>
      <div className={styles.track} style={{ transform: `translateX(-${current * 50}%)` }}>
        {pages.map((checks, pageIndex) => <div key={pageIndex} className={styles.page}
          role="group" aria-roledescription={copy.slide} aria-label={copy.page(pageIndex + 1, pages.length)}
          aria-hidden={current !== pageIndex}>
          <ul className={styles.checks}>
            {checks.map((check) => {
              const Icon = freshnessIcons[check.kind];
              const label = copy.metrics[check.kind];
              const count = check.count === undefined ? "—" : new Intl.NumberFormat(languageTag).format(check.count);
              const hint = check.hint ? t(`dashboardWorkbench.${check.hint}`) : copy.hints[check.kind];
              return <li key={check.kind}>
                <button type="button" disabled={check.count === undefined} tabIndex={current === pageIndex ? 0 : -1}
                  title={hint} aria-label={`${label}: ${count}. ${hint}`} data-kind={check.kind}
                  onClick={() => model.openDrill(check.kind)}>
                  <span className={styles.icon}><Icon size={20} strokeWidth={1.7} aria-hidden="true" /></span>
                  <span className={styles.label}>{label}</span>
                  <strong>{count}</strong><ArrowUpRight className={styles.drillArrow} size={13} aria-hidden="true" />
                </button>
              </li>;
            })}
          </ul>
        </div>)}
      </div>
    </div>
    <footer className={styles.footer}>
      <span className={styles.pageLabel} aria-live="polite" aria-atomic="true">{pageLabel}</span>
      <div className={styles.progress} role="progressbar" aria-label={copy.navigation}
        aria-valuemin={1} aria-valuemax={pages.length} aria-valuenow={current + 1} aria-valuetext={pageLabel}>
        {pages.map((_, index) => <span key={index} data-current={index === current} />)}
      </div>
      <div className={styles.arrows}>
        <button type="button" aria-label={copy.previous} aria-controls={`${id}-pages`}
          aria-disabled={current === 0} onClick={() => changePage(current - 1)}><ChevronLeft size={17} /></button>
        <button type="button" aria-label={copy.next} aria-controls={`${id}-pages`}
          aria-disabled={current === pages.length - 1} onClick={() => changePage(current + 1)}><ChevronRight size={17} /></button>
      </div>
    </footer>
  </section>;
}
