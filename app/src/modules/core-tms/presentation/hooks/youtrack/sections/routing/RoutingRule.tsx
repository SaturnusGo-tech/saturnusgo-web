import { Trash2 } from "lucide-react";
import { IntegrationCheckbox } from "../../../../common/integration-controls/checkbox/IntegrationCheckbox";
import { IntegrationButton } from "../../../../common/integration-controls/button/IntegrationButton";
import { IntegrationInput } from "../../../../common/integration-controls/input/IntegrationInput";
import { IntegrationSelect } from "../../../../common/integration-controls/select/IntegrationSelect";
import type { YouTrackConfigurationDraft, YouTrackMatcherField, YouTrackProject, YouTrackRouteDraft } from "../../../../../youtrack/model/youtrack-settings";
import type { HooksCopy } from "../../../shared/hooks-copy";
import surface from "../../../hooks.module.css";
import { ProjectSelect } from "./ProjectSelect";

export function RoutingRule({ route, projects, copy, loading, onUpdate, onSelectProject, russian = false }: {
  russian?: boolean; route: YouTrackRouteDraft; projects: readonly YouTrackProject[]; copy: HooksCopy; loading: boolean;
  onUpdate: (updater: (current: YouTrackConfigurationDraft) => YouTrackConfigurationDraft) => void;
  onSelectProject: (routeId: string, projectId: string) => void;
}) {
  const update = (change: (current: YouTrackRouteDraft) => YouTrackRouteDraft) =>
    onUpdate(current => ({ ...current, routes: current.routes.map(item => item.id === route.id ? change(item) : item) }));
  const label = `${copy.when} ${copy.matcherFields[route.match?.field ?? "component"]} “${route.match?.value || "…"}”`;
  return <div className={surface.routingRule}>
    <div className={surface.ruleHeading}>
      <IntegrationCheckbox isSelected={route.enabled} aria-label={`${copy.ruleEnabled}: ${label}`}
        onValueChange={enabled => update(current => ({ ...current, enabled }))}>{copy.ruleEnabled}</IntegrationCheckbox>
      <IntegrationButton isIconOnly variant="light" aria-label={`${copy.removeRule}: ${label}`}
        onPress={() => onUpdate(current => ({ ...current, routes: current.routes.filter(item => item.id !== route.id) }))}><Trash2 size={16}/></IntegrationButton>
    </div>
    <div className={surface.ruleCondition}>
      <IntegrationSelect label={copy.when} value={route.match?.field ?? "component"} isDisabled={!route.enabled}
        options={(["component", "tag"] as const).map(value => ({ value, label: copy.matcherFields[value] }))}
        onValueChange={field => update(current => ({ ...current, match: { field: field as YouTrackMatcherField, value: current.match?.value ?? "" } }))}/>
      <IntegrationInput label={russian ? "Тег или компонент" : "Tag or component"} aria-label={`${copy.matcherPlaceholder}: ${label}`}
        value={route.match?.value ?? ""} maxLength={255} isDisabled={!route.enabled} placeholder={copy.matcherPlaceholder}
        onValueChange={value => update(current => ({ ...current, match: { field: current.match?.field ?? "component", value } }))}/>
    </div>
    <div className={surface.ruleProject}><ProjectSelect value={route.project.id} projects={projects} copy={copy}
      loading={loading} disabled={!route.enabled} label={copy.sendTo} onChange={projectId => onSelectProject(route.id, projectId)}/></div>
  </div>;
}
