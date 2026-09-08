import { closestCenter, pointerWithin, type CollisionDetection } from "@dnd-kit/core";

export const widgetCollisions: CollisionDetection = (args) => {
  if (args.pointerCoordinates) {
    const hits = pointerWithin(args);
    return hits.length ? hits : closestCenter(args);
  }
  // Keyboard sorting places the widget at the target's leading corner. Centers
  // are misleading when a full-width panel is moved above a compact counter.
  return args.droppableContainers.flatMap((droppableContainer) => {
    const rect = args.droppableRects.get(droppableContainer.id);
    return rect ? [{ id: droppableContainer.id, data: { droppableContainer,
      value: Math.hypot(rect.left - args.collisionRect.left, rect.top - args.collisionRect.top),
    } }] : [];
  }).sort((a, b) => a.data.value - b.data.value);
};
