import { ArrowRight, Plus, Trash2 } from "lucide-react";

import {
  createEmptyRoute,
  type YouTrackConfigurationDraft,
  type YouTrackMatcherField,
  type YouTrackProject,
  type YouTrackRouteDraft,
} from "../../../../youtrack/model/youtrack-settings";
import surface from "../../hooks.module.css";
import type { HooksCopy } from "../../shared/hooks-copy";
import { SettingsSection } from "../form/SettingsSection";

type UpdateDraft = (updater: (current: YouTrackConfigurationDraft) => YouTrackConfigurationDraft) => void;

export function RoutingSection({ copy, draft, projects, loadingProjectId, onUpdate, onSelectProject }: {
  copy: HooksCopy;
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
        <label className={surface.field}>
          <span>{copy.defaultProject}</span>
          <ProjectSelect value={defaultRoute.project.id} projects={projects} copy={copy}
            label={copy.defaultProject}
            loading={loadingProjectId === defaultRoute.project.id}
            onChange={(projectId) => onSelectProject(defaultRoute.id, projectId)} />
        </label>
      </div> : null}
      <div className={surface.rulesHeading}>
        <strong>{copy.rules}</strong>
        <button type="button" className={surface.inlineAction} disabled={draft.routes.length >= 50}
          title={draft.routes.length >= 50 ? copy.routeLimit : undefined}
          onClick={() => onUpdate((current) => ({
          ...current, routes: [...current.routes, createEmptyRoute(`route-${crypto.randomUUID()}`)],
        }))}>
          <Plus size={15} aria-hidden="true" />{copy.addRule}
        </button>
      </div>
      {rules.length === 0 ? <p className={surface.emptyRules}>{copy.noRules}</p> : (
        <div className={surface.routingRules}>
          {rules.map((route) => <RoutingRule key={route.id} route={route} projects={projects} copy={copy}
            loading={loadingProjectId === route.project.id} onUpdate={onUpdate}
            onSelectProject={onSelectProject} />)}
        </div>
      )}
    </SettingsSection>
  );
}

function RoutingRule({ route, projects, copy, loading, onUpdate, onSelectProject }: {
  route: YouTrackRouteDraft;
  projects: readonly YouTrackProject[];
  copy: HooksCopy;
  loading: boolean;
  onUpdate: UpdateDraft;
  onSelectProject: (routeId: string, projectId: string) => void;
}) {
  const update = (updater: (route: YouTrackRouteDraft) => YouTrackRouteDraft) =>
    onUpdate((current) => updateRoute(current, route.id, updater));
  const label = `${copy.when} ${copy.matcherFields[route.match?.field ?? "component"]} “${route.match?.value || "…"}”`;
  return (
    <div className={surface.routingRule} data-disabled={route.enabled ? undefined : "true"}>
      <label className={surface.ruleToggle} title={copy.ruleEnabled}>
        <input type="checkbox" checked={route.enabled}
          aria-label={`${copy.ruleEnabled}: ${label}`}
          onChange={(event) => update((item) => ({ ...item, enabled: event.target.checked }))} />
      </label>
      <span>{copy.when}</span>
      <select aria-label={`${copy.when}: ${label}`} value={route.match?.field ?? "component"} disabled={!route.enabled}
        onChange={(event) => update((item) => ({ ...item,
          match: { field: event.target.value as YouTrackMatcherField, value: item.match?.value ?? "" },
        }))}>
        <option value="component">{copy.matcherFields.component}</option>
        <option value="tag">{copy.matcherFields.tag}</option>
      </select>
      <input aria-label={`${copy.matcherPlaceholder}: ${label}`} value={route.match?.value ?? ""}
        maxLength={255} disabled={!route.enabled}
        placeholder={copy.matcherPlaceholder}
        onChange={(event) => update((item) => ({ ...item,
          match: { field: item.match?.field ?? "component", value: event.target.value },
        }))} />
      <ArrowRight size={15} aria-hidden="true" />
      <ProjectSelect value={route.project.id} projects={projects} copy={copy}
        loading={loading} disabled={!route.enabled} label={`${copy.sendTo}: ${label}`}
        onChange={(projectId) => onSelectProject(route.id, projectId)} />
      <button type="button" className={surface.iconButton} aria-label={`${copy.removeRule}: ${label}`}
        onClick={() => onUpdate((current) => ({
          ...current, routes: current.routes.filter((candidate) => candidate.id !== route.id),
        }))}>
        <Trash2 size={15} aria-hidden="true" />
      </button>
    </div>
  );
}

function ProjectSelect({ value, projects, copy, label, loading, disabled = false, onChange }: {
  value: string;
  projects: readonly YouTrackProject[];
  copy: HooksCopy;
  label: string;
  loading: boolean;
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <select value={value} aria-label={label} disabled={disabled || projects.length === 0 || loading}
      onChange={(event) => onChange(event.target.value)}>
      {!value ? <option value="">{loading ? copy.loadingProject : copy.chooseProject}</option> : null}
      {projects.map((project) => (
        <option key={project.id} value={project.id}>{project.name} · {project.shortName}</option>
      ))}
    </select>
  );
}

function updateRoute(
  draft: YouTrackConfigurationDraft,
  routeId: string,
  updater: (route: YouTrackRouteDraft) => YouTrackRouteDraft,
): YouTrackConfigurationDraft {
  return { ...draft, routes: draft.routes.map((route) => route.id === routeId ? updater(route) : route) };
}
