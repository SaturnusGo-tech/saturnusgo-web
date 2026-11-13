import type { ReactNode } from "react";
import css from "./propertyRail.module.css";

export function PropertyRail({ label, title, children, className }: {
  label: string; title: string; children: ReactNode; className?: string;
}) {
  return <aside className={[css.rail, className].filter(Boolean).join(" ")} aria-label={label}>
    <h3>{title}</h3>
    <div className={css.rows}>{children}</div>
  </aside>;
}
