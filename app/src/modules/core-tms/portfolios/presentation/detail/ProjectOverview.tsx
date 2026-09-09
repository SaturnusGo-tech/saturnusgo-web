import { PiArrowRight, PiArrowSquareOut, PiFolderSimpleLight, PiPencilSimple } from "react-icons/pi";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { ResponsibleName } from "../../../workspace/members/presentation/ResponsibleName";
import type { PortfolioCopy } from "../../model/copy";
import type { usePortfoliosView } from "../../state/view/usePortfoliosView";
import { ResourceFeedback } from "../common/ResourceFeedback";
import styles from "../styles/portfolios.module.css";

export function ProjectOverview({ state, workspaceId, canManage, copy, onOpenCases }: {
  state: ReturnType<typeof usePortfoliosView>; workspaceId: string; canManage: boolean; copy: PortfolioCopy; onOpenCases: (id: string) => void;
}) {
  const { locale } = useTmsLocale();
  const project = state.project.data?.data;
  if (!project) return <ResourceFeedback loading={state.project.loading} error={state.project.error} copy={copy} retry={state.project.reload} />;
  const portfolio = state.portfolio.data?.data;
  return <>
    <header className={styles.heading}><PiFolderSimpleLight className={styles.titleIcon} size={36} aria-hidden="true" /><div>
      <h1>{project.name}<code className={styles.key}>{project.key}</code></h1><p>{project.description || copy.noDescription}</p>
    </div><div className={styles.actions}>
      <button type="button" className={styles.primary} onClick={() => onOpenCases(project.id)}><PiArrowSquareOut />{copy.openCases}</button>
      {canManage && project.status !== "archived" && <button type="button" className={styles.iconButton} title={copy.editProject} aria-label={copy.editProject} onClick={() => state.setDialog("project-edit")}><PiPencilSimple /></button>}
    </div></header>
    {project.status === "archived" && <p className={styles.status}>{copy.archived}</p>}
    <nav className={styles.tabs} aria-label={project.name}><button type="button" aria-current="page">{copy.aboutProject}</button>
      <button type="button" onClick={() => onOpenCases(project.id)}>{copy.cases}</button></nav>
    <div className={styles.detailGrid}><main>
      <section className={styles.about}><h2>{copy.description}</h2><p>{project.description || copy.noDescription}</p></section>
      <section className={styles.about}><h2>{copy.checksTitle}</h2><p>{copy.checksHint}</p>
        <button type="button" className={styles.repositoryLink} onClick={() => onOpenCases(project.id)}><PiFolderSimpleLight size={28} aria-hidden="true" /><span>{copy.cases}</span><PiArrowRight aria-hidden="true" /></button>
      </section>
    </main><aside className={styles.sidebar}><h2>{copy.aboutProject}</h2><dl>
      <dt>{copy.portfolio}</dt><dd>{project.portfolioId ? <button type="button" className={styles.textButton} onClick={() => state.navigate({ kind: "portfolio", id: project.portfolioId! })}>{portfolio?.name ?? copy.portfolio}</button> : copy.noPortfolio}</dd>
      <dt>{copy.responsible}</dt><dd><ResponsibleName workspaceId={workspaceId} identityId={project.responsibleIdentityId ?? null} /></dd>
      <dt>{copy.key}</dt><dd><code>{project.key}</code></dd>
      {project.createdAt && <><dt>{copy.created}</dt><dd>{new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(project.createdAt))}</dd></>}
    </dl><ResourceFeedback loading={state.portfolio.loading} error={state.portfolio.error} retry={state.portfolio.reload} copy={copy} /></aside></div>
  </>;
}
