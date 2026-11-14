import type { DataSource } from "../../model/workspace/data-workspace";

/** Remote database connections do not imply a discovered table. */
export function defaultSourceQuery(source: DataSource | undefined): string {
  return source?.status === "ACTIVE" && (source.kind === "FILE" || source.kind === "POSTMAN") && source.tableName
    ? `SELECT * FROM "${source.tableName.replaceAll('"', '""')}"` : "";
}
