export type ProductDocLifecycleMode = "archive" | "restore" | "delete";
export interface ProductDocLifecyclePermissions {
  canEdit?: boolean;
  canArchive?: boolean;
  canDelete?: boolean;
  canPublish?: boolean;
}
