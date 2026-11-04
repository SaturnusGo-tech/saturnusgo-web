import type { AuthorizationRedirect, AuthRedirect, EmailChallenge, SignInIntent, SignInMethods, TrialStatus } from "../domain/sign-in";

export interface SignInPort {
  cancelFederation(signal?: AbortSignal): Promise<void>;
  methods(signal?: AbortSignal): Promise<SignInMethods>;
  startEmail(email: string, intent: SignInIntent, signal?: AbortSignal): Promise<EmailChallenge>;
  verifyEmail(challengeId: string, code: string, signal?: AbortSignal): Promise<AuthRedirect>;
  startGoogle(intent: SignInIntent, signal?: AbortSignal): Promise<AuthorizationRedirect>;
  startSaml(organization: string, signal?: AbortSignal): Promise<AuthorizationRedirect>;
  trial(signal?: AbortSignal): Promise<TrialStatus>;
}
