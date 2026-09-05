export interface CloudIdentity {
  readonly id: string;
  readonly givenName: string;
  readonly familyName: string;
  readonly email: string;
  readonly phone: string;
}

export interface CloudSession {
  readonly authenticated: true;
  readonly identity: CloudIdentity;
  readonly workspace: { readonly id: string; readonly name: string; readonly slug: string };
  readonly membership: { readonly role: "workspace_admin" };
  readonly defaultProject: { readonly id: string; readonly name: string; readonly slug: string };
  readonly defaultEnvironment: { readonly id: string; readonly name: string };
}

export type CloudSessionState = CloudSession | { readonly authenticated: false };
export type CloudRegisterInput = {
  readonly givenName: string;
  readonly familyName: string;
  readonly email: string;
  readonly phone: string;
  readonly password: string;
  readonly termsAccepted: true;
};

export class CloudAuthError extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
    this.name = "CloudAuthError";
  }
}

export function cloudApiBase(): string {
  const configured = process.env.NEXT_PUBLIC_TMS_API_BASE?.trim();
  if (configured) return configured.replace(/\/$/, "");
  return process.env.NODE_ENV === "production" ? "/api/v1" : "http://localhost:4100/api/v1";
}

async function responseData(response: Response): Promise<CloudSessionState> {
  let body: unknown;
  try { body = await response.json(); } catch { body = null; }
  if (!response.ok) {
    const envelope = body && typeof body === "object" ? body as { error?: { message?: unknown } } : null;
    const raw = envelope?.error?.message;
    const message = typeof raw === "string" && raw.length < 500
      ? raw
      : "Не удалось завершить вход. Попробуйте ещё раз.";
    throw new CloudAuthError(response.status, message);
  }
  const data = body && typeof body === "object" && "data" in body
    ? (body as { data: CloudSessionState }).data
    : null;
  if (!data || typeof data.authenticated !== "boolean") {
    throw new CloudAuthError(502, "Сервис авторизации вернул некорректный ответ.");
  }
  return data;
}

async function cloudRequest(path: string, init: RequestInit = {}): Promise<CloudSessionState> {
  const response = await fetch(`${cloudApiBase()}${path}`, {
    ...init, cache: "no-store", credentials: "include", redirect: "error",
  });
  return responseData(response);
}

export async function registerCloudAccount(input: CloudRegisterInput, idempotencyKey: string): Promise<CloudSession> {
  const result = await cloudRequest("/cloud-auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Idempotency-Key": idempotencyKey },
    body: JSON.stringify(input),
  });
  if (!result.authenticated) throw new CloudAuthError(502, "Сессия не была создана.");
  return result;
}

export async function loginCloudAccount(email: string, password: string): Promise<CloudSession> {
  const result = await cloudRequest("/cloud-auth/login", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!result.authenticated) throw new CloudAuthError(401, "Неверная почта или пароль.");
  return result;
}

export async function readCloudSession(signal?: AbortSignal): Promise<CloudSessionState> {
  return cloudRequest("/cloud-auth/session", { method: "GET", signal });
}

export async function logoutCloudSession(): Promise<void> {
  const response = await fetch(`${cloudApiBase()}/cloud-auth/logout`, {
    method: "POST", cache: "no-store", credentials: "include", redirect: "error",
  });
  if (!response.ok && response.status !== 204) {
    throw new CloudAuthError(response.status, "Не удалось завершить сессию.");
  }
}

export function cloudWorkspacePath(session: CloudSession): string {
  const search = new URLSearchParams({
    workspaceId: session.workspace.id,
    projectId: session.defaultProject.id,
  });
  return `/testcases/umbrella-home/work/?${search.toString()}`;
}

export function cloudWorkspacePathFromLocation(
  location: Pick<Location, "pathname" | "search" | "hash">,
  session: CloudSession,
): string {
  const search = new URLSearchParams(location.search);
  if (!search.has("workspaceId")) search.set("workspaceId", session.workspace.id);
  if (!search.has("projectId")) search.set("projectId", session.defaultProject.id);
  return `${location.pathname}?${search.toString()}${location.hash}`;
}
