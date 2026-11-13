export type ProductDocLifecycleMode = "archive" | "delete";
export interface ProductDocLifecyclePermissions {
  canEdit?: boolean;
  canArchive?: boolean;
  canDelete?: boolean;
}
