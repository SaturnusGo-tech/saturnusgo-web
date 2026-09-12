import type { PortfolioCopy } from "../../model/copy";
import table from "../styles/portfolios.module.css";
import styles from "./catalog-skeleton.module.css";

export function CatalogSkeleton({ copy }: { copy: PortfolioCopy }) {
  return <div className={table.tableWrap} role="status" aria-label={copy.loading} aria-busy="true" data-testid="portfolio-catalog-loading">
    <table className={`${table.table} ${styles.skeleton}`} aria-hidden="true">
      <thead><tr><th>{copy.name}</th><th>{copy.project}</th><th>{copy.responsible}</th><th /></tr></thead>
      <tbody>{[0, 1, 2, 3, 4].map(row => <tr key={row}>
        <td><div className={styles.identity}><i className={styles.folder} /><span className={styles.name} style={{ width: `${42 + row % 3 * 13}%` }}><i /><i /></span></div></td>
        <td><i className={styles.project} /></td>
        <td><div className={styles.identity}><i className={styles.avatar} /><i className={styles.person} /></div></td>
        <td><i className={styles.chevron} /></td>
      </tr>)}</tbody>
    </table>
  </div>;
}
