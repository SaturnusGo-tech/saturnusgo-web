import type { components } from "../../../../../core/tms/generated/tms-api";

type Api = components["schemas"];
export type SignInMethods = Api["AuthMethods"];
export type EmailChallenge = Api["AuthEmailChallenge"];
export type AuthorizationRedirect = Api["AuthAuthorizationRedirect"];
export type AuthRedirect = Api["AuthRedirect"];
export type TrialStatus = Api["AuthTrial"];
export type GoogleIntent = Api["AuthGoogleStartRequest"]["intent"];
export type SignInIntent = "login" | "signup";
export type SignInStep = "methods" | "email" | "code" | "saml" | "company";
