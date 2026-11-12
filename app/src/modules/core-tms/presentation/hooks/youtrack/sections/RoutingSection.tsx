import { Plus } from "lucide-react";

import {
  createEmptyRoute,
  type YouTrackConfigurationDraft,
  type YouTrackProject,
} from "../../../../youtrack/model/youtrack-settings";
import surface from "../../hooks.module.css";
import type { HooksCopy } from "../../shared/hooks-copy";
import { SettingsSection } from "../form/SettingsSection";

import { IntegrationButton } from "../../../common/integration-controls/button/IntegrationButton";
import { RoutingRule } from "./routing/RoutingRule";
import { ProjectSelect } from "./routing/ProjectSelect";

type UpdateDraft = (updater: (current: YouTrackConfigurationDraft) => YouTrackConfigurationDraft) => void;

export function RoutingSection({ copy, draft, projects, loadingProjectId, onUpdate, onSelectProject, russian = false }: {
  copy: HooksCopy;
  russian?: boolean;
  draft: YouTrackConfigurationDraft;
  projects: readonly YouTrackProject[];
  loadingProjectId: string | null;
  onUpdate: UpdateDraft;
  onSelectProject: (routeId: string, projectId: string) => void;
}) {
  const defaultRoute = draft.routes.find((route) => route.isDefault) ?? draft.routes[0];
  const rules = draft.routes.filter((route) => route.id !== defaultRoute?.id);
  return (
    <SettingsSection title={copy.routing} description={copy.routingHint}>
      {defaultRoute ? <div className={surface.defaultRoute}>
          <ProjectSelect value={defaultRoute.project.id} projects={projects} copy={copy}
            label={copy.defaultProject}
            loading={loadingProjectId === defaultRoute.project.id}
            onChange={(projectId) => onSelectProject(defaultRoute.id, projectId)} />
      </div> : null}
      <div className={surface.rulesHeading}>
        <strong>{copy.rules}</strong>
        <IntegrationButton variant="light" isDisabled={draft.routes.length >= 50}
          title={draft.routes.length >= 50 ? copy.routeLimit : undefined}
          onPress={() => onUpdate((current) => ({
          ...current, routes: [...current.routes, createEmptyRoute(`route-${crypto.randomUUID()}`)],
        }))}>
          <Plus size={15} aria-hidden="true" />{copy.addRule}
        </IntegrationButton>
      </div>
      {rules.length === 0 ? <p className={surface.emptyRules}>{copy.noRules}</p> : (
        <div className={surface.routingRules}>
          {rules.map((route) => <RoutingRule key={route.id} russian={russian} route={route} projects={projects} copy={copy}
            loading={loadingProjectId === route.project.id} onUpdate={onUpdate}
            onSelectProject={onSelectProject} />)}
        </div>
      )}
    </SettingsSection>
  );
}
