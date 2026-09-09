import { ExternalLink, Eye, EyeOff, HelpCircle, RefreshCw, Unplug } from "lucide-react";
import { useState } from "react";

import type { YouTrackConfigurationDraft } from "../../../../youtrack/model/youtrack-settings";
import surface from "../../hooks.module.css";
import type { HooksCopy } from "../../shared/hooks-copy";
import { SettingsSection } from "../form/SettingsSection";

export function ConnectionSection({
  copy,
  draft,
  tokenConfigured,
  showToken,
  connectedProjects,
  action,
  onToggleToken,
  onUpdate,
  onConnect,
  canDisconnect,
  onChangeConnection,
}: {
  copy: HooksCopy;
  draft: YouTrackConfigurationDraft;
  tokenConfigured: boolean;
  showToken: boolean;
  connectedProjects: number;
  action: "idle" | "connecting" | "saving" | "disconnecting";
  onToggleToken: () => void;
  onUpdate: (updater: (current: YouTrackConfigurationDraft) => YouTrackConfigurationDraft) => void;
  onConnect: () => void;
  canDisconnect: boolean;
  onChangeConnection: () => void;
}) {
  const [tokenHelpOpen, setTokenHelpOpen] = useState(false);
  return (
    <SettingsSection title={copy.connection} description={copy.connectionHint}>
      <div className={surface.connectionFields}>
        <label className={surface.field}>
          <span>{copy.baseUrl}</span>
          <input
            type="url"
            value={draft.baseUrl}
            placeholder="https://company.youtrack.cloud/"
            onChange={(event) => onUpdate((current) => ({ ...current, baseUrl: event.target.value }))}
            autoComplete="url"
          />
        </label>
        <div className={surface.field}>
          <span className={surface.fieldLabelWithHelp}>
            <label htmlFor="youtrack-token">{copy.apiToken}</label>
            <span className={surface.tokenHelp}
              onMouseEnter={() => setTokenHelpOpen(true)} onMouseLeave={() => setTokenHelpOpen(false)}
              onFocus={() => setTokenHelpOpen(true)}
              onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setTokenHelpOpen(false);
              }}
              onKeyDown={(event) => { if (event.key === "Escape") setTokenHelpOpen(false); }}>
              <button type="button" aria-label={copy.tokenHelpLabel} aria-haspopup="dialog"
                aria-expanded={tokenHelpOpen} aria-controls="youtrack-token-help"
                onClick={() => setTokenHelpOpen(true)}>
                <HelpCircle size={15} aria-hidden="true" />
              </button>
              {tokenHelpOpen ? <aside id="youtrack-token-help" role="dialog" aria-label={copy.tokenHelpTitle}
                className={surface.tokenPopover} data-open="true">
                <strong>{copy.tokenHelpTitle}</strong>
                <ol>{copy.tokenHelpSteps.map((step) => <li key={step}>{step}</li>)}</ol>
                <p>{copy.tokenHelpNote}</p>
                <a href="https://www.jetbrains.com/help/youtrack/cloud/manage-permanent-token.html" target="_blank" rel="noreferrer">
                  {copy.tokenHelpLink}<ExternalLink size={13} aria-hidden="true" />
                </a>
              </aside> : null}
            </span>
          </span>
          <span className={surface.tokenField} data-input-shell>
            <input
              id="youtrack-token"
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
        </div>
      </div>
      <div className={surface.connectionActions}>
        <label className={surface.switchRow}>
          <input
            type="checkbox"
            checked={draft.enabled}
            onChange={(event) => onUpdate((current) => ({ ...current, enabled: event.target.checked }))}
          />
          <span><strong>{copy.enabled}</strong><small>{copy.enabledHint}</small></span>
        </label>
        <span className={surface.connectionResult}>
          {connectedProjects > 0 ? copy.connectedProjects(connectedProjects) : null}
          {canDisconnect ? <button type="button" className={surface.quietButton}
            onClick={onChangeConnection} disabled={action !== "idle"}>
            <Unplug size={14} aria-hidden="true" />{copy.changeConnection}
          </button> : null}
          <button type="button" className={surface.secondaryButton} onClick={onConnect} disabled={action !== "idle"}>
            <RefreshCw size={15} aria-hidden="true" data-spin={action === "connecting"} />
            {action === "connecting" ? copy.connecting : tokenConfigured ? copy.reconnect : copy.connect}
          </button>
        </span>
      </div>
    </SettingsSection>
  );
}
