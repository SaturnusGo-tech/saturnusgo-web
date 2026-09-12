import { OrganizationExtras } from "../../management/presentation/extras/OrganizationExtras";
import { WorkflowSelect } from "../../management/presentation/WorkflowSelect";
import { organizationCopy } from "../../management/model/copy";
import { ManagementFeedback } from "../../management/presentation/feedback/ManagementFeedback";
import { useOrganizationManagement } from "../../management/state/useOrganizationManagement";
import { InlineOrganizationTitle } from "../inline/InlineOrganizationTitle";
import { InlineOrganizationMarkdown } from "../inline/InlineOrganizationMarkdown";
import { InlineProjectPortfolio } from "../inline/project/InlineProjectPortfolio";
import type { ReactNode } from "react";
import { PiFolderSimpleDuotone } from "react-icons/pi";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { ResponsiblePicker } from "../../../workspace/members/presentation/ResponsiblePicker";
import { FormError } from "../../../presentation/common/error/FormError";
import type { PortfolioCopy } from "../../model/copy";
import type { usePortfoliosView } from "../../state/view/usePortfoliosView";
import { useProjectActivation } from "../../state/project/useProjectActivation";
import { useProjectTab } from "../../navigation/project/useProjectTab";
import { OrganizationDiscussion } from "../../discussion/presentation/OrganizationDiscussion";
import { ResourceFeedback } from "../common/ResourceFeedback";
import styles from "../styles/portfolios.module.css";

export function ProjectOverview({ navigation, state, projectId, workspaceId, canManage, canManageAttachments, canReadAttachments, copy, projectCases, onActivateProject }: {
  navigation: ReturnType<typeof useProjectTab>; state: ReturnType<typeof usePortfoliosView>; projectId: string; workspaceId: string; canManage: boolean; canManageAttachments: boolean; canReadAttachments: boolean; copy: PortfolioCopy;
  projectCases: ReactNode; onActivateProject: (id: string) => Promise<boolean>;
}) {
  const { locale } = useTmsLocale();
  const activation = useProjectActivation(workspaceId, projectId, onActivateProject);
  const target = { workspaceId, targetType: "project" as const, targetId: projectId };
  const management = useOrganizationManagement(target, state.project.data, canManage,
    (result) => { if (result.kind === "project") state.acceptProject(result.data, result.etag); else state.portfolio.accept(result); }, state.project.reload);
  const project = state.project.data?.data;
  if (!project) return <ResourceFeedback loading={state.project.loading} error={state.project.error} copy={copy} retry={state.project.reload} />;
  const portfolio = state.portfolio.data?.data;
  return <>
    <header hidden={navigation.tab === "cases"} className={styles.heading}><PiFolderSimpleDuotone className={styles.projectIcon} size={24} aria-hidden="true" />
      <InlineOrganizationTitle value={project.name} label={copy.projectName} disabled={management.disabled || navigation.tab !== "overview"} onSave={name => management.save({ name })} />
      <code className={styles.key}>{project.key}</code>
    </header>
    <ResourceFeedback hasContent loading={state.project.loading} error={state.project.error} copy={copy} retry={state.project.reload} />
    {project.status === "archived" && <p className={styles.status}>{copy.archived}</p>}
    <nav hidden={navigation.tab === "cases"} className={styles.tabs} aria-label={project.name}>
      <button type="button" aria-current={navigation.tab === "overview" ? "page" : undefined} onClick={() => navigation.select("overview")}>{copy.overview}</button>
      <button type="button" aria-current={navigation.tab === "cases" ? "page" : undefined} onClick={() => navigation.select("cases")}>{copy.cases}</button>
    </nav>
    <div hidden={navigation.tab !== "overview"}>
      <div className={styles.stackedDetail}><main>
        <InlineOrganizationMarkdown label={copy.description} value={project.description ?? ""} placeholder={copy.noDescription} disabled={management.disabled} onSave={description => management.save({ description })} />
        <OrganizationExtras target={target} canReadAttachments={canReadAttachments} canManageAttachments={canManageAttachments && project.status !== "archived"}
          items={project.checklist ?? []} pending={management.pending} readOnly={management.disabled && !management.pending} onChange={(checklist) => management.save({ checklist })} />
        <ManagementFeedback state={management} />
        <InlineOrganizationMarkdown label={copy.testingPlan} value={project.testingPlan ?? ""} placeholder={copy.planEmpty} disabled={management.disabled} onSave={testingPlan => management.save({ testingPlan })} />
        <aside className={styles.sidebar} aria-label={copy.properties}><dl>
        <dt>{organizationCopy(locale).phase}</dt><dd><WorkflowSelect value={project.workflowPhase ?? "new"} disabled={management.disabled} onChange={(workflowPhase) => void management.save({ workflowPhase })} /></dd>
        <dt>{copy.portfolio}</dt><dd><InlineProjectPortfolio workspaceId={workspaceId} value={project.portfolioId ?? null} name={portfolio?.name} disabled={management.disabled} copy={copy} onChange={portfolioId => void management.save({ portfolioId })} /></dd>
        <dt>{copy.responsible}</dt><dd><div className={styles.inlineResponsible}><ResponsiblePicker workspaceId={workspaceId} value={project.responsibleIdentityId ?? null} disabled={management.disabled} onChange={responsibleIdentityId => void management.save({ responsibleIdentityId })} /></div></dd>
        <dt>{copy.key}</dt><dd><code>{project.key}</code></dd>
        {project.createdAt && <><dt>{copy.created}</dt><dd>{new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(project.createdAt))}</dd></>}
      </dl><ResourceFeedback loading={state.portfolio.loading} error={state.portfolio.error} retry={state.portfolio.reload} copy={copy} /></aside>
        <OrganizationDiscussion workspaceId={workspaceId} targetType="project" targetId={project.id} canPost={canManage && project.status !== "archived"}
          workflowPhase={project.workflowPhase ?? "new"} phaseDisabled={management.disabled} onPhaseChange={(workflowPhase) => void management.save({ workflowPhase })} />
      </main></div>
    </div>
    <div className={styles.casesBody} hidden={navigation.tab !== "cases"}>
      {activation.phase === "loading" && <p className={styles.loading} role="status">{copy.loading}</p>}
      {activation.phase === "error" && <div className={styles.error}><FormError message={copy.projectActivationError} />
        <button type="button" className={styles.secondary} onClick={activation.retry}>{copy.retry}</button></div>}
      {activation.phase === "ready" && <div className={styles.projectRepository}>{projectCases}</div>}
    </div>
  </>;
}
