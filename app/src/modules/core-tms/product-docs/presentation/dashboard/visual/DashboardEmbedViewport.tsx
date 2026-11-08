"use client";

import { Skeleton } from "@heroui/react";
import { useLayoutEffect, useRef, type ReactNode } from "react";
import styles from "../card/dashboard-card.module.css";

export function DashboardEmbedViewport({ id, labelledBy, children, hasData, status, pending }: {
  id: string; labelledBy: string; children: ReactNode; hasData: boolean; status?: ReactNode; pending: boolean;
}) {
  const viewport = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const frame = viewport.current;
    const widget = content.current;
    if (!hasData || !frame || !widget) return;
    let width = -1;
    const measure = () => {
      const availableWidth = frame.getBoundingClientRect().width;
      if (availableWidth === width) return;
      width = availableWidth;
      const height = widget.getBoundingClientRect().height;
      if (height > 0) frame.style.setProperty("--embed-height", `${Math.ceil(height)}px`);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(frame);
    return () => observer.disconnect();
  }, [hasData]);

  return <div id={id} role="tabpanel" aria-labelledby={labelledBy} tabIndex={0} className={styles.visual} data-pending={pending}>
    <div ref={viewport} className={styles.viewport} data-ready={hasData}>
      <div ref={content} className={styles.native} aria-busy={pending}>{children}</div>
      {!hasData && pending && <Skeleton className={styles.skeleton} aria-hidden="true" />}
    </div>
    {status}
  </div>;
}
