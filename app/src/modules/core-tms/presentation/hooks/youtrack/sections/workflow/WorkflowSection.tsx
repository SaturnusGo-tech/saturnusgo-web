import type { YouTrackConfigurationDraft, YouTrackProject } from "../../../../../youtrack/model/youtrack-settings";
import surface from "../../../hooks.module.css";
import type { HooksCopy } from "../../../shared/hooks-copy";
import { SettingsSection } from "../../form/SettingsSection";
import { RouteWorkflow } from "./RouteWorkflow";

export function WorkflowSection({ copy, draft, projects, loadingProjectId, onUpdate }: {
  copy: HooksCopy;
  draft: YouTrackConfigurationDraft;
  projects: readonly YouTrackProject[];
  loadingProjectId: string | null;
  onUpdate: (updater: (current: YouTrackConfigurationDraft) => YouTrackConfigurationDraft) => void;
}) {
  return (
    <SettingsSection title={copy.workflow} description={copy.workflowHint}>
      {!draft.routes.some((route) => route.enabled && route.project.id) && <p className={surface.webhookEmpty}>
        {copy.workflowEmpty}
      </p>}
      <div className={surface.workflowRoutes}>
        {draft.routes.filter((route) => route.enabled && route.project.id).map((route) => (
          <RouteWorkflow key={route.id} copy={copy} route={route}
            project={projects.find((candidate) => candidate.id === route.project.id)}
            loading={loadingProjectId === route.project.id}
            onUpdate={(updater) => onUpdate((current) => ({ ...current,
              routes: current.routes.map((item) => item.id === route.id ? updater(item) : item),
            }))} />
        ))}
      </div>
    </SettingsSection>
  );
}
