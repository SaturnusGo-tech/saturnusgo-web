import type { components } from "../../../../../core/tms/generated/tms-api";
import { LayoutError, type BoardScope, type ProjectBoard } from "../model/layout";

export function mapProjectBoard(dto: components["schemas"]["Dashboard"], etag: string | null,
  scope: BoardScope): ProjectBoard {
  if (dto.projectId !== scope.projectId || dto.workspaceId !== scope.workspaceId || dto.status !== "active" || !etag) {
    throw new LayoutError("invalid");
  }
  return { id: dto.id, projectId: dto.projectId, workspaceId: dto.workspaceId, etag, name: dto.name,
    widgets: [...dto.widgets].sort((a,b) => a.position.y-b.position.y || a.position.x-b.position.x)
      .map((item) => ({ id: item.id, title: item.title, type: item.type,
        settings: { ...item.settings }, position: { ...item.position } })) };
}
