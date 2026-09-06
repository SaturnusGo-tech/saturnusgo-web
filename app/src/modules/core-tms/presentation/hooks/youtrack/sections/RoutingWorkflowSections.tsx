import {
  YOU_TRACK_STAGES,
  YOU_TRACK_TARGETS,
  type YouTrackAcceptedStage,
  type YouTrackConfigurationDraft,
  type YouTrackProject,
  type YouTrackStage,
  type YouTrackTargetKey,
} from "../../../../youtrack/model/youtrack-settings";
import surface from "../../hooks.module.css";
import type { HooksCopy } from "../../shared/hooks-copy";
import { SettingsSection } from "../form/SettingsSection";

type UpdateDraft = (
  updater: (current: YouTrackConfigurationDraft) => YouTrackConfigurationDraft,
) => void;

export function RoutingSection({ copy, draft, projects, onUpdate }: {
  copy: HooksCopy;
  draft: YouTrackConfigurationDraft;
  projects: readonly YouTrackProject[];
  onUpdate: UpdateDraft;
}) {
  return (
    <SettingsSection title={copy.routing} description={copy.routingHint}>
      <div className={surface.routingTable}>
        <div className={surface.routingHead} aria-hidden="true">
          <span>{copy.falconArea}</span>
          <span>{copy.youTrackProject}</span>
          <span>{copy.projectKey}</span>
        </div>
        {YOU_TRACK_TARGETS.map((target) => (
          <RoutingRow
            key={target}
            target={target}
            value={draft.targets[target]}
            projects={projects}
            label={copy.targets[target]}
            onChange={(projectId) => {
              const project = projects.find((candidate) => candidate.id === projectId);
              if (!project) return;
              onUpdate((current) => ({ ...current, targets: {
                ...current.targets,
                [target]: { projectId: project.id, shortName: project.shortName, name: project.name },
              } }));
            }}
          />
        ))}
      </div>
      <p className={surface.sectionNote}>{copy.projectDiscoveryHint}</p>
    </SettingsSection>
  );
}

export function WorkflowSection({ copy, draft, onUpdate }: {
  copy: HooksCopy;
  draft: YouTrackConfigurationDraft;
  onUpdate: UpdateDraft;
}) {
  return (
    <SettingsSection title={copy.workflow} description={copy.workflowHint}>
      <div className={surface.workflowGrid}>
        <fieldset className={surface.statusPicker}>
          <legend>{copy.readyStatuses}</legend>
          <div>
            {YOU_TRACK_STAGES.map((stage) => (
              <label key={stage}>
                <input
                  type="checkbox"
                  checked={draft.readyForTestStatuses.includes(stage)}
                  onChange={() => onUpdate((current) => ({
                    ...current,
                    readyForTestStatuses: toggleStage(current.readyForTestStatuses, stage),
                  }))}
                />
                <span>{stage}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <label className={surface.field}>
          <span>{copy.acceptedStatus}</span>
          <select
            value={draft.acceptedStage}
            onChange={(event) => onUpdate((current) => ({
              ...current,
              acceptedStage: event.target.value as YouTrackAcceptedStage,
            }))}
          >
            <option value="Acceptance">Acceptance</option>
            <option value="Staging">Staging</option>
            <option value="Done">Done</option>
          </select>
          <small>{copy.acceptedStatusHint}</small>
        </label>
      </div>
    </SettingsSection>
  );
}

function RoutingRow({ target, value, projects, label, onChange }: {
  target: YouTrackTargetKey;
  value: YouTrackConfigurationDraft["targets"][YouTrackTargetKey];
  projects: readonly YouTrackProject[];
  label: string;
  onChange: (projectId: string) => void;
}) {
  return (
    <div className={surface.routingRow} data-target={target}>
      <strong>{label}</strong>
      <select value={value.projectId} onChange={(event) => onChange(event.target.value)}>
        {!value.projectId ? <option value="">—</option> : null}
        {projects.map((project) => (
          <option key={project.id} value={project.id}>{project.name}</option>
        ))}
      </select>
      <code>{value.shortName || "—"}</code>
    </div>
  );
}

function toggleStage(current: readonly YouTrackStage[], stage: YouTrackStage): YouTrackStage[] {
  return current.includes(stage)
    ? current.filter((candidate) => candidate !== stage)
    : YOU_TRACK_STAGES.filter((candidate) => current.includes(candidate) || candidate === stage);
}
