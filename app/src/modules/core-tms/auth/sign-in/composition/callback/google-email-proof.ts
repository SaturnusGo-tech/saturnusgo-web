import type { EmailChallenge, SignInIntent } from "../../domain/sign-in";
export interface GoogleEmailProof { readonly email: string; readonly challenge: EmailChallenge; readonly intent: SignInIntent }
export function googleEmailProof(search: string): GoogleEmailProof | null {
  const query = new URLSearchParams(search);
  const challengeId = query.get("challengeId");
  const email = query.get("email");
  const expiresAt = query.get("expiresAt");
  const retryAfterSeconds = Number(query.get("retryAfterSeconds"));
  const intent = query.get("intent");
  if (!challengeId || !/^[\w-]{1,128}$/.test(challengeId) || !email || email.length > 320
    || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !expiresAt || !Number.isFinite(Date.parse(expiresAt))
    || !query.has("retryAfterSeconds") || !Number.isInteger(retryAfterSeconds) || retryAfterSeconds !== 60
    || (intent !== "login" && intent !== "signup")) return null;
  return { intent, email, challenge: { challengeId, expiresAt, retryAfterSeconds: 60 } };
}
