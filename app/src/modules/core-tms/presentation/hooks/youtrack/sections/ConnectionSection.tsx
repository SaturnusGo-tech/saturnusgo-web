import { Eye, EyeOff, RefreshCw, Unplug } from "lucide-react";
import { IntegrationInput } from "../../../common/integration-controls/input/IntegrationInput";
import { IntegrationCheckbox } from "../../../common/integration-controls/checkbox/IntegrationCheckbox";
import { IntegrationButton } from "../../../common/integration-controls/button/IntegrationButton";
import type { YouTrackConfigurationDraft } from "../../../../youtrack/model/youtrack-settings";
import surface from "../../hooks.module.css";
import type { HooksCopy } from "../../shared/hooks-copy";
import { SettingsSection } from "../form/SettingsSection";
import { TokenHelp } from "./connection/TokenHelp";

export function ConnectionSection({ copy, draft, tokenConfigured, showToken, connectedProjects, action,
  onToggleToken, onUpdate, onConnect, canDisconnect, onChangeConnection }: {
  copy: HooksCopy; draft: YouTrackConfigurationDraft; tokenConfigured: boolean; showToken: boolean;
  connectedProjects: number; action: "idle" | "connecting" | "saving" | "disconnecting";
  onToggleToken: () => void; onUpdate: (updater: (current: YouTrackConfigurationDraft) => YouTrackConfigurationDraft) => void;
  onConnect: () => void; canDisconnect: boolean; onChangeConnection: () => void;
}) {
  return <SettingsSection title={copy.connection} description={copy.connectionHint}>
    <div className={surface.connectionFields}>
      <IntegrationInput label={copy.baseUrl} type="url" value={draft.baseUrl} placeholder="https://company.youtrack.cloud/"
        autoComplete="url" onValueChange={value => onUpdate(current => ({ ...current, baseUrl: value }))}/>
      <div className={surface.tokenGroup}>
        <IntegrationInput label={copy.apiToken} type={showToken ? "text" : "password"} value={draft.apiToken}
          placeholder={tokenConfigured ? copy.tokenStored : copy.tokenPlaceholder} autoComplete="new-password" spellCheck="false"
          onValueChange={value => onUpdate(current => ({ ...current, apiToken: value }))}
          endContent={<IntegrationButton isIconOnly variant="light" aria-label={showToken ? copy.hideToken : copy.showToken}
            aria-pressed={showToken} onPress={onToggleToken}>{showToken ? <EyeOff size={16}/> : <Eye size={16}/>}</IntegrationButton>}/>
        <div className={surface.tokenSupport}><small>{copy.tokenHint}</small><TokenHelp copy={copy}/></div>
      </div>
    </div>
    <div className={surface.connectionActions}>
      <IntegrationCheckbox isSelected={draft.enabled} onValueChange={enabled => onUpdate(current => ({ ...current, enabled }))}>
        <span className={surface.checkCopy}><strong>{copy.enabled}</strong><small>{copy.enabledHint}</small></span>
      </IntegrationCheckbox>
      <div className={surface.connectionResult}>
        {connectedProjects > 0 && <span>{copy.connectedProjects(connectedProjects)}</span>}
        {canDisconnect && <IntegrationButton variant="light" onPress={onChangeConnection} isDisabled={action !== "idle"}>
          <Unplug size={14}/>{copy.changeConnection}</IntegrationButton>}
        <IntegrationButton variant="bordered" onPress={onConnect} isDisabled={action !== "idle"} isLoading={action === "connecting"}>
          <RefreshCw size={15}/>{action === "connecting" ? copy.connecting : tokenConfigured ? copy.reconnect : copy.connect}
        </IntegrationButton>
      </div>
    </div>
  </SettingsSection>;
}
