import { Eye, EyeOff } from "lucide-react";

import type { YouTrackConfigurationDraft } from "../../../../youtrack/model/youtrack-settings";
import surface from "../../hooks.module.css";
import type { HooksCopy } from "../../shared/hooks-copy";
import { SettingsSection } from "../form/SettingsSection";

export function ConnectionSection({
  copy,
  draft,
  tokenConfigured,
  showToken,
  onToggleToken,
  onUpdate,
}: {
  copy: HooksCopy;
  draft: YouTrackConfigurationDraft;
  tokenConfigured: boolean;
  showToken: boolean;
  onToggleToken: () => void;
  onUpdate: (updater: (current: YouTrackConfigurationDraft) => YouTrackConfigurationDraft) => void;
}) {
  return (
    <SettingsSection title={copy.connection} description={copy.connectionHint}>
      <label className={surface.switchRow}>
        <span>
          <strong>{copy.enabled}</strong>
          <small>{copy.enabledHint}</small>
        </span>
        <input
          type="checkbox"
          checked={draft.enabled}
          onChange={(event) => onUpdate((current) => ({ ...current, enabled: event.target.checked }))}
        />
      </label>
      <div className={surface.formGrid}>
        <label className={surface.field}>
          <span>{copy.baseUrl}</span>
          <input
            type="url"
            value={draft.baseUrl}
            placeholder="https://youtrack.example.com/"
            onChange={(event) => onUpdate((current) => ({ ...current, baseUrl: event.target.value }))}
            autoComplete="url"
          />
        </label>
        <label className={surface.field}>
          <span>{copy.apiToken}</span>
          <span className={surface.tokenField}>
            <input
              type={showToken ? "text" : "password"}
              value={draft.apiToken}
              placeholder={tokenConfigured ? copy.tokenStored : copy.tokenPlaceholder}
              onChange={(event) => onUpdate((current) => ({ ...current, apiToken: event.target.value }))}
              autoComplete="new-password"
            />
            <button type="button" aria-label={showToken ? copy.hideToken : copy.showToken} onClick={onToggleToken}>
              {showToken
                ? <EyeOff size={16} aria-hidden="true" />
                : <Eye size={16} aria-hidden="true" />}
            </button>
          </span>
          <small>{copy.tokenHint}</small>
        </label>
      </div>
    </SettingsSection>
  );
}
