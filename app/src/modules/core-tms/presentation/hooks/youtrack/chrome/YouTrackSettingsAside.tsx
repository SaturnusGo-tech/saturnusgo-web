import { RefreshCw } from "lucide-react";

import surface from "../../hooks.module.css";
import type { HooksCopy } from "../../shared/hooks-copy";

export function YouTrackSettingsSkeleton({ copy }: { copy: HooksCopy }) {
  return (
    <div className={surface.settingsSkeleton} aria-label={copy.loading}>
      <span /><span /><span /><span /><span />
    </div>
  );
}

export function YouTrackSettingsFailure({ copy, onRetry }: {
  copy: HooksCopy;
  onRetry: () => void;
}) {
  return (
    <div className={surface.settingsFailure} role="alert">
      <strong>{copy.loadError}</strong>
      <p>{copy.loadErrorHint}</p>
      <button type="button" className={surface.secondaryButton} onClick={onRetry}>
        <RefreshCw size={15} aria-hidden="true" />{copy.retry}
      </button>
    </div>
  );
}
