import { useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import {
  clampSubtreePlanarToRoom,
  clampWorldPlanarToRoom,
  resolveTabletopFloorSupport,
  validatePlacement,
} from "@/lib/collision";
import { rotateYaw } from "@/lib/placement-rotate";
import {
  beginSceneHistoryGesture,
  cancelSceneHistoryGesture,
  endSceneHistoryGesture,
  isSceneHistoryGestureActive,
  useSceneStore,
} from "@/store/use-scene-store";
import { useWorkspaceStore } from "@/store/use-workspace-store";
import type { SceneNode } from "@/types";

const GRID_SNAP_STEP = 0.25;

function snapValue(value: number, enabled: boolean): number {
  if (!enabled) return value;
  return Math.round(value / GRID_SNAP_STEP) * GRID_SNAP_STEP;
}

const findNode = (nodes: SceneNode[], id: string): SceneNode | null => {
  for (const node of nodes) {
    if (node.id === id) return node;

    if (node.children) {
      const found = findNode(node.children, id);

      if (found) return found;
    }
  }

  return null;
};

function DragDropHandler() {
  const { camera, scene, pointer, raycaster, get } = useThree();
  const tree = useSceneStore((state) => state.tree);
  const roomDimensions = useSceneStore((state) => state.roomDimensions);
  const dragNodeId = useSceneStore((state) => state.dragNodeId);
  const setDragState = useSceneStore((state) => state.setDragState);
  const finalizeDragPlacement = useSceneStore((state) => state.finalizeDragPlacement);
  const cancelDragNode = useSceneStore((state) => state.cancelDragNode);

  const stateRef = useRef({
    tree,
    roomDimensions,
    dragNodeId,
    currentValidPos: null as [number, number, number] | null,
    originalPos: null as [number, number, number] | null,
    currentValidWorldPos: null as THREE.Vector3 | null,
    currentValidRotation: null as [number, number, number] | null,
    originalRot: null as [number, number, number] | null,
    isColliding: false,
    hasMoved: false,
  });

  useEffect(() => {
    stateRef.current.tree = tree;
    stateRef.current.roomDimensions = roomDimensions;

      if (stateRef.current.dragNodeId !== dragNodeId) {
      stateRef.current.dragNodeId = dragNodeId;

      if (dragNodeId) {
        if (!isSceneHistoryGestureActive()) {
          beginSceneHistoryGesture();
        }

        const node = findNode(tree, dragNodeId);

        if (node?.locked) {
          cancelDragNode(
            dragNodeId,
            useSceneStore.getState().isAddingNode,
            node.position ?? null,
            node.rotation ?? null
          );
          return;
        }

        if (node && node.position) {
          const spawnPos: [number, number, number] = [
            node.position[0],
            node.position[1],
            node.position[2],
          ];
          const spawnRot: [number, number, number] = node.rotation
            ? [node.rotation[0], node.rotation[1], node.rotation[2]]
            : [0, 0, 0];

          stateRef.current.currentValidPos = spawnPos;
          stateRef.current.originalPos = spawnPos;
          stateRef.current.currentValidWorldPos = new THREE.Vector3(...spawnPos);
          stateRef.current.currentValidRotation = spawnRot;
          stateRef.current.originalRot = spawnRot;

          const spawnMatrix = new THREE.Matrix4().compose(
            new THREE.Vector3(...spawnPos),
            new THREE.Quaternion().setFromEuler(new THREE.Euler(...spawnRot)),
            new THREE.Vector3(...(node.scale || [1, 1, 1]))
          );
          const spawnValidation = validatePlacement(
            node,
            spawnMatrix,
            tree,
            roomDimensions
          );
          stateRef.current.isColliding = !spawnValidation.isValid;
          useSceneStore.getState().setDragState(
            dragNodeId,
            spawnPos,
            spawnRot,
            !spawnValidation.isValid,
            spawnValidation.collidingWith
          );
        } else {
          stateRef.current.currentValidPos = null;
          stateRef.current.originalPos = null;
          stateRef.current.currentValidWorldPos = null;
          stateRef.current.currentValidRotation = null;
          stateRef.current.originalRot = null;
        }

        stateRef.current.isColliding = false;
        stateRef.current.hasMoved = false;

        const controls = get().controls as unknown as { enabled: boolean } | null;
        if (controls) controls.enabled = false;
      } else {
        const controls = get().controls as unknown as { enabled: boolean } | null;
        if (controls) controls.enabled = true;
      }
    }
  }, [tree, roomDimensions, dragNodeId, get]);

  useEffect(() => {
    const handlePointerMove = () => {
      const { dragNodeId, tree, roomDimensions } = stateRef.current;
      if (!dragNodeId) return;

      stateRef.current.hasMoved = true;

      const dragNode = findNode(tree, dragNodeId);
      if (!dragNode) return;

      raycaster.setFromCamera(pointer, camera);

      let worldPos: THREE.Vector3 | null = null;
      let newRotation =
        stateRef.current.currentValidRotation ?? dragNode.rotation ?? [0, 0, 0];

      if (dragNode.placementType === "opening" || dragNode.placementType === "wall") {
        const intersects = raycaster.intersectObjects(scene.children, true);
        const hit = intersects.find((h) => h.object.userData?.isWall && h.object.visible);
        let hitWallPos: number[] | null = null;
        let hitWallNormal: THREE.Vector3 | null = null;
        let hitWallAxis: "x" | "z" | null = null;
        const targetPoint = new THREE.Vector3();

        if (hit) {
          targetPoint.copy(hit.point);
          hitWallPos = hit.object.userData.wallPosition;
          hitWallNormal = hit.object.userData.wallNormal;
          hitWallAxis = hit.object.userData.wallAxis;
        } else {
          const floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

          if (raycaster.ray.intersectPlane(floorPlane, targetPoint)) {
            let closestDist = Infinity;

            scene.traverse((child) => {
              if (child.userData?.isWall && child.visible) {
                const wallAxis = child.userData.wallAxis;
                const wallPos = child.userData.wallPosition;
                const dist =
                  wallAxis === "x"
                    ? Math.abs(targetPoint.x - wallPos[0])
                    : Math.abs(targetPoint.z - wallPos[2]);

                if (dist < closestDist) {
                  closestDist = dist;
                  hitWallPos = wallPos;
                  hitWallNormal = child.userData.wallNormal;
                  hitWallAxis = wallAxis;
                }
              }
            });
          }
        }

        if (hitWallPos && hitWallNormal && hitWallAxis) {
          const { w = 1, d = 0.1 } = dragNode.dimensions || {};
          const h = dragNode.dimensions?.h || 1;
          const isDoor =
            dragNode.assetId?.includes("door") || dragNode.name.toLowerCase().includes("door");
          let newX = targetPoint.x;
          let newY = targetPoint.y;
          let newZ = targetPoint.z;
          const halfRoomW = roomDimensions.width / 2;
          const halfRoomL = roomDimensions.length / 2;
          const roomH = roomDimensions.height;
          const tMeters = roomDimensions.thickness / 100;

          if (hitWallAxis === "x") {
            newX = hitWallPos[0] + hitWallNormal.x * (tMeters / 2 + d / 2);
            newZ = Math.max(-halfRoomL + w / 2, Math.min(halfRoomL - w / 2, newZ));
          } else {
            newZ = hitWallPos[2] + hitWallNormal.z * (tMeters / 2 + d / 2);
            newX = Math.max(-halfRoomW + w / 2, Math.min(halfRoomW - w / 2, newX));
          }

          if (isDoor) {
            newY = h / 2;
          } else {
            newY = Math.max(h / 2, Math.min(roomH - h / 2, newY));
          }

          worldPos = new THREE.Vector3(newX, newY, newZ);
          newRotation = [0, Math.atan2(hitWallNormal.x, hitWallNormal.z), 0];
        }
      } else {
        const floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
        const intersectPoint = new THREE.Vector3();

        if (raycaster.ray.intersectPlane(floorPlane, intersectPoint)) {
          const h = dragNode.dimensions?.h || 1;
          let newY = h / 2;

          if (dragNode.placementType === "tabletop") {
            const support = resolveTabletopFloorSupport(
              dragNode,
              dragNodeId,
              intersectPoint.x,
              intersectPoint.z,
              [newRotation[0], newRotation[1], newRotation[2]],
              tree
            );
            newY = support.centerY;
          }

          worldPos = new THREE.Vector3(intersectPoint.x, newY, intersectPoint.z);
        }
      }

      if (worldPos) {
        let parentSpace: THREE.Object3D | null = null;
        scene.traverse((child) => {
          if (child.userData?.nodeGroup === dragNodeId) {
            parentSpace = child.parent || null;
          }
        });

        const localPos = worldPos.clone();
        if (parentSpace) {
          (parentSpace as THREE.Object3D).worldToLocal(localPos);
        }

        const gridSnapping = useWorkspaceStore.getState().gridSnapping;
        let newPosArray: [number, number, number] = [localPos.x, localPos.y, localPos.z];
        if (gridSnapping && dragNode.placementType === "floor") {
          newPosArray = [
            snapValue(newPosArray[0], true),
            newPosArray[1],
            snapValue(newPosArray[2], true),
          ];
        }
        const newRotArray: [number, number, number] = [
          newRotation[0],
          newRotation[1],
          newRotation[2],
        ];

        const validatedLocalPos = new THREE.Vector3(...newPosArray);

        const targetWorldMatrix = new THREE.Matrix4();
        const euler = new THREE.Euler(...newRotArray);
        const quaternion = new THREE.Quaternion().setFromEuler(euler);
        const localMatrix = new THREE.Matrix4().compose(
          validatedLocalPos,
          quaternion,
          new THREE.Vector3(...(dragNode.scale || [1, 1, 1]))
        );

        if (parentSpace) {
          targetWorldMatrix.multiplyMatrices(
            (parentSpace as THREE.Object3D).matrixWorld,
            localMatrix
          );
        } else {
          targetWorldMatrix.copy(localMatrix);
        }

        let clampedWorldMatrix = targetWorldMatrix;
        if (dragNode.placementType === "floor" || dragNode.placementType === "tabletop") {
          clampedWorldMatrix = clampSubtreePlanarToRoom(
            dragNode,
            targetWorldMatrix,
            roomDimensions
          );
        }

        const clampedWorldPos = new THREE.Vector3();
        clampedWorldMatrix.decompose(
          clampedWorldPos,
          new THREE.Quaternion(),
          new THREE.Vector3()
        );

        const localAfterClamp = clampedWorldPos.clone();
        if (parentSpace) {
          (parentSpace as THREE.Object3D).worldToLocal(localAfterClamp);
        }
        newPosArray = [localAfterClamp.x, localAfterClamp.y, localAfterClamp.z];

        const validation = validatePlacement(dragNode, clampedWorldMatrix, tree, roomDimensions);

        stateRef.current.isColliding = !validation.isValid;
        if (validation.isValid) {
          stateRef.current.currentValidPos = newPosArray;
          stateRef.current.currentValidRotation = newRotArray;
          stateRef.current.currentValidWorldPos = clampedWorldPos;
        }

        setDragState(
          dragNodeId,
          newPosArray,
          newRotArray,
          !validation.isValid,
          validation.collidingWith
        );
      }
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (e.button === 2) return;

      const {
        dragNodeId,
        isColliding,
        currentValidPos,
        currentValidRotation,
        currentValidWorldPos,
        tree,
        hasMoved,
      } = stateRef.current;
      if (!dragNodeId) return;

      const isAdding = useSceneStore.getState().isAddingNode;

      if (isColliding || !currentValidPos) {
        cancelDrag();
        return;
      }

      // Allow click-to-place at spawn (center) without moving the pointer first.
      if (!hasMoved && !isAdding) {
        cancelDrag();
        return;
      }

      const dragNode = findNode(tree, dragNodeId);

      if (dragNode) {
        if (!hasMoved && isAdding) {
          const validation = validatePlacement(
            dragNode,
            new THREE.Matrix4().compose(
              new THREE.Vector3(...currentValidPos),
              new THREE.Quaternion().setFromEuler(
                new THREE.Euler(...(currentValidRotation || [0, 0, 0]))
              ),
              new THREE.Vector3(...(dragNode.scale || [1, 1, 1]))
            ),
            tree,
            useSceneStore.getState().roomDimensions
          );
          if (!validation.isValid) {
            cancelDrag();
            return;
          }
        }

        if (dragNode.placementType === "tabletop" && currentValidWorldPos) {
          const roomDimensions = useSceneStore.getState().roomDimensions;
          const dropRotation = currentValidRotation || dragNode.rotation || [0, 0, 0];
          const clampedWorldPos = clampWorldPlanarToRoom(
            dragNode,
            currentValidWorldPos.clone(),
            dropRotation,
            roomDimensions
          );

          const support = resolveTabletopFloorSupport(
            dragNode,
            dragNodeId,
            clampedWorldPos.x,
            clampedWorldPos.z,
            dropRotation,
            tree
          );
          const targetParentId = support.floorNodeId || "group-1";
          let newParentSpace: THREE.Object3D | null = null;

          scene.traverse((child) => {
            if (child.userData?.nodeGroup === targetParentId) {
              newParentSpace = child;
            }
          });

          const dropWorldMatrix = new THREE.Matrix4().compose(
            clampedWorldPos,
            new THREE.Quaternion().setFromEuler(new THREE.Euler(...dropRotation)),
            new THREE.Vector3(...(dragNode.scale || [1, 1, 1]))
          );
          const dropValidation = validatePlacement(
            dragNode,
            dropWorldMatrix,
            tree,
            roomDimensions
          );
          if (!dropValidation.isValid) {
            cancelDrag();
            return;
          }

          const localPos = clampedWorldPos.clone();
          if (newParentSpace) {
            (newParentSpace as THREE.Object3D).worldToLocal(localPos);
          }

          const finalPosArray: [number, number, number] = [localPos.x, localPos.y, localPos.z];
          finalizeDragPlacement({
            nodeId: dragNodeId,
            position: finalPosArray,
            rotation: currentValidRotation || undefined,
            parentId: targetParentId,
          });
        } else {
          finalizeDragPlacement({
            nodeId: dragNodeId,
            position: currentValidPos,
            rotation: currentValidRotation || undefined,
          });
        }
      }

      stateRef.current.dragNodeId = null;
      endSceneHistoryGesture();

      const controls = get().controls as unknown as { enabled: boolean } | null;
      if (controls) controls.enabled = true;
    };

    const cancelDrag = () => {
      const { dragNodeId, originalPos, originalRot } = stateRef.current;
      if (!dragNodeId) return;

      const isAdding = useSceneStore.getState().isAddingNode;

      useSceneStore.getState().cancelDragNode(dragNodeId, isAdding, originalPos, originalRot);

      stateRef.current.dragNodeId = null;
      cancelSceneHistoryGesture();

      const controls = get().controls as unknown as { enabled: boolean } | null;
      if (controls) controls.enabled = true;
    };

    const rotateDragBy = (deltaDeg: number) => {
      const { dragNodeId, tree } = stateRef.current;
      if (!dragNodeId) return;

      const dragNode = findNode(tree, dragNodeId);
      if (
        !dragNode ||
        dragNode.placementType === "opening" ||
        dragNode.placementType === "wall"
      ) {
        return;
      }

      const base =
        stateRef.current.currentValidRotation ??
        (dragNode.rotation as [number, number, number] | undefined) ??
        [0, 0, 0];
      const newRot = rotateYaw(base, deltaDeg);

      stateRef.current.currentValidRotation = newRot;
      useSceneStore.getState().updateNode(dragNodeId, { rotation: newRot });
      handlePointerMove();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target;
      if (
        target instanceof HTMLElement &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }

      if (stateRef.current.dragNodeId) {
        if (e.key === "q" || e.key === "Q" || e.key === "[") {
          e.preventDefault();
          rotateDragBy(-90);
          return;
        }
        if (e.key === "e" || e.key === "E" || e.key === "]") {
          e.preventDefault();
          rotateDragBy(90);
          return;
        }
        if (e.key === "f" || e.key === "F") {
          e.preventDefault();
          rotateDragBy(180);
          return;
        }
      }

      if (e.key === "Escape" && stateRef.current.dragNodeId) {
        cancelDrag();
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      if (stateRef.current.dragNodeId) {
        e.preventDefault();
        cancelDrag();
      }
    };

    const handleDragRotate = (e: Event) => {
      const angle = (e as CustomEvent<{ angle: number }>).detail?.angle;
      if (typeof angle !== "number") return;
      rotateDragBy(angle);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("contextmenu", handleContextMenu);
    window.addEventListener("drag-rotate", handleDragRotate as EventListener);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("contextmenu", handleContextMenu);
      window.removeEventListener("drag-rotate", handleDragRotate as EventListener);
    };
  }, [camera, scene, pointer, raycaster, setDragState, finalizeDragPlacement, get]);

  return null;
}

export { DragDropHandler };
