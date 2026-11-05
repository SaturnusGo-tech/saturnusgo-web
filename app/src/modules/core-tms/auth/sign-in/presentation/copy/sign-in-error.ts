import type { SignInStep } from "../../domain/sign-in";
import type { SignInCopy } from "./sign-in-copy";

export function signInError(code: string, step: SignInStep, copy: SignInCopy): string {
  if (code === "FEDERATION_UNAVAILABLE" && step === "saml") return copy.samlUnavailable;
  if (code === "NOT_FOUND" && (step === "company" || step === "saml")) return copy.companyNotFound;
  if (code === "PROVIDER_UNAVAILABLE") return copy.unavailable;
  if (/CODE|CHALLENGE|EXPIRED/.test(code)) return copy.expired;
  return copy.error;
}
