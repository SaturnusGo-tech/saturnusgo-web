import type { BufferedProductDocDraft, ProductDocDraftBuffer } from "../draft-buffer";

type Recovery = {
  read(): [string, BufferedProductDocDraft][];
  write(drafts: ProductDocDraftBuffer): boolean;
};
export function createProductDocDraftBuffer(recovery?: Recovery, onRecoveryFailure?: () => void): ProductDocDraftBuffer {
  const drafts: ProductDocDraftBuffer = new Map(recovery?.read());
  const listeners = new Set<() => void>();
  const acknowledged = new Map<string, BufferedProductDocDraft["baseline"]>();
  const epochs = new Map<string, number>();
  let version = 0, recoveryFailed = false;
  const write = Map.prototype.set.bind(drafts), remove = Map.prototype.delete.bind(drafts);
  function changed() {
    const stored = recovery?.write(drafts);
    if (stored === false && drafts.size && !recoveryFailed) { recoveryFailed = true; onRecoveryFailure?.(); }
    else if (stored) recoveryFailed = false;
    version++;
    listeners.forEach(listener => listener());
  }
  drafts.set = (key, value) => {
    if (drafts.get(key) === value) return drafts;
    write(key, value);
    changed();
    return drafts;
  };
  drafts.delete = key => {
    const existed = remove(key);
    epochs.set(key, (epochs.get(key) ?? 0) + 1);
    acknowledged.delete(key);
    if (existed) changed();
    return existed;
  };
  drafts.clear = () => { for (const key of [...drafts.keys()]) drafts.delete(key); };
  drafts.subscribe = listener => { listeners.add(listener); return () => { listeners.delete(listener); }; };
  drafts.revision = () => version;
  drafts.epoch = key => epochs.get(key) ?? 0;
  drafts.acknowledged = key => acknowledged.get(key);
  drafts.acknowledge = (key, snapshot, baseline, epoch) => {
    const current = drafts.get(key);
    if (!current || drafts.epoch?.(key) !== epoch) return;
    acknowledged.set(key, baseline);
    if (current === snapshot) remove(key);
    else write(key, { ...current, baseline });
    changed();
  };
  return drafts;
}
