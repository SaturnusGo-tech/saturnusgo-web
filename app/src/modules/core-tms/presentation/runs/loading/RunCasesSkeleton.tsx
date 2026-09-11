import css from "./run-skeleton.module.css";
export function RunCasesSkeleton() {
  return <div className={css.skeleton} aria-hidden="true">{[0,1,2,3,4].map((i) =>
    <div key={i} className={css.row}><span /><i style={{ width: `${72-i*7}%` }} /></div>)}</div>;
}
