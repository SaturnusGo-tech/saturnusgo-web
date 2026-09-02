export const MAX_PENDING_CASE_ATTACHMENTS = 20;

export type PendingCaseAttachment = {
  readonly id: string;
  readonly fieldKey: string;
  readonly stepId?: string;
  readonly file: File;
};

export type PendingCaseAttachmentResult = {
  readonly entries: PendingCaseAttachment[];
  readonly accepted: number;
  readonly rejected: number;
};

function fingerprint(file: File) {
  return [file.name, file.size, file.type, file.lastModified].join(":");
}

export function appendPendingCaseAttachments(
  current: PendingCaseAttachment[],
  input: { fieldKey: string; stepId?: string; files: File[] },
  createId: () => string = () => crypto.randomUUID(),
): PendingCaseAttachmentResult {
  const fingerprints = new Set(current.map(({ file }) => fingerprint(file)));
  const entries = [...current];
  let accepted = 0;
  let rejected = 0;
  for (const file of input.files) {
    const key = fingerprint(file);
    if (fingerprints.has(key) || entries.length >= MAX_PENDING_CASE_ATTACHMENTS) {
      rejected += 1;
      continue;
    }
    fingerprints.add(key);
    entries.push({ id: createId(), fieldKey: input.fieldKey, stepId: input.stepId, file });
    accepted += 1;
  }
  return { entries, accepted, rejected };
}

export function pendingCaseAttachmentSignature(entries: PendingCaseAttachment[]) {
  return entries.map(({ fieldKey, stepId, file }) => ({
    fieldKey,
    stepId: stepId ?? null,
    name: file.name,
    size: file.size,
    type: file.type,
    lastModified: file.lastModified,
  }));
}

export function filesFromClipboard(data: Pick<DataTransfer, "files" | "items">) {
  const files = Array.from(data.files);
  if (files.length > 0) return files;
  return Array.from(data.items)
    .filter((item) => item.kind === "file")
    .map((item) => item.getAsFile())
    .filter((file): file is File => Boolean(file));
}

export function groupPendingCaseAttachments(entries: PendingCaseAttachment[]) {
  const grouped = new Map<string, { stepId?: string; files: File[] }>();
  for (const entry of entries) {
    const key = entry.stepId ?? "";
    const group = grouped.get(key) ?? { stepId: entry.stepId, files: [] };
    group.files.push(entry.file);
    grouped.set(key, group);
  }
  return [...grouped.values()].sort((left, right) => (
    (left.stepId ?? "").localeCompare(right.stepId ?? "")
  ));
}
