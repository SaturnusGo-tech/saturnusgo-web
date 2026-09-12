import { useId } from "react";
import { useProjectTab } from "../navigation/project/useProjectTab";
import { PiCaretRight } from "react-icons/pi";
import { formatTmsMutationFailure } from "../../../../core/tms/errors/mutation-failure";
import { useTmsLocale } from "../../localization/context/useTmsLocale";
import { FormError } from "../../presentation/common/error/FormError";
import { portfolioCopy } from "../model/copy";
import { usePortfoliosView, type PortfoliosViewProps } from "../state/view/usePortfoliosView";
import { PortfolioCatalog } from "./catalog/PortfolioCatalog";
import { PortfolioDetail } from "./detail/PortfolioDetail";
import { ProjectOverview } from "./detail/ProjectOverview";
import { PortfolioEditorPage } from "./editor/PortfolioEditorPage";
import { ProjectEditorPage } from "./editor/ProjectEditorPage";
import { ArchivePortfolioDialog } from "./dialog/ArchivePortfolioDialog";
import { AttachProjectDialog } from "./attach/AttachProjectDialog";
import styles from "./styles/portfolios.module.css";

export function PortfoliosView(props: PortfoliosViewProps) {
  const actionsTargetId = useId();
  const { locale } = useTmsLocale();
  const copy = portfolioCopy(locale);
  const state = usePortfoliosView(props);
  const projectNavigation = useProjectTab(state.route.kind === "project" ? state.route.id : "");
  const canManage = props.canManage !== false && !props.offline;
  const attachmentPermissions = { canReadAttachments: props.canReadAttachments === true && !props.offline, canManageAttachments: props.canManageAttachments === true && !props.offline };
  const currentPortfolio = state.portfolio.data?.data;
  const project = state.project.data;
  const close = () => state.setDialog(null);
  const creatingProject = state.route.kind === "project-create";
  const creatingPortfolio = state.route.kind === "portfolio-create";
  const creationPortfolioId = state.route.kind === "project-create" ? state.route.portfolioId : undefined;
  const editing = creatingPortfolio || creatingProject;
  const casesScreen = !editing && state.route.kind === "project" && projectNavigation.tab === "cases";
  return <section className={`${styles.page} ${casesScreen ? styles.casesPage : ""}`} data-testid="portfolios-view">
    <div className={styles.breadcrumbs} hidden={casesScreen}>
      <button type="button" onClick={() => state.navigate({ kind: "catalog" })}>{copy.title}</button>
      {currentPortfolio && state.route.kind !== "catalog" && <><PiCaretRight aria-hidden="true" /><button type="button" onClick={() => state.navigate({ kind: "portfolio", id: currentPortfolio.id })}>{currentPortfolio.name}</button></>}
      {project?.data && state.route.kind === "project" && <><PiCaretRight aria-hidden="true" /><span>{project.data.name}</span></>}
      {(creatingProject || creatingPortfolio) && <><PiCaretRight aria-hidden="true" /><span>{creatingProject ? copy.newProject : copy.newPortfolio}</span></>}
      <div id={actionsTargetId} className={styles.editorActionSlot} />
    </div>
    {props.offline ? <FormError message={copy.offline} /> : <>
      {!casesScreen && state.notice && <p className={styles.notice} role="status">{state.notice === "project" ? copy.projectSaved : copy.portfolioSaved}</p>}
      {!editing && state.route.kind === "catalog" && <PortfolioCatalog state={state} copy={copy} workspaceId={props.workspaceId} canManage={canManage} />}
      {!editing && state.route.kind === "portfolio" && <PortfolioDetail actionsTargetId={actionsTargetId} {...attachmentPermissions} key={state.route.id} state={state} copy={copy} workspaceId={props.workspaceId} canManage={canManage} />}
      {!editing && state.route.kind === "project" && <ProjectOverview navigation={projectNavigation} {...attachmentPermissions} key={state.route.id} projectId={state.route.id} state={state} copy={copy} workspaceId={props.workspaceId}
        canManage={canManage} onActivateProject={props.onActivateProject} projectCases={props.projectCases} />}
      {editing && !canManage && <FormError message={copy.permission} />}
      {state.command.error && !state.dialog && <FormError message={formatTmsMutationFailure(state.command.error, copy.saveError)} />}
    </>}
    {canManage && creatingPortfolio && <PortfolioEditorPage actionsTargetId={actionsTargetId} {...attachmentPermissions}
      key="new" workspaceId={props.workspaceId} copy={copy} pending={state.command.pending} error={state.command.error}
      onCancel={state.cancelEditor} onSave={state.save} />}
    {canManage && creatingProject && <ProjectEditorPage actionsTargetId={actionsTargetId} {...attachmentPermissions}
      key={`new:${creationPortfolioId ?? ""}`} workspaceId={props.workspaceId} copy={copy}
      portfolioId={creationPortfolioId ?? currentPortfolio?.id} portfolioName={currentPortfolio?.name} onCancel={state.cancelEditor} onCreated={state.created} onUpdated={state.updated} />}
    {canManage && state.dialog === "attach" && <AttachProjectDialog workspaceId={props.workspaceId} copy={copy} pending={state.command.pending}
      error={state.command.error} onClose={close} onAttach={state.attach} />}
    {canManage && state.dialog === "archive" && <ArchivePortfolioDialog copy={copy} pending={state.command.pending} error={state.command.error} onClose={close} onConfirm={state.transition} />}
  </section>;
}
