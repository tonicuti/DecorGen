import * as THREE from "three";
import type { CollisionResult, NodeWithWorldMatrix, SceneDimensions, SceneNode } from "@/types";

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

export function validatePlacement(
  targetNode: SceneNode,
  targetWorldMatrix: THREE.Matrix4,
  tree: SceneNode[],
  roomDimensions: SceneDimensions
): CollisionResult {
  const targetAABB = getBoundingBox(targetNode, targetWorldMatrix);

  const result: CollisionResult = {
    isValid: true,
    isColliding: false,
    isOutOfBounds: false,
    violatesClearance: false,
    collidingWith: [],
  };

  const halfW = roomDimensions.width / 2;
  const halfL = roomDimensions.length / 2;
  let tol = 0.01;

  if (targetNode.placementType === "opening" || targetNode.placementType === "wall") {
    tol = roomDimensions.thickness + 0.01;
  }

  if (
    targetAABB.min.x < -halfW - tol ||
    targetAABB.max.x > halfW + tol ||
    targetAABB.min.z < -halfL - tol ||
    targetAABB.max.z > halfL + tol ||
    targetAABB.min.y < -0.01 ||
    targetAABB.max.y > roomDimensions.height + 0.01
  ) {
    result.isOutOfBounds = true;
    result.isValid = false;
  }

  const collisionAABB = targetAABB.clone();
  if (
    targetNode.placementType === "opening" &&
    (targetNode.assetId?.includes("door") || targetNode.name.toLowerCase().includes("door"))
  ) {
    const doorW = targetNode.dimensions?.w || 1;
    const doorH = targetNode.dimensions?.h || 2;
    const localBox = new THREE.Box3();

    localBox.min.set(-doorW / 2, -doorH / 2, -doorW);
    localBox.max.set(doorW / 2, doorH / 2, doorW);
    collisionAABB.copy(localBox).applyMatrix4(targetWorldMatrix);
  }

  const allNodesData = getFlattenedNodesWithTransforms(tree);

  const doors = allNodesData.filter(
    (n) =>
      n.node.placementType === "opening" &&
      (n.node.assetId?.includes("door") || n.node.name.toLowerCase().includes("door"))
  );
  for (const doorData of doors) {
    if (doorData.node.id === targetNode.id) continue;

    const doorW = doorData.node.dimensions?.w || 1;
    const doorH = doorData.node.dimensions?.h || 2;

    const clearanceBox = new THREE.Box3();
    const localBox = new THREE.Box3();
    localBox.min.set(-doorW / 2, -doorH / 2, -doorW);
    localBox.max.set(doorW / 2, doorH / 2, doorW);

    clearanceBox.copy(localBox).applyMatrix4(doorData.worldMatrix);

    if (collisionAABB.intersectsBox(clearanceBox)) {
      result.violatesClearance = true;
      result.isValid = false;
      result.collidingWith.push(doorData.node.id);
    }
  }

  for (const nodeData of allNodesData) {
    const node = nodeData.node;
    if (node.id === targetNode.id) continue;
    if (node.type !== "model") continue;
    if (node.placementType === "wall") continue;

    const nodeAABB = getBoundingBox(node, nodeData.worldMatrix);

    if (collisionAABB.intersectsBox(nodeAABB)) {
      const isTargetDoor =
        targetNode.placementType === "opening" &&
        (targetNode.assetId?.includes("door") || targetNode.name.toLowerCase().includes("door"));
      const isNodeDoor =
        node.placementType === "opening" &&
        (node.assetId?.includes("door") || node.name.toLowerCase().includes("door"));

      const isTargetTabletopOnGround =
        targetNode.placementType === "tabletop" && targetAABB.min.y < 0.1;
      const isNodeTabletopOnGround = node.placementType === "tabletop" && nodeAABB.min.y < 0.1;

      const isDoorTabletopCollisionOnGround =
        (isTargetDoor && isNodeTabletopOnGround) || (isNodeDoor && isTargetTabletopOnGround);

      if (
        (targetNode.placementType !== "tabletop" && node.placementType !== "tabletop") ||
        isDoorTabletopCollisionOnGround
      ) {
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
