import type { ComponentProps, ReactNode } from "react";
import styles from "../dashboardcn.module.css";

export function WidgetCard({ heading, subtitle, actions, children, className, ...props }:
  ComponentProps<"section"> & { heading: string; subtitle?: string; actions?: ReactNode }) {
  return <section className={`${styles.card}${className ? ` ${className}` : ""}`} aria-label={heading} {...props}>
    <header className={styles.heading}>
      <div><h2>{heading}</h2>{subtitle && <p>{subtitle}</p>}</div>
      {actions}
    </header>
    {children}
  </section>;
}

export function WidgetAction({ onClick, children, className, ...props }: ComponentProps<"button">) {
  return onClick ? <button type="button" onClick={onClick} className={`${styles.action}${className ? ` ${className}` : ""}`} {...props}>{children}</button>
    : <span className={className} title={props.title}>{children}</span>;
}
