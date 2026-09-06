import type { HooksCopy } from "../../shared/hooks-copy";
import surface from "../../hooks.module.css";
import type { YouTrackSettingsState } from "../use-youtrack-settings";
import { ConnectionSection } from "../sections/ConnectionSection";
import { RoutingSection, WorkflowSection } from "../sections/RoutingWorkflowSections";

export function YouTrackSettingsForm({ copy, state }: {
  copy: HooksCopy;
  state: YouTrackSettingsState;
}) {
  if (!state.configuration || !state.draft) return null;
  return (
    <main className={surface.settingsMain}>
      <ConnectionSection
        copy={copy}
        draft={state.draft}
        tokenConfigured={state.configuration.tokenConfigured}
        showToken={state.showToken}
        onToggleToken={() => state.setShowToken((value) => !value)}
        onUpdate={state.updateDraft}
      />
      <RoutingSection
        copy={copy}
        draft={state.draft}
        projects={state.selectedProjects}
        onUpdate={state.updateDraft}
      />
      <WorkflowSection copy={copy} draft={state.draft} onUpdate={state.updateDraft} />
    </main>
  );
}
