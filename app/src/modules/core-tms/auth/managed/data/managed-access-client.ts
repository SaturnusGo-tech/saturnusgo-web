import type { ManagedAccessPort } from "../application/managed-access-port";
import { CompanyAccessError, type CompanyEntrypoint, type CompanySession, type MfaEnrollment, type MfaResult }
  from "../domain/managed-access";

export function createManagedAccessClient(send: typeof fetch = fetch): ManagedAccessPort {
  async function request<T>(path: string, method = "GET", body?: unknown, signal?: AbortSignal): Promise<T> {
    let response: Response;
    try {
      response = await send(`/api/v1${path}`, { method, credentials: "include", cache: "no-store", redirect: "error", signal,
        headers: { accept: "application/json", ...(body === undefined ? {} : { "content-type": "application/json" }) },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    } catch (error) {
      if (signal?.aborted) throw error;
      throw new CompanyAccessError("SERVICE_UNAVAILABLE");
    }
    if (response.status === 204) return undefined as T;
    let payload: { data?: T; error?: { code?: string; requestId?: string } };
    try { payload = await response.json(); } catch { throw new CompanyAccessError("INVALID_RESPONSE"); }
    if (!payload || typeof payload !== "object") throw new CompanyAccessError("INVALID_RESPONSE");
    if (!response.ok) throw new CompanyAccessError(payload.error?.code ?? "SERVICE_UNAVAILABLE", payload.error?.requestId);
    if (!Object.prototype.hasOwnProperty.call(payload, "data")) throw new CompanyAccessError("INVALID_RESPONSE");
    return payload.data as T;
  }
  return {
    entrypoint: (signal) => request<CompanyEntrypoint>("/auth/entrypoint", "GET", undefined, signal),
    session: (signal) => request<CompanySession>("/auth/session", "GET", undefined, signal),
    login: async (fields, signal) => { await request("/auth/login", "POST", fields, signal); },
    firstPassword: async (password, signal) => { await request("/auth/password/first", "POST", { password }, signal); },
    prepareMfa: (signal) => request<MfaEnrollment>("/auth/mfa/enroll", "POST", undefined, signal),
    verifyMfa: (kind, code, signal) => request<MfaResult>(`/auth/mfa/${kind === "totp" ? "verify" : "recovery"}`,
      "POST", { code }, signal),
    logout: (signal) => request<void>("/auth/logout", "POST", undefined, signal),
  };
}
