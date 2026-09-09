import { useState } from "react";
import { PiArchive, PiBriefcaseLight, PiPencilSimple, PiPlus, PiArrowCounterClockwise } from "react-icons/pi";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { ResponsibleName } from "../../../workspace/members/presentation/ResponsibleName";
import type { PortfolioCopy } from "../../model/copy";
import type { usePortfoliosView } from "../../state/view/usePortfoliosView";
import { CatalogTable } from "../catalog/CatalogTable";
import { ResourceFeedback } from "../common/ResourceFeedback";
import styles from "../styles/portfolios.module.css";

export function PortfolioDetail({ state, workspaceId, canManage, copy }: { state: ReturnType<typeof usePortfoliosView>; workspaceId: string; canManage: boolean; copy: PortfolioCopy }) {
  const [tab, setTab] = useState<"about" | "projects">("projects");
  const { locale } = useTmsLocale();
  const portfolio = state.portfolio.data?.data;
  if (!portfolio) return <ResourceFeedback loading={state.portfolio.loading} error={state.portfolio.error} copy={copy} retry={state.portfolio.reload} />;
  const active = portfolio.status === "active";
  const projects = state.projects.items.filter((item) => `${item.name} ${item.key}`.toLocaleLowerCase().includes(state.search.trim().toLocaleLowerCase()));
  return <>
    <header className={styles.heading}><PiBriefcaseLight className={styles.titleIcon} size={34} aria-hidden="true" /><div><h1>{portfolio.name}</h1><p>{portfolio.description || copy.noDescription}</p></div>
      {canManage && <div className={styles.actions}>
        {active && <button type="button" className={styles.secondary} onClick={() => state.setDialog("portfolio-edit")}><PiPencilSimple />{copy.change}</button>}
        <button type="button" className={styles.iconButton} disabled={state.command.pending || !state.portfolio.data?.etag}
          aria-label={active ? copy.archive : copy.restore} title={active ? copy.archive : copy.restore}
          onClick={() => active ? state.setDialog("archive") : void state.transition()}>{active ? <PiArchive /> : <PiArrowCounterClockwise />}</button>
      </div>}
    </header>
    {!active && <p className={styles.status}>{copy.archived}</p>}
    <div className={styles.detailGrid}><main>
      <nav className={styles.tabs} aria-label={portfolio.name}>
        <button type="button" aria-current={tab === "about" ? "page" : undefined} onClick={() => setTab("about")}>{copy.aboutPortfolio}</button>
        <button type="button" aria-current={tab === "projects" ? "page" : undefined} onClick={() => setTab("projects")}>{copy.projects}</button>
      </nav>
      {tab === "about" ? <section className={styles.about}><h2>{copy.description}</h2><p>{portfolio.description || copy.noDescription}</p>
        <button type="button" className={styles.textButton} onClick={() => setTab("projects")}>{copy.projects} · {portfolio.projectCount}</button>
      </section> : <>
        <div className={styles.toolbar}><label className={styles.search} data-input-shell><input aria-label={copy.searchProject} placeholder={copy.searchProject} value={state.search} onChange={(event) => state.setSearch(event.target.value)} /></label>
          {canManage && active && <div className={styles.actions}>
            <button type="button" className={styles.primary} onClick={() => state.setDialog("project-create")}><PiPlus />{copy.newProject}</button>
            <button type="button" className={styles.secondary} onClick={() => state.setDialog("attach")}><PiPlus />{copy.attach}</button>
          </div>}
        </div>
        <ResourceFeedback loading={state.projects.loading} error={state.projects.error} copy={copy} retry={state.projects.reload} />
        {projects.length > 0 && <CatalogTable portfolios={[]} projects={projects} workspaceId={workspaceId} copy={copy} onNavigate={state.navigate} />}
        {!projects.length && !state.projects.loading && !state.projects.error && <section className={styles.empty}><PiBriefcaseLight size={52} aria-hidden="true" />
          <h2>{state.search ? copy.noResults : copy.emptyPortfolio}</h2><p>{state.search ? copy.noResultsHint : copy.emptyPortfolioHint}</p>
        </section>}
        {state.projects.cursor && <button type="button" className={styles.secondary} disabled={state.projects.loading} onClick={state.projects.loadMore}>{copy.loadMore}</button>}
      </>}
    </main><aside className={styles.sidebar}><h2>{copy.aboutPortfolio}</h2><dl>
      <dt>{copy.responsible}</dt><dd><ResponsibleName workspaceId={workspaceId} identityId={portfolio.responsibleIdentityId} /></dd>
      <dt>{copy.projects}</dt><dd>{portfolio.projectCount}</dd>
      <dt>{copy.created}</dt><dd>{new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(portfolio.createdAt))}</dd>
    </dl></aside></div>
  </>;
}
