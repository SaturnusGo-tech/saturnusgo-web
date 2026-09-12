export type DiscussionScope = Readonly<{ workspaceId: string; targetType: "project" | "portfolio"; targetId: string }>;
export type OrganizationComment = Readonly<{
  id: string; body: string; author: Readonly<{ identityId: string; displayName: string }>; createdAt: string; revision?: number; updatedAt?: string | null; canEdit?: boolean;
}>;
