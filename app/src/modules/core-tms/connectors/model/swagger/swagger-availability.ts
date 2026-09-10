import type { Connection, Scope } from "../connector-types";
export function hasConnectedSwagger(connections: readonly Connection[], scope: Scope): boolean {
  return Boolean(scope.workspaceId && scope.projectId) && connections.some((connection) =>
    connection.workspaceId === scope.workspaceId && connection.projectId === scope.projectId &&
    connection.provider === "swagger" && connection.enabled);
}
