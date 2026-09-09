import { PiArrowClockwise, PiCaretRight } from "react-icons/pi";
import { formatTmsMutationFailure } from "../../../../core/tms/errors/mutation-failure";
import { useTmsLocale } from "../../localization/context/useTmsLocale";
import { ProjectDialog } from "../../presentation/dialogs/project/ProjectDialog";
import { FormError } from "../../presentation/common/error/FormError";
import { portfolioCopy } from "../model/copy";
import { usePortfoliosView, type PortfoliosViewProps } from "../state/view/usePortfoliosView";
import { PortfolioCatalog } from "./catalog/PortfolioCatalog";
import { PortfolioDetail } from "./detail/PortfolioDetail";
import { ProjectOverview } from "./detail/ProjectOverview";
import { PortfolioDialog } from "./dialog/PortfolioDialog";
import { ArchivePortfolioDialog } from "./dialog/ArchivePortfolioDialog";
import { AttachProjectDialog } from "./attach/AttachProjectDialog";
import styles from "./styles/portfolios.module.css";

export function PortfoliosView(props: PortfoliosViewProps) {
  const { locale } = useTmsLocale();
  const copy = portfolioCopy(locale);
  const state = usePortfoliosView(props);
  const canManage = props.canManage !== false && !props.offline;
  const currentPortfolio = state.portfolio.data?.data;
  const project = state.project.data;
  const close = () => state.setDialog(null);
  const creatingProject = state.dialog === "project-create";
  return <section className={styles.page} data-testid="portfolios-view">
    <div className={styles.breadcrumbs}>
      <button type="button" onClick={() => state.navigate({ kind: "catalog" })}>{copy.title}</button>
      {currentPortfolio && state.route.kind !== "catalog" && <><PiCaretRight aria-hidden="true" /><button type="button" onClick={() => state.navigate({ kind: "portfolio", id: currentPortfolio.id })}>{currentPortfolio.name}</button></>}
      {project?.data && state.route.kind === "project" && <><PiCaretRight aria-hidden="true" /><span>{project.data.name}</span></>}
      <button type="button" className={styles.refresh} disabled={props.offline} title={copy.refresh} aria-label={copy.refresh} onClick={state.refresh}><PiArrowClockwise /></button>
    </div>
    {props.offline ? <FormError message={copy.offline} /> : <>
      {state.notice && <p className={styles.notice} role="status">{state.notice === "project" ? copy.projectSaved : copy.portfolioSaved}</p>}
      {state.route.kind === "catalog" && <PortfolioCatalog state={state} copy={copy} workspaceId={props.workspaceId} canManage={canManage} />}
      {state.route.kind === "portfolio" && <PortfolioDetail key={state.route.id} state={state} copy={copy} workspaceId={props.workspaceId} canManage={canManage} />}
      {state.route.kind === "project" && <ProjectOverview state={state} copy={copy} workspaceId={props.workspaceId} canManage={canManage} onOpenCases={props.onOpenCases} />}
      {state.command.error && !state.dialog && <FormError message={formatTmsMutationFailure(state.command.error, copy.saveError)} />}
    </>}
    {canManage && (state.dialog === "portfolio-create" || state.dialog === "portfolio-edit" && currentPortfolio) && <PortfolioDialog
      key={state.dialog === "portfolio-edit" ? currentPortfolio?.id : "new"} workspaceId={props.workspaceId} current={state.dialog === "portfolio-edit" ? currentPortfolio : undefined}
      copy={copy} pending={state.command.pending} error={state.command.error} onClose={close} onSave={state.save} />}
    {canManage && (creatingProject || state.dialog === "project-edit" && project) && <ProjectDialog
      key={creatingProject ? `new:${currentPortfolio?.id ?? ""}` : project?.data.id} workspaceId={props.workspaceId} offline={props.offline}
      project={creatingProject ? undefined : project?.data} projectEtag={creatingProject ? undefined : project?.etag}
      portfolioId={currentPortfolio?.id} portfolioName={currentPortfolio?.name} onClose={close} onCreated={state.created} onUpdated={state.updated} />}
    {canManage && state.dialog === "attach" && <AttachProjectDialog workspaceId={props.workspaceId} copy={copy} pending={state.command.pending}
      error={state.command.error} onClose={close} onAttach={state.attach} />}
    {canManage && state.dialog === "archive" && <ArchivePortfolioDialog copy={copy} pending={state.command.pending} error={state.command.error} onClose={close} onConfirm={state.transition} />}
  </section>;
}
