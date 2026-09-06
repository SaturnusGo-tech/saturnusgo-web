import { ChevronDown } from "lucide-react";

import {
  statusLabel,
  type YouTrackConfigurationDraft,
  type YouTrackInboundWorkflow,
  type YouTrackProject,
  type YouTrackRouteDraft,
  type YouTrackStateField,
  type YouTrackStatus,
} from "../../../../../youtrack/model/youtrack-settings";
import surface from "../../../hooks.module.css";
import type { HooksCopy } from "../../../shared/hooks-copy";
import { SettingsSection } from "../../form/SettingsSection";

type InboundKey = keyof YouTrackInboundWorkflow;
type OutboundKey = keyof YouTrackRouteDraft["workflow"]["outbound"];

export function WorkflowSection({ copy, draft, projects, loadingProjectId, onUpdate }: {
  copy: HooksCopy;
  draft: YouTrackConfigurationDraft;
  projects: readonly YouTrackProject[];
  loadingProjectId: string | null;
  onUpdate: (updater: (current: YouTrackConfigurationDraft) => YouTrackConfigurationDraft) => void;
}) {
  return (
    <SettingsSection title={copy.workflow} description={copy.workflowHint}>
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

function RouteWorkflow({ copy, route, project, loading, onUpdate }: {
  copy: HooksCopy;
  route: YouTrackRouteDraft;
  project: YouTrackProject | undefined;
  loading: boolean;
  onUpdate: (updater: (route: YouTrackRouteDraft) => YouTrackRouteDraft) => void;
}) {
  const fields = project?.stateFields ?? [];
  const statuses = route.workflow.statuses.filter((status) => !status.archived);
  const setInbound = (key: InboundKey, values: string[]) =>
    onUpdate((current) => updateInbound(current, key, values));
  return (
    <section className={surface.workflowRoute}>
      <header><strong>{route.isDefault ? copy.defaultProject : ruleLabel(route, copy)}</strong>
        <span>{route.project.name} · {route.project.shortName}</span></header>
      {loading ? <p className={surface.projectLoading}>{copy.loadingProject}</p> : <>
        <label className={surface.field}>
          <span>{copy.stateField}</span>
          <select value={route.workflow.stateField.id} disabled={fields.length === 0}
            onChange={(event) => {
              const field = fields.find((candidate) => candidate.id === event.target.value);
              if (field) onUpdate((current) => routeWithStateField(current, field));
            }}>
            {!route.workflow.stateField.id ? <option value="">{copy.chooseStateField}</option> : null}
            {fields.map((field) => <option key={field.id} value={field.id}>{field.name}</option>)}
          </select>
        </label>
        <div className={surface.primaryMappings}>
          <StatusMultiSelect label={copy.readyStatuses} hint={copy.readyStatusesHint} statuses={statuses}
            values={route.workflow.inbound.readyForRetest} placeholder={copy.chooseStatuses}
            selectedLabel={copy.selectedStatuses} onChange={(values) => setInbound("readyForRetest", values)} />
          <StatusMultiSelect label={copy.acceptedStatuses} hint={copy.acceptedStatusesHint} statuses={statuses}
            values={route.workflow.inbound.accepted} placeholder={copy.chooseStatuses}
            selectedLabel={copy.selectedStatuses} onChange={(values) => setInbound("accepted", values)} />
        </div>
        <details className={surface.advancedMapping}>
          <summary><span><strong>{copy.advancedMapping}</strong><small>{copy.advancedMappingHint}</small></span>
            <ChevronDown size={16} aria-hidden="true" /></summary>
          <div className={surface.mappingBody}>
            <StatusMultiSelect label={copy.inboundGroups.backlog} statuses={statuses}
              values={route.workflow.inbound.backlog} placeholder={copy.chooseStatuses}
              selectedLabel={copy.selectedStatuses} onChange={(values) => setInbound("backlog", values)} />
            <StatusMultiSelect label={copy.inboundGroups.inProgress} statuses={statuses}
              values={route.workflow.inbound.inProgress} placeholder={copy.chooseStatuses}
              selectedLabel={copy.selectedStatuses} onChange={(values) => setInbound("inProgress", values)} />
            {(Object.keys(copy.outboundStates) as OutboundKey[]).map((key) => (
              <OutboundSelect key={key} label={copy.outboundStates[key]} route={route} state={key}
                statuses={statuses} empty={copy.notMapped} onUpdate={onUpdate} />
            ))}
          </div>
        </details>
      </>}
    </section>
  );
}

function StatusMultiSelect({ label, hint, statuses, values, placeholder, selectedLabel, onChange }: {
  label: string;
  hint?: string;
  statuses: readonly YouTrackStatus[];
  values: readonly string[];
  placeholder: string;
  selectedLabel: (count: number) => string;
  onChange: (values: string[]) => void;
}) {
  const chosen = statuses.filter((status) => values.includes(status.id));
  const summary = chosen.length === 0 ? placeholder
    : chosen.length <= 2 ? chosen.map(statusLabel).join(", ") : selectedLabel(chosen.length);
  return (
    <div className={surface.field}>
      <span>{label}</span>
      <details className={surface.multiSelect}>
        <summary aria-label={`${label}: ${summary}`}><span>{summary}</span><ChevronDown size={15} aria-hidden="true" /></summary>
        <div>{statuses.length === 0 ? <p>{placeholder}</p> : statuses.map((status) => (
          <label key={status.id}><input type="checkbox" checked={values.includes(status.id)}
            onChange={() => onChange(values.includes(status.id)
              ? values.filter((value) => value !== status.id) : [...values, status.id])} />
            <span>{statusLabel(status)}</span></label>
        ))}</div>
      </details>
      {hint ? <small>{hint}</small> : null}
    </div>
  );
}

function OutboundSelect({ label, route, state, statuses, empty, onUpdate }: {
  label: string;
  route: YouTrackRouteDraft;
  state: OutboundKey;
  statuses: readonly YouTrackStatus[];
  empty: string;
  onUpdate: (updater: (route: YouTrackRouteDraft) => YouTrackRouteDraft) => void;
}) {
  const allowed = state === "verified" ? new Set(route.workflow.inbound.accepted)
    : new Set(Object.values(route.workflow.inbound).flat());
  return (
    <label className={surface.field}><span>{label}</span>
      <select value={route.workflow.outbound[state] ?? ""}
        onChange={(event) => onUpdate((current) => ({ ...current, workflow: { ...current.workflow,
          outbound: { ...current.workflow.outbound, [state]: event.target.value || null },
        } }))}>
        <option value="">{empty}</option>
        {statuses.filter((status) => allowed.has(status.id)).map((status) => (
          <option key={status.id} value={status.id}>{statusLabel(status)}</option>
        ))}
      </select>
    </label>
  );
}

function updateInbound(route: YouTrackRouteDraft, key: InboundKey, values: string[]): YouTrackRouteDraft {
  const chosen = new Set(values);
  const inbound = Object.fromEntries((Object.keys(route.workflow.inbound) as InboundKey[]).map((candidate) => [
    candidate, candidate === key ? [...chosen] : route.workflow.inbound[candidate].filter((id) => !chosen.has(id)),
  ])) as YouTrackRouteDraft["workflow"]["inbound"];
  const mapped = new Set(Object.values(inbound).flat());
  const outbound = Object.fromEntries((Object.keys(route.workflow.outbound) as OutboundKey[]).map((candidate) => {
    const value = route.workflow.outbound[candidate];
    const valid = value && mapped.has(value) && (candidate !== "verified" || inbound.accepted.includes(value));
    return [candidate, valid ? value : null];
  })) as YouTrackRouteDraft["workflow"]["outbound"];
  return { ...route, workflow: { ...route.workflow, inbound, outbound } };
}

function routeWithStateField(route: YouTrackRouteDraft, field: YouTrackStateField): YouTrackRouteDraft {
  return { ...route, workflow: { stateField: { id: field.id, name: field.name }, statuses: [...field.statuses],
    inbound: { backlog: [], inProgress: [], readyForRetest: [], accepted: [] },
    outbound: { open: null, triaged: null, inProgress: null, readyForRetest: null,
      verified: null, closed: null, reopened: null },
  } };
}

function ruleLabel(route: YouTrackRouteDraft, copy: HooksCopy): string {
  const field = route.match?.field ?? "component";
  return `${copy.when} ${copy.matcherFields[field]} “${route.match?.value || "…"}”`;
}
