import { PiBriefcaseDuotone, PiCaretRight, PiFolderSimpleDuotone } from "react-icons/pi";
import type { Project } from "../../../../../core/tms/contracts/legacy-contract";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { formatCount } from "../../../localization/format/count";
import { ResponsibleName } from "../../../workspace/members/presentation/ResponsibleName";
import type { Portfolio, PortfolioRoute } from "../../model/portfolio";
import type { PortfolioCopy } from "../../model/copy";
import styles from "../styles/portfolios.module.css";

export function CatalogTable({ portfolios, projects, workspaceId, copy, onNavigate }: {
  portfolios: readonly Portfolio[]; projects: readonly Project[]; workspaceId: string; copy: PortfolioCopy; onNavigate: (route: PortfolioRoute) => void;
}) {
  const { locale } = useTmsLocale();
  return <div className={styles.tableWrap}><table className={styles.table}>
    <thead><tr><th>{copy.name}</th><th>{copy.project}</th><th>{copy.responsible}</th><th><span className={styles.srOnly}>{copy.openCases}</span></th></tr></thead>
    <tbody>
      {portfolios.map((item) => <tr key={`portfolio:${item.id}`}>
        <td><button type="button" className={styles.rowLink} onClick={() => onNavigate({ kind: "portfolio", id: item.id })}>
          <PiBriefcaseDuotone className={styles.portfolioIcon} size={18} aria-hidden="true" /><span><strong>{item.name}</strong>{item.description && <small>{item.description}</small>}</span>
        </button></td>
        <td className={styles.quiet}>{formatCount(locale, item.projectCount, ["project", "projects"], ["проект", "проекта", "проектов"])}</td>
        <td><ResponsibleName workspaceId={workspaceId} identityId={item.responsibleIdentityId} /></td>
        <td><PiCaretRight aria-hidden="true" /></td>
      </tr>)}
      {projects.map((item) => <tr key={`project:${item.id}`}>
        <td><button type="button" className={styles.rowLink} onClick={() => onNavigate({ kind: "project", id: item.id })}>
          <PiFolderSimpleDuotone className={styles.projectIcon} size={18} aria-hidden="true" /><span><strong>{item.name}</strong>{item.description && <small>{item.description}</small>}</span>
        </button></td>
        <td><code className={styles.key}>{item.key}</code></td>
        <td><ResponsibleName workspaceId={workspaceId} identityId={item.responsibleIdentityId ?? null} /></td>
        <td><PiCaretRight aria-hidden="true" /></td>
      </tr>)}
    </tbody>
  </table></div>;
}
