import * as THREE from "three";
import type { CollisionResult, NodeWithWorldMatrix, SceneDimensions, SceneNode } from "@/types";

const getWallClearance = (node: SceneNode) => {
  if (node.placementType !== "floor") return 0;
  if (node.wallClearance !== undefined) return Math.max(0, node.wallClearance);
  if (node.assetId === "wooden_display_shelves_01") return 0.02;
  return 0;
};

const getPlanarExtents = (node: SceneNode, yaw: number) => {
  const w = node.dimensions?.w || 1;
  const d = node.dimensions?.d || 1;
  const cos = Math.abs(Math.cos(yaw));
  const sin = Math.abs(Math.sin(yaw));
  return {
    extentX: (w * cos + d * sin) / 2,
    extentZ: (w * sin + d * cos) / 2,
    clearance: getWallClearance(node),
  };
};

/** Clamp world X/Z so floor and tabletop models stay inside the room footprint. */
export function clampWorldPlanarToRoom(
  node: SceneNode,
  worldPos: THREE.Vector3,
  rotation: [number, number, number],
  roomDimensions: SceneDimensions
): THREE.Vector3 {
  if (node.placementType !== "floor" && node.placementType !== "tabletop") {
    return worldPos.clone();
  }

  const quaternion = new THREE.Quaternion().setFromEuler(new THREE.Euler(...rotation));
  const scale = new THREE.Vector3(...(node.scale || [1, 1, 1]));
  const worldMatrix = new THREE.Matrix4().compose(worldPos, quaternion, scale);
  const clamped = clampSubtreePlanarToRoom(node, worldMatrix, roomDimensions);

  const result = worldPos.clone();
  clamped.decompose(result, new THREE.Quaternion(), new THREE.Vector3());
  return result;
};

export function clampFloorPositionToRoom(
  node: SceneNode,
  position: [number, number, number],
  rotation: [number, number, number] | undefined,
  roomDimensions: SceneDimensions
): [number, number, number] {
  if (node.placementType !== "floor") return position;

  const yaw = rotation?.[1] ?? node.rotation?.[1] ?? 0;
  const { extentX, extentZ, clearance } = getPlanarExtents(node, yaw);
  const maxX = roomDimensions.width / 2 - extentX - clearance;
  const maxZ = roomDimensions.length / 2 - extentZ - clearance;

  if (maxX < 0 || maxZ < 0) {
    return [0, position[1], 0];
  }

  return [
    Math.max(-maxX, Math.min(maxX, position[0])),
    position[1],
    Math.max(-maxZ, Math.min(maxZ, position[2])),
  ];
};

const getBoundingBox = (node: SceneNode, worldMatrix: THREE.Matrix4) => {
  const w = node.dimensions?.w || 1;
  const h = node.dimensions?.h || 1;
  const d = node.dimensions?.d || 1;

  const box = new THREE.Box3();
  box.min.set(-w / 2, -h / 2, -d / 2);
  box.max.set(w / 2, h / 2, d / 2);

  box.applyMatrix4(worldMatrix);
  return box;
};

const composeNodeWorldMatrix = (
  node: SceneNode,
  parentWorldMatrix: THREE.Matrix4
): THREE.Matrix4 => {
  const matrix = new THREE.Matrix4();
  const euler = new THREE.Euler(...(node.rotation || [0, 0, 0]));
  const quaternion = new THREE.Quaternion().setFromEuler(euler);
  matrix.compose(
    new THREE.Vector3(...(node.position || [0, 0, 0])),
    quaternion,
    new THREE.Vector3(...(node.scale || [1, 1, 1]))
  );
  matrix.premultiply(parentWorldMatrix);
  return matrix;
};

const collectDescendantIds = (node: SceneNode): Set<string> => {
  const ids = new Set<string>();
  const visit = (n: SceneNode) => {
    for (const child of n.children || []) {
      ids.add(child.id);
      visit(child);
    }
  };
  visit(node);
  return ids;
};

/** Union world AABB of a model node and all model descendants. */
export function getSubtreeWorldBounds(
  rootNode: SceneNode,
  rootWorldMatrix: THREE.Matrix4
): THREE.Box3 {
  const union = new THREE.Box3();
  let hasBounds = false;

  const visit = (node: SceneNode, worldMatrix: THREE.Matrix4) => {
    if (node.type === "model") {
      const box = getBoundingBox(node, worldMatrix);
      if (!hasBounds) {
        union.copy(box);
        hasBounds = true;
      } else {
        union.union(box);
      }
    }

    for (const child of node.children || []) {
      visit(child, composeNodeWorldMatrix(child, worldMatrix));
    }
  };

  visit(rootNode, rootWorldMatrix);
  return union;
}

