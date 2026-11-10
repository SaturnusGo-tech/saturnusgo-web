import { ErrorToast } from "../../../common/error/ErrorToast";
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
  return <ErrorToast title={copy.loadError} message={copy.loadErrorHint} retryLabel={copy.retry} onRetry={onRetry} />;
}
