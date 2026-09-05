import type { CloudSession, CloudSessionState } from "./cloud-auth-client";

export type CloudSessionProbe =
  | { readonly stage: "admin" }
  | { readonly stage: "cloud"; readonly session: CloudSession }
  | { readonly stage: "unavailable" };

export async function resolveCloudSessionProbe(
  read: () => Promise<CloudSessionState>,
): Promise<CloudSessionProbe> {
  try {
    const session = await read();
    return session.authenticated
      ? { stage: "cloud", session }
      : { stage: "admin" };
  } catch {
    return { stage: "unavailable" };
  }
}