const getPlanarBoundsViolation = (
  box: THREE.Box3,
  roomDimensions: SceneDimensions,
  wallClearance: number
) => {
  const halfW = roomDimensions.width / 2;
  const halfL = roomDimensions.length / 2;

  let dx = 0;
  let dz = 0;

  if (box.min.x < -halfW + wallClearance - 0.01) {
    dx = -halfW + wallClearance - box.min.x;
  } else if (box.max.x > halfW - wallClearance + 0.01) {
    dx = halfW - wallClearance - box.max.x;
  }

  if (box.min.z < -halfL + wallClearance - 0.01) {
    dz = -halfL + wallClearance - box.min.z;
  } else if (box.max.z > halfL + wallClearance + 0.01) {
    dz = halfL - wallClearance - box.max.z;
  }

  return { dx, dz };
};

/** Shift a world matrix on X/Z so the node and its model children stay inside the room. */
export function clampSubtreePlanarToRoom(
  rootNode: SceneNode,
  rootWorldMatrix: THREE.Matrix4,
  roomDimensions: SceneDimensions
): THREE.Matrix4 {
  if (rootNode.placementType !== "floor" && rootNode.placementType !== "tabletop") {
    return rootWorldMatrix.clone();
  }

  const position = new THREE.Vector3();
  const quaternion = new THREE.Quaternion();
  const scale = new THREE.Vector3();
  rootWorldMatrix.decompose(position, quaternion, scale);

  const wallClearance = getWallClearance(rootNode);
  const bounds = getSubtreeWorldBounds(rootNode, rootWorldMatrix);
  const { dx, dz } = getPlanarBoundsViolation(bounds, roomDimensions, wallClearance);

  const adjusted = rootWorldMatrix.clone();
  if (dx !== 0 || dz !== 0) {
    position.x += dx;
    position.z += dz;
    adjusted.compose(position, quaternion, scale);
  }

  return adjusted;
};

const getFlattenedNodesWithTransforms = (
  nodes: SceneNode[],
  parentMatrix: THREE.Matrix4 = new THREE.Matrix4()
): NodeWithWorldMatrix[] => {
  return nodes.reduce((acc: NodeWithWorldMatrix[], node) => {
    const matrix = new THREE.Matrix4();
    const euler = new THREE.Euler(...(node.rotation || [0, 0, 0]));
    const quaternion = new THREE.Quaternion().setFromEuler(euler);
    matrix.compose(
      new THREE.Vector3(...(node.position || [0, 0, 0])),
      quaternion,
      new THREE.Vector3(...(node.scale || [1, 1, 1]))
    );

    matrix.premultiply(parentMatrix);

    const current: NodeWithWorldMatrix = { node, worldMatrix: matrix };

    return [...acc, current, ...getFlattenedNodesWithTransforms(node.children || [], matrix)];
  }, []);
};

const isPointInsideXZ = (x: number, z: number, box: THREE.Box3, epsilon = 0.01) =>
  x >= box.min.x - epsilon &&
  x <= box.max.x + epsilon &&
  z >= box.min.z - epsilon &&
  z <= box.max.z + epsilon;

/**
 * Tabletop Y from floor-plane X/Z (plan view), not camera ray mesh hits.
 * Elevates only when the dragged center is over a floor furniture top.
 */
export function resolveTabletopFloorSupport(
  dragNode: SceneNode,
  dragNodeId: string,
  worldX: number,
  worldZ: number,
  rotation: [number, number, number],
  tree: SceneNode[]
): { centerY: number; floorNodeId: string | null } {
  const h = dragNode.dimensions?.h ?? 1;
  const floorCenterY = h / 2;
  const excludeIds = new Set<string>([dragNodeId, ...collectDescendantIds(dragNode)]);

  let bestSurfaceTop = -Infinity;
  let bestNodeId: string | null = null;

  for (const { node, worldMatrix } of getFlattenedNodesWithTransforms(tree)) {
    if (node.type !== "model" || node.placementType !== "floor") continue;
    if (excludeIds.has(node.id)) continue;

    const supportBox = getBoundingBox(node, worldMatrix);
    if (!isPointInsideXZ(worldX, worldZ, supportBox)) continue;

    if (supportBox.max.y > bestSurfaceTop) {
      bestSurfaceTop = supportBox.max.y;
      bestNodeId = node.id;
    }
  }

  if (bestNodeId === null) {
    return { centerY: floorCenterY, floorNodeId: null };
  }

  return { centerY: bestSurfaceTop + h / 2, floorNodeId: bestNodeId };
};

