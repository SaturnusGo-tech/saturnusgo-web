import { transitionContent } from "../../../presentation/workspace/motion/transition/content-transition";
import { PiMagnifyingGlass, PiPlus } from "react-icons/pi";
import { AnimatedSelect } from "../../../presentation/common/select/AnimatedSelect";
import type { PortfolioCopy } from "../../model/copy";
import type { PortfolioTab } from "../../model/portfolio";
import type { usePortfoliosView } from "../../state/view/usePortfoliosView";
import { ResourceFeedback } from "../common/ResourceFeedback";
import { CatalogTable } from "./CatalogTable";
import styles from "../styles/portfolios.module.css";

export function PortfolioCatalog({ state, workspaceId, canManage, copy }: { state: ReturnType<typeof usePortfoliosView>; workspaceId: string; canManage: boolean; copy: PortfolioCopy }) {
  const query = state.search.trim().toLocaleLowerCase();
  const portfolios = state.portfolioList.items.filter((item) => item.name.toLocaleLowerCase().includes(query));
  const projects = state.projects.items.filter((item) => `${item.name} ${item.key}`.toLocaleLowerCase().includes(query));
  const loading = state.portfolioList.loading || state.projects.loading;
  const hasMore = Boolean(state.portfolioList.cursor || state.projects.cursor);
  const empty = !portfolios.length && !projects.length;
  const tabs: { id: PortfolioTab; label: string }[] = [{ id: "all", label: copy.all }, { id: "portfolios", label: copy.portfolios }, { id: "unassigned", label: copy.unassigned }];
  return <>
    <header className={styles.heading}><div><h1>{copy.title}</h1></div>
      <div className={styles.actions}>
        {canManage && <><button type="button" className={styles.secondary} onClick={state.createProject}><PiPlus />{copy.newProject}</button>
          <button type="button" className={styles.primary} onClick={() => state.navigate({ kind: "portfolio-create" })}><PiPlus />{copy.newPortfolio}</button></>}
      </div>
    </header>
    <nav className={styles.tabs} aria-label={copy.title}>{tabs.map((tab) => <button type="button" key={tab.id} aria-current={state.tab === tab.id ? "page" : undefined}
      onClick={() => transitionContent(() => state.setTab(tab.id))}>{tab.label}</button>)}</nav>
    <div className={styles.toolbar}><label className={styles.search} data-input-shell><PiMagnifyingGlass aria-hidden="true" /><input aria-label={copy.search} placeholder={copy.search} value={state.search} onChange={(event) => state.setSearch(event.target.value)} /></label>
      <AnimatedSelect compact label={copy.status} value={state.status} options={[{ value: "active", label: copy.active }, { value: "archived", label: copy.archived }]}
        onChange={(value) => state.setStatus(value as "active" | "archived")} />
    </div>
    <ResourceFeedback catalog hasContent={!empty} copy={copy} loading={loading} error={state.portfolioList.error ?? state.projects.error} retry={state.refresh} />
    {!empty && <CatalogTable portfolios={portfolios} projects={projects} workspaceId={workspaceId} copy={copy} onNavigate={state.navigate} />}
    {empty && !loading && !state.portfolioList.error && !state.projects.error && <section className={styles.empty}>
      <h2>{query ? copy.noResults : copy.emptyTitle}</h2>
      <p>{query ? copy.noResultsHint : copy.emptyHint}</p>
      {canManage && !query && <button type="button" className={styles.primary} onClick={() => state.navigate({ kind: "portfolio-create" })}><PiPlus />{copy.newPortfolio}</button>}
    </section>}
    {hasMore && <footer className={styles.listFooter}><button type="button" className={styles.secondary} disabled={loading}
      onClick={() => { state.portfolioList.loadMore(); state.projects.loadMore(); }}>{copy.loadMore}</button></footer>}
  </>;
}
