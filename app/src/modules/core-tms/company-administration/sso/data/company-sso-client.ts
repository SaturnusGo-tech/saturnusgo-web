import type { CompanySsoPort } from "../application/company-sso-port";
import { AdministrationError } from "../../domain/administration";

export function createCompanySsoClient(send: typeof fetch = fetch): CompanySsoPort {
  async function request<T>(path: string, method: string, body: unknown, signal: AbortSignal): Promise<T> {
    const response = await send(`/api/v1/company/sso${path}`, { method, credentials: "include", cache: "no-store", redirect: "error", signal,
      headers: { accept: "application/json", ...(body === undefined ? {} : { "content-type": "application/json" }) },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    const envelope = await response.json();
    if (!response.ok) throw new AdministrationError(envelope?.error?.code ?? "SERVICE_UNAVAILABLE");
    if (!envelope || !Object.prototype.hasOwnProperty.call(envelope, "data")) throw new AdministrationError("INVALID_RESPONSE");
    return envelope.data as T;
  }
  return {
    get: signal => request("", "GET", undefined, signal),
    save: (draft, signal) => request("", "PUT", draft, signal),
    test: signal => request("/test", "POST", undefined, signal),
    enable: (version, enabled, signal) => request("/enable", "POST", { version, enabled }, signal),
    enforce: (version, enforced, signal) => request("/enforce", "POST", { version, enforced }, signal),
    subjects: signal => request("/subjects", "GET", undefined, signal),
    bind: (subject, signal) => request("/subjects", "PUT", subject, signal),
  };
}
