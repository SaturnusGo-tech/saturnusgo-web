import { ErrorToast } from "../../../../common/error/ErrorToast";
import type { HooksCopy } from "../../../shared/hooks-copy";

export function YouTrackSettingsFailure({ copy, onRetry }: {
  copy: HooksCopy;
  onRetry: () => void;
}) {
  return <ErrorToast title={copy.loadError} message={copy.loadErrorHint} retryLabel={copy.retry} onRetry={onRetry} />;
}
