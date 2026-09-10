import type { components } from "../../../../../core/tms/generated/tms-api";

export type ManagedAvatarGrant = components["schemas"]["ManagedAvatarGrant"];
export type ManagedAvatarLoader = (signal: AbortSignal) => Promise<ManagedAvatarGrant>;
