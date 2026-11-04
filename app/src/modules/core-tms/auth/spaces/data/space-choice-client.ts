import { CompanyAccessError } from "../../managed/domain/managed-access";
import { createSignInClient } from "../../sign-in/data/sign-in-client";
import type { SpaceChoicePort } from "../application/space-choice-port";
export function createSpaceChoiceClient(send: typeof fetch = fetch): SpaceChoicePort {
  async function request<T>(path: string, body?: unknown, signal?: AbortSignal): Promise<T> {
    const response = await send(`/api/v1/auth/spaces${path}`, { method: body === undefined ? "GET" : "POST", credentials: "include", cache: "no-store", redirect: "error", signal,
      headers: { accept: "application/json", ...(body === undefined ? {} : { "content-type": "application/json" }) }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    const envelope = await response.json();
    if (!response.ok) throw new CompanyAccessError(envelope?.error?.code ?? "SERVICE_UNAVAILABLE");
    if (!envelope || !Object.prototype.hasOwnProperty.call(envelope, "data")) throw new CompanyAccessError("INVALID_RESPONSE");
    return envelope.data as T;
  }
  const signIn = createSignInClient(send);
  return { list: signal => request("", undefined, signal), select: (spaceId, signal) => request("/select", { spaceId }, signal), cancel: signIn.cancelFederation };
}
