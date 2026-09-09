import css from "./skeleton.module.css";

type Props = { label: string; variant?: "detail" | "list" | "article" | "dashboard"; compact?: boolean; testId?: string };
export function ContentSkeleton({ label, variant = "detail", compact = false, testId }: Props) {
  return <div className={css.skeleton} data-variant={variant} data-compact={compact || undefined}
    role="status" aria-busy="true" aria-label={label} data-testid={testId}>
    <div aria-hidden="true">
      <div className={css.title} /><div className={css.subtitle} />
      <div className={css.body}>{Array.from({ length: compact ? 3 : variant === "dashboard" ? 6 : 5 }, (_, index) =>
        <div className={css.row} key={index}><i /><span /><b /></div>)}</div>
    </div>
  </div>;
}
