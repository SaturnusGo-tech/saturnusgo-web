import type { Delivery, Snapshot } from "../../model/connector-types";

export function reportRepublishAvailable(snapshot: Snapshot, delivery: Delivery) {
  const connection = snapshot.connection;
  return Boolean(connection?.provider === "confluence" && connection.enabled && snapshot.etag
    && delivery.direction === "outbound" && delivery.event === "run.complete" && delivery.status === "delivered"
    && snapshot.links.some((link) => link.connectionId === connection.id && link.workspaceId === connection.workspaceId
      && link.projectId === connection.projectId && link.targetType === "run" && link.targetId === delivery.targetId));
}
