import { AppearanceConflict } from "./appearance-conflict";
import type { RepositoryFolder } from "../../model/folder";
import type { FolderAppearance } from "../../model/appearance/folder-appearance";

type Job = { appearance: FolderAppearance; key: string; folder: RepositoryFolder };
export function createAppearanceAutosave(initial: RepositoryFolder,
  save: (folder: RepositoryFolder, appearance: FolderAppearance, key: string) => Promise<RepositoryFolder>,
  notify: () => void, nextKey: () => string = () => crypto.randomUUID()) {
  let confirmed = initial, observed = initial, preview = initial.appearance ?? null, pending: { appearance: FolderAppearance } | null = null;
  let failed: Job | null = null, error = "", running = false, disposed = false;
  const publish = () => { if (!disposed) notify(); };
  async function drain() {
    if (running || disposed || error) return;
    running = true; publish();
    while (!disposed && (failed || pending)) {
      const job = failed ?? { folder: confirmed, appearance: pending!.appearance, key: nextKey() };
      if (!failed) pending = null;
      try {
        const updated = await save(job.folder, job.appearance, job.key);
        if (disposed) return;
        confirmed = updated; failed = null; preview = pending ? pending.appearance : updated.appearance ?? null;
      } catch (failure) {
        if (disposed) return;
        if (failure instanceof AppearanceConflict) {
          confirmed = failure.latestFolder; failed = { ...job, folder: confirmed, key: nextKey() };
        } else failed = job;
        preview = confirmed.appearance ?? null;
        error = failure instanceof Error ? failure.message : "Could not save folder appearance.";
        break;
      }
      publish();
    }
    running = false;
    if (observed.rowVersion > confirmed.rowVersion) {
      confirmed = observed; preview = confirmed.appearance ?? null;
    }
    publish();
  }
  return {
    activate() { disposed = false; },
    synchronize(folder: RepositoryFolder) {
      if (disposed || folder.id !== initial.id || folder.workspaceId !== initial.workspaceId || folder.projectId !== initial.projectId) return false;
      if (folder.rowVersion > observed.rowVersion) observed = folder;
      if (running || pending || failed || observed.rowVersion <= confirmed.rowVersion) return false;
      confirmed = observed; preview = confirmed.appearance ?? null; publish(); return true;
    },
    snapshot: () => ({ confirmed, preview, error, busy: running || Boolean(pending), failed: Boolean(failed) }),
    choose(appearance: FolderAppearance) {
      if (disposed || !running && !pending && !error && JSON.stringify(appearance) === JSON.stringify(confirmed.appearance ?? null)) return;
      pending = { appearance }; preview = error ? confirmed.appearance ?? null : appearance; publish();
      if (!error) queueMicrotask(() => void drain());
    },
    retry() { if (disposed || !failed) return; error = ""; preview = pending ? pending.appearance : failed.appearance; publish(); void drain(); },
    dispose() { disposed = true; pending = null; },
  };
}
