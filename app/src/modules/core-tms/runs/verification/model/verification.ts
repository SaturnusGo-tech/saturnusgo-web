import type { components } from "../../../../../core/tms/generated/tms-api";

type Api = components["schemas"];
export type VerificationEntry = Api["VerificationEntry"];
export type VerificationBlockedReason = Exclude<VerificationEntry["blockedReason"], null>;
export type VerificationQueue = Api["VerificationQueue"];
export type VerificationPageMeta = Api["VerificationPageMeta"];
export type VerificationRunEntry = Api["RunVerificationEntry"];
export type VerificationRunRequest = Api["VerificationRunRequest"];
export type VerificationQueueEnvelope = Api["VerificationQueueEnvelope"];
export type VerificationRunEnvelope = Api["RunVerificationEnvelope"];
