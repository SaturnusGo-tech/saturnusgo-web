import { CompanyAccessError } from "../../managed/domain/managed-access";
import type { SignInPort } from "../application/sign-in-port";
import { browserDesktopAttempt } from "../../continuation/desktop/browser-desktop-attempt";
import { scopedAuthRequestPath } from "../../navigation/request-scope/auth-request-path";

export function createSignInClient(send: typeof fetch = fetch, locale?: () => "en" | "ru", { scopeWorkspace = true } = {}): SignInPort {
  async function request<T>(path: string, body?: unknown, signal?: AbortSignal): Promise<T> {
    const endpoint = `/api/v1${path}`;
    const response = await send(scopeWorkspace ? scopedAuthRequestPath(endpoint) : endpoint, { method: body === undefined ? "GET" : "POST",
      credentials: "include", cache: "no-store", redirect: "error", signal,
      headers: { accept: "application/json", ...(body === undefined ? {} : { "content-type": "application/json" }) },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    if (response.status === 204) return undefined as T;
    const envelope = await response.json();
    if (!response.ok) throw new CompanyAccessError(envelope?.error?.code ?? "SERVICE_UNAVAILABLE");
    if (!envelope || !Object.prototype.hasOwnProperty.call(envelope, "data")) throw new CompanyAccessError("INVALID_RESPONSE");
    return envelope.data as T;
  }
  const desktopContinuation = () => {
    const desktopAttempt = browserDesktopAttempt();
    return desktopAttempt ? { desktopAttempt } : {};
  };
  return {
    cancelFederation: signal => request("/auth/federation/cancel", {}, signal),
    methods: signal => request("/auth/methods", undefined, signal),
    startEmail: (email, intent, signal) => request("/auth/email/start", { email, intent }, signal),
    resendEmail: (challengeId, signal) => request("/auth/email/resend", { challengeId }, signal),
    verifyEmail: (challengeId, code, signal) => request("/auth/email/verify", { challengeId, code }, signal),
    startGoogle: (intent, signal) => request("/auth/google/start", { intent, ...(intent === "link" ? {} : desktopContinuation()) }, signal),
    resolveCompany: (organization, signal) => request("/auth/company/resolve", { organization, ...desktopContinuation() }, signal),
    startSaml: (organization, signal) => request("/auth/saml/start", { organization, ...(locale ? { locale: locale() } : {}), ...desktopContinuation() }, signal),
    trial: signal => request("/auth/trial", undefined, signal),
  };
}
