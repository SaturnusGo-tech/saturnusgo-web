import css from "./connection-title.module.css";

export function ConnectionTitle({ children }: { children: string }) {
  return <span className={css.title}>{children}<span className={css.sweep} aria-hidden="true">{children}</span></span>;
}
