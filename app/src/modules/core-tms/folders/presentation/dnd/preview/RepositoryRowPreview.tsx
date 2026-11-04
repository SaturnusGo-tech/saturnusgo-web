import { useLayoutEffect, useRef } from "react";
import type { RepositoryRowSnapshot } from "./row-snapshot";
import css from "../styles/drag.module.css";

export function RepositoryRowPreview({ snapshot, count }: { snapshot: RepositoryRowSnapshot; count: number }) {
  const host = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const element = host.current;
    element?.replaceChildren(snapshot.node);
    return () => { element?.replaceChildren(); };
  }, [snapshot]);
  return <div className={css.dragPreview} data-snapshot data-stacked={count > 1 || undefined} aria-hidden="true"
    style={{ width: snapshot.width, minHeight: snapshot.height, left: snapshot.offsetX, top: snapshot.offsetY }}>
    <div ref={host} className={css.snapshotRow} />
    {count > 1 && <b className={css.selectionCount}>{count}</b>}
  </div>;
}
