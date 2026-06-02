import type { SceneNode } from "@/types";

type Dimensions = NonNullable<SceneNode["dimensions"]>;

/** Yaw (rad) so the long footprint edge runs along room X when depth > width. */
export function getDefaultFloorYaw(w: number, d: number): number {
  return d > w * 1.05 ? Math.PI / 2 : 0;
}

export function getPlacementSpawnPose(
  dimensions: Dimensions,
  placementType: SceneNode["placementType"] = "floor"
): { position: [number, number, number]; rotation: [number, number, number] } {
  const { w, h, d } = dimensions;
  const y = placementType === "floor" || placementType === "tabletop" ? h / 2 : h / 2;

  if (placementType === "floor") {
    return {
      position: [0, y, 0],
      rotation: [0, getDefaultFloorYaw(w, d), 0],
    };
  }

  return {
    position: [0, y, 0],
    rotation: [0, 0, 0],
  };
}
