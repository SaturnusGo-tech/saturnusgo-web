import { TmsApiError } from "../../../../../core/tms/transport/http";
import type { VerificationPageMeta, VerificationQueueEnvelope, VerificationRunEnvelope } from "../model/verification";

function nextPage(meta: VerificationPageMeta, current: number) {
  if (!meta.hasMore) return null;
  if (!Number.isSafeInteger(meta.nextOffset) || meta.nextOffset === null || meta.nextOffset <= current) {
    throw new TmsApiError("Verification pagination did not advance", 502, null);
  }
  return meta.nextOffset;
}

export async function collectVerificationQueue(
  read: (offset: number) => Promise<VerificationQueueEnvelope>, signal?: AbortSignal,
) {
  const first = await read(0);
  const entries = [...first.data.entries];
  let next = nextPage(first.meta, 0);
  for (let pageNo = 1; next !== null; pageNo += 1) {
    signal?.throwIfAborted();
    if (pageNo >= 1000) throw new TmsApiError("Verification queue exceeds the page limit", 502, null);
    const page = await read(next);
    if (page.data.scopeToken !== first.data.scopeToken) {
      throw new TmsApiError("Verification queue changed during loading", 409, null, "CONFLICT");
    }
    entries.push(...page.data.entries);
    next = nextPage(page.meta, next);
  }
  return { ...first.data, entries };
}

export async function collectRunVerification(
  read: (offset: number) => Promise<VerificationRunEnvelope>, signal?: AbortSignal,
) {
  const entries: VerificationRunEnvelope["data"] = [];
  let next: number | null = 0;
  for (let pageNo = 0; next !== null; pageNo += 1) {
    signal?.throwIfAborted();
    if (pageNo >= 1000) throw new TmsApiError("Run verification exceeds the page limit", 502, null);
    const page = await read(next);
    entries.push(...page.data);
    next = nextPage(page.meta, next);
  }
  return entries;
}
