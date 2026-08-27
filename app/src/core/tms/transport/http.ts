import type { Bootstrap } from "../contracts/legacy-contract";
import { resolveTmsApiBase } from "../config/api-base";

const API_BASE = resolveTmsApiBase(
  process.env.NEXT_PUBLIC_TMS_API_BASE,
  process.env.NODE_ENV === "production",
  process.env.NODE_ENV === "production"
    ? undefined
    : "http://localhost:4100/api/v1",
);

type MutationMethod = "POST" | "PATCH" | "DELETE";

type AttachmentInput = {
  projectId: string;
  entityType: "test_case" | "step" | "run" | "run_item" | "step_result" | "defect";
  entityId: string;
  file: File;
  kind?: "file" | "screenshot" | "video" | "log";
};

export class TmsApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly requestId: string | null,
  ) {
    super(message);
    this.name = "TmsApiError";
  }
}

export async function fetchBootstrap(signal?: AbortSignal): Promise<Bootstrap> {
  const response = await fetch(`${API_BASE}/bootstrap`, {
    signal,
    cache: "no-store",
  });
  if (!response.ok) {
    throw new TmsApiError(
      `TMS API returned ${response.status}`,
      response.status,
      response.headers.get("x-request-id"),
    );
  }
  return (await response.json()) as Bootstrap;
}

export async function mutate<T>(
  path: string,
  method: MutationMethod,
  body?: unknown,
): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `TMS API returned ${response.status}`);
  }
  if (response.status === 204) return undefined as T;
  const payload = (await response.json()) as { data?: T } | T;
  return typeof payload === "object" && payload !== null && "data" in payload
    ? (payload as { data: T }).data
    : (payload as T);
}

export async function uploadAttachment(input: AttachmentInput): Promise<unknown> {
  const form = new FormData();
  form.append("projectId", input.projectId);
  form.append("entityType", input.entityType);
  form.append("entityId", input.entityId);
  form.append("kind", input.kind ?? inferAttachmentKind(input.file));
  form.append("name", input.file.name);
  form.append("file", input.file);
  const response = await fetch(`${API_BASE}/attachments/upload`, {
    method: "POST",
    body: form,
  });
  if (!response.ok) throw new Error(await response.text());
  return (await response.json()) as unknown;
}

function inferAttachmentKind(file: File): "file" | "screenshot" | "video" {
  if (file.type.startsWith("image/")) return "screenshot";
  if (file.type.startsWith("video/")) return "video";
  return "file";
}
