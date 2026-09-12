import { OrganizationExtras } from "../../management/presentation/extras/OrganizationExtras";
import { WorkflowSelect } from "../../management/presentation/WorkflowSelect";
import { organizationCopy } from "../../management/model/copy";
import { ManagementFeedback } from "../../management/presentation/feedback/ManagementFeedback";
import { useOrganizationManagement } from "../../management/state/useOrganizationManagement";
import { MarkdownField } from "../../../presentation/cases/inspector/markdown/MarkdownField";
import { PiArchive, PiBriefcaseDuotone, PiPencilSimple, PiPlus, PiArrowCounterClockwise } from "react-icons/pi";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { ResponsibleName } from "../../../workspace/members/presentation/ResponsibleName";
import type { PortfolioCopy } from "../../model/copy";
import type { usePortfoliosView } from "../../state/view/usePortfoliosView";
import { CatalogTable } from "../catalog/CatalogTable";
import { ResourceFeedback } from "../common/ResourceFeedback";
import { OrganizationDiscussion } from "../../discussion/presentation/OrganizationDiscussion";
import { usePortfolioTab } from "../../navigation/portfolio/usePortfolioTab";
import styles from "../styles/portfolios.module.css";

export function PortfolioDetail({ state, workspaceId, canManage, canManageAttachments, canReadAttachments, copy }: { state: ReturnType<typeof usePortfoliosView>; workspaceId: string; canManage: boolean; canManageAttachments: boolean; canReadAttachments: boolean; copy: PortfolioCopy }) {
  const { tab, select: setTab } = usePortfolioTab(state.route.kind === "portfolio" ? state.route.id : "");
  const { locale } = useTmsLocale();
  const target = { workspaceId, targetType: "portfolio" as const, targetId: state.route.kind === "portfolio" ? state.route.id : "" };
  const management = useOrganizationManagement(target, state.portfolio.data, canManage,
    (result) => { if (result.kind === "project") state.acceptProject(result.data, result.etag); else state.portfolio.accept(result); }, state.portfolio.reload);
  const portfolio = state.portfolio.data?.data;
  if (!portfolio) return <ResourceFeedback loading={state.portfolio.loading} error={state.portfolio.error} copy={copy} retry={state.portfolio.reload} />;
  const active = portfolio.status === "active";
  const projects = state.projects.items.filter((item) => `${item.name} ${item.key}`.toLocaleLowerCase().includes(state.search.trim().toLocaleLowerCase()));
  return <>
    <header className={styles.heading}><PiBriefcaseDuotone className={styles.portfolioIcon} size={24} aria-hidden="true" /><div><h1>{portfolio.name}</h1></div>
      {canManage && <div className={styles.actions}>
        {active && <button type="button" className={styles.secondary} onClick={() => state.setDialog("portfolio-edit")}><PiPencilSimple />{copy.change}</button>}
        <button type="button" className={styles.iconButton} disabled={state.command.pending || !state.portfolio.data?.etag}
          aria-label={active ? copy.archive : copy.restore} title={active ? copy.archive : copy.restore}
          onClick={() => active ? state.setDialog("archive") : void state.transition()}>{active ? <PiArchive /> : <PiArrowCounterClockwise />}</button>
      </div>}
    </header>
    <ResourceFeedback hasContent loading={state.portfolio.loading} error={state.portfolio.error} copy={copy} retry={state.portfolio.reload} />
    {!active && <p className={styles.status}>{copy.archived}</p>}
    <nav className={styles.tabs} aria-label={portfolio.name}>
        <button type="button" aria-current={tab === "about" ? "page" : undefined} onClick={() => setTab("about")}>{copy.aboutPortfolio}</button>
        <button type="button" aria-current={tab === "projects" ? "page" : undefined} onClick={() => setTab("projects")}>{copy.projects}</button>
    </nav>
    <div className={tab === "about" ? styles.stackedDetail : undefined}><main>
      {tab === "about" ? <><section className={styles.about}><h2>{copy.description}</h2><MarkdownField label={copy.description} value={portfolio.description ?? ""} emptyLabel={copy.noDescription} allowAttachments={false} /></section>
        <OrganizationExtras target={target} canReadAttachments={canReadAttachments} canManageAttachments={canManageAttachments && portfolio.status !== "archived"}
          items={portfolio.checklist ?? []} pending={management.pending} readOnly={management.disabled && !management.pending} onChange={(checklist) => management.save({ checklist })} />
        <ManagementFeedback state={management} />
        <aside className={styles.sidebar} aria-label={copy.properties}><dl>
        <dt>{organizationCopy(locale).phase}</dt><dd><WorkflowSelect value={portfolio.workflowPhase ?? "new"} disabled={management.disabled} onChange={(workflowPhase) => void management.save({ workflowPhase })} /></dd>
      <dt>{copy.responsible}</dt><dd><ResponsibleName workspaceId={workspaceId} identityId={portfolio.responsibleIdentityId} /></dd>
      <dt>{copy.projects}</dt><dd>{portfolio.projectCount}</dd>
      <dt>{copy.created}</dt><dd>{new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(portfolio.createdAt))}</dd>
    </dl></aside>
        <OrganizationDiscussion workspaceId={workspaceId} targetType="portfolio" targetId={portfolio.id} canPost={canManage && active}
          workflowPhase={portfolio.workflowPhase} phaseDisabled={management.disabled} onPhaseChange={(workflowPhase) => void management.save({ workflowPhase })} />
      </> : <>
        <div className={styles.toolbar}><label className={styles.search} data-input-shell><input aria-label={copy.searchProject} placeholder={copy.searchProject} value={state.search} onChange={(event) => state.setSearch(event.target.value)} /></label>
          {canManage && active && <div className={styles.actions}>
            {(projects.length > 0 || Boolean(state.search)) && <button type="button" className={styles.primary} onClick={state.createProject}><PiPlus />{copy.newProject}</button>}
            <button type="button" className={styles.secondary} onClick={() => state.setDialog("attach")}><PiPlus />{copy.attach}</button>
          </div>}
        </div>
        <ResourceFeedback hasContent={state.projects.items.length > 0} loading={state.projects.loading} error={state.projects.error} copy={copy} retry={state.projects.reload} />
        {projects.length > 0 && <CatalogTable portfolios={[]} projects={projects} workspaceId={workspaceId} copy={copy} onNavigate={state.navigate} />}
        {!projects.length && !state.projects.loading && !state.projects.error && <section className={styles.empty}>
          <h2>{state.search ? copy.noResults : copy.emptyPortfolio}</h2><p>{state.search ? copy.noResultsHint : copy.emptyPortfolioHint}</p>
          {!state.search && canManage && active && <button type="button" className={styles.primary} onClick={state.createProject}><PiPlus />{copy.newProject}</button>}
        </section>}
        {state.projects.cursor && <button type="button" className={styles.secondary} disabled={state.projects.loading} onClick={state.projects.loadMore}>{copy.loadMore}</button>}
      </>}
    </main></div>
  </>;
}