const isModelAabbOutOfRoom = (
  aabb: THREE.Box3,
  targetNode: SceneNode,
  roomDimensions: SceneDimensions
) => {
  const halfW = roomDimensions.width / 2;
  const halfL = roomDimensions.length / 2;
  const roomH = roomDimensions.height;
  const wallClearance = getWallClearance(targetNode);

  const isOutX =
    aabb.min.x < -halfW + wallClearance - 0.01 ||
    aabb.max.x > halfW - wallClearance + 0.01;
  const isOutZ =
    aabb.min.z < -halfL + wallClearance - 0.01 ||
    aabb.max.z > halfL + wallClearance + 0.01;
  const isOutY = aabb.min.y < -0.01 || aabb.max.y > roomH + 0.01;

  if (targetNode.placementType === "opening") {
    const wallTol = roomDimensions.thickness / 100 + 0.01;
    const isDeepOutX = aabb.min.x < -halfW - wallTol || aabb.max.x > halfW + wallTol;
    const isDeepOutZ = aabb.min.z < -halfL - wallTol || aabb.max.z > halfL + wallTol;

    return isDeepOutX || isDeepOutZ || isOutY || (isOutX && isOutZ);
  }

  return isOutX || isOutZ || isOutY;
};

export function validatePlacement(
  targetNode: SceneNode,
  targetWorldMatrix: THREE.Matrix4,
  tree: SceneNode[],
  roomDimensions: SceneDimensions
): CollisionResult {
  const targetAABB = getBoundingBox(targetNode, targetWorldMatrix);
  const descendantIds = collectDescendantIds(targetNode);

  const result: CollisionResult = {
    isValid: true,
    isColliding: false,
    isOutOfBounds: false,
    violatesClearance: false,
    collidingWith: [],
  };

  const boundsToCheck: THREE.Box3[] = [targetAABB];
  const visitDescendants = (node: SceneNode, parentWorldMatrix: THREE.Matrix4) => {
    for (const child of node.children || []) {
      const childWorldMatrix = composeNodeWorldMatrix(child, parentWorldMatrix);
      if (child.type === "model") {
        boundsToCheck.push(getBoundingBox(child, childWorldMatrix));
      }
      visitDescendants(child, childWorldMatrix);
    }
  };
  visitDescendants(targetNode, targetWorldMatrix);

  for (const aabb of boundsToCheck) {
    if (isModelAabbOutOfRoom(aabb, targetNode, roomDimensions)) {
      result.isOutOfBounds = true;
      result.isValid = false;
      break;
    }
  }

  const isDoorNode = (node: SceneNode) =>
    node.placementType === "opening" &&
    (node.assetId?.includes("door") || node.name.toLowerCase().includes("door"));

  const collisionBoxes = boundsToCheck.map((box) => box.clone());
  if (isDoorNode(targetNode)) {
    const doorW = targetNode.dimensions?.w || 1;
    const doorH = targetNode.dimensions?.h || 2;
    const localBox = new THREE.Box3();
    localBox.min.set(-doorW / 2, -doorH / 2, -doorW);
    localBox.max.set(doorW / 2, doorH / 2, doorW);
    collisionBoxes[0] = localBox.clone().applyMatrix4(targetWorldMatrix);
  }

  const allNodesData = getFlattenedNodesWithTransforms(tree);

  const doors = allNodesData.filter((n) => isDoorNode(n.node));

  for (const collisionAABB of collisionBoxes) {
    const shrunkCollisionAABB = collisionAABB.clone().expandByScalar(-0.001);

    for (const doorData of doors) {
      if (doorData.node.id === targetNode.id || descendantIds.has(doorData.node.id)) {
        continue;
      }

      const doorW = doorData.node.dimensions?.w || 1;
      const doorH = doorData.node.dimensions?.h || 2;
      const localBox = new THREE.Box3();
      localBox.min.set(-doorW / 2, -doorH / 2, -doorW);
      localBox.max.set(doorW / 2, doorH / 2, doorW);
      const clearanceBox = localBox.clone().applyMatrix4(doorData.worldMatrix);

      if (shrunkCollisionAABB.intersectsBox(clearanceBox)) {
        result.violatesClearance = true;
        result.isValid = false;
        if (!result.collidingWith.includes(doorData.node.id)) {
          result.collidingWith.push(doorData.node.id);
        }
      }
    }

    for (const nodeData of allNodesData) {
      const node = nodeData.node;
      if (node.id === targetNode.id || descendantIds.has(node.id)) continue;
      if (node.type !== "model") continue;

      const nodeAABB = getBoundingBox(node, nodeData.worldMatrix);
      const shrunkNodeAABB = nodeAABB.clone().expandByScalar(-0.001);

      if (shrunkCollisionAABB.intersectsBox(shrunkNodeAABB)) {
        result.isColliding = true;
        result.isValid = false;

        if (!result.collidingWith.includes(node.id)) {
          result.collidingWith.push(node.id);
        }
      }
    }
  }

  return result;
}

/** Count scene models that do not fit inside the room (out of bounds or overlapping). */
export function countInvalidPlacements(
  tree: SceneNode[],
  roomDimensions: SceneDimensions
): number {
  const allNodes = getFlattenedNodesWithTransforms(tree);
  let count = 0;

  for (const { node, worldMatrix } of allNodes) {
    if (node.type !== "model") continue;

    const result = validatePlacement(node, worldMatrix, tree, roomDimensions);
    if (!result.isValid) count += 1;
  }

  return count;
}
