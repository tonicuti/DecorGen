import { getFlattenedNodesWithTransforms, getNodeWorldBounds } from "@/lib/collision";
import type { SceneNode } from "@/types";

export interface ObstacleBox {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

/**
 * Footprints (XZ AABBs) of furniture that blocks a walker whose body spans
 * the vertical range [minTop, maxBottom]: objects whose top is below minTop
 * can be stepped over, objects whose bottom is above maxBottom are passed under.
 */
export function collectObstacleBoxes(
  tree: SceneNode[],
  minTop: number,
  maxBottom: number
): ObstacleBox[] {
  const boxes: ObstacleBox[] = [];

  for (const { node, worldMatrix } of getFlattenedNodesWithTransforms(tree)) {
    if (node.type !== "model" || node.visible === false) continue;
    if (node.placementType === "ceiling" || node.placementType === "opening") continue;

    const box = getNodeWorldBounds(node, worldMatrix);
    const blocksBody = box.max.y >= minTop && box.min.y <= maxBottom;
    if (!blocksBody) continue;

    boxes.push({ minX: box.min.x, maxX: box.max.x, minZ: box.min.z, maxZ: box.max.z });
  }

  return boxes;
}

/** True if a circle at (px, pz) overlaps any obstacle box. */
export function isCircleBlocked(
  px: number,
  pz: number,
  radius: number,
  obstacles: ObstacleBox[]
): boolean {
  for (const box of obstacles) {
    const closestX = Math.max(box.minX, Math.min(box.maxX, px));
    const closestZ = Math.max(box.minZ, Math.min(box.maxZ, pz));
    const dx = px - closestX;
    const dz = pz - closestZ;
    if (dx * dx + dz * dz < radius * radius) return true;
  }
  return false;
}

/** Circle-vs-AABB resolution on the XZ plane; slides along box edges. */
export function resolveCircleObstacleCollisions(
  px: number,
  pz: number,
  radius: number,
  obstacles: ObstacleBox[]
): { x: number; z: number } {
  for (let pass = 0; pass < 3; pass++) {
    let collided = false;

    for (const box of obstacles) {
      const closestX = Math.max(box.minX, Math.min(box.maxX, px));
      const closestZ = Math.max(box.minZ, Math.min(box.maxZ, pz));
      const dx = px - closestX;
      const dz = pz - closestZ;
      const distSq = dx * dx + dz * dz;

      if (distSq >= radius * radius) continue;
      collided = true;

      if (distSq > 1e-8) {
        const dist = Math.sqrt(distSq);
        const push = (radius - dist) / dist;
        px += dx * push;
        pz += dz * push;
      } else {
        // Center inside the box: exit through the nearest face.
        const toLeft = px - (box.minX - radius);
        const toRight = box.maxX + radius - px;
        const toBack = pz - (box.minZ - radius);
        const toFront = box.maxZ + radius - pz;
        const min = Math.min(toLeft, toRight, toBack, toFront);

        if (min === toLeft) px = box.minX - radius;
        else if (min === toRight) px = box.maxX + radius;
        else if (min === toBack) pz = box.minZ - radius;
        else pz = box.maxZ + radius;
      }
    }

    if (!collided) break;
  }

  return { x: px, z: pz };
}
