import type { RoomBoundary, SceneDimensions } from "@/types";

export function getRoomBoundary(dimensions: SceneDimensions): RoomBoundary {
  const { width, length, height, thickness } = dimensions;
  const tMeters = thickness / 100;

  return {
    minX: -width / 2 + tMeters,
    maxX: width / 2 - tMeters,
    minZ: -length / 2 + tMeters,
    maxZ: length / 2 - tMeters,
    minY: 0,
    maxY: height,
  };
}

export function clampPosition(
  pos: [number, number, number],
  boundary: RoomBoundary
): [number, number, number] {
  return [
    Math.max(boundary.minX, Math.min(boundary.maxX, pos[0])),
    Math.max(boundary.minY, Math.min(boundary.maxY, pos[1])),
    Math.max(boundary.minZ, Math.min(boundary.maxZ, pos[2])),
  ];
}
