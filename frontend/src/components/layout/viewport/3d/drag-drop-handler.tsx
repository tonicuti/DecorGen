import { useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { validatePlacement } from "@/lib/collision";
import { useSceneStore } from "@/store/use-scene-store";
import type { SceneNode } from "@/types";

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
  const updateNode = useSceneStore((state) => state.updateNode);
  const reparentNode = useSceneStore((state) => state.reparentNode);

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
        const node = findNode(tree, dragNodeId);

        if (node && node.position) {
          stateRef.current.currentValidPos = [...node.position] as [number, number, number];
          stateRef.current.originalPos = [...node.position] as [number, number, number];
          stateRef.current.currentValidWorldPos = new THREE.Vector3(...node.position);
          stateRef.current.currentValidRotation = node.rotation
            ? ([...node.rotation] as [number, number, number])
            : [0, 0, 0];
          stateRef.current.originalRot = stateRef.current.currentValidRotation;
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
      let newRotation = dragNode.rotation || [0, 0, 0];

      if (dragNode.placementType === "opening") {
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
            const intersects = raycaster.intersectObjects(scene.children, true);
            let hoverTarget: SceneNode | null = null;
            let highestY = 0;

            for (const hit of intersects) {
              const hitNodeId = hit.object.userData?.nodeId;

              if (hitNodeId && hitNodeId !== dragNodeId) {
                const hoverNode = findNode(tree, hitNodeId);

                if (hoverNode && hoverNode.placementType === "floor") {
                  hoverTarget = hoverNode;
                  const hoverWorldMatrix = new THREE.Matrix4();
                  hoverWorldMatrix.copy(hit.object.matrixWorld);
                  const hoverBox = new THREE.Box3();
                  hoverBox.setFromObject(hit.object);
                  highestY = hoverBox.max.y + h / 2;
                  break;
                }
              }
            }

            if (hoverTarget) {
              newY = highestY;
            } else {
              newY = h / 2;
            }
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

        const newPosArray: [number, number, number] = [localPos.x, localPos.y, localPos.z];
        const newRotArray: [number, number, number] = [
          newRotation[0],
          newRotation[1],
          newRotation[2],
        ];

        const targetWorldMatrix = new THREE.Matrix4();
        const euler = new THREE.Euler(...newRotArray);
        const quaternion = new THREE.Quaternion().setFromEuler(euler);
        const localMatrix = new THREE.Matrix4().compose(
          localPos,
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

        const validation = validatePlacement(dragNode, targetWorldMatrix, tree, roomDimensions);

        stateRef.current.isColliding = !validation.isValid;
        if (validation.isValid) {
          stateRef.current.currentValidPos = newPosArray;
          stateRef.current.currentValidRotation = newRotArray;
          stateRef.current.currentValidWorldPos = worldPos.clone();
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

      if (isColliding || !currentValidPos || !hasMoved) {
        cancelDrag();
        return;
      }

      const dragNode = findNode(tree, dragNodeId);

      if (dragNode) {
        if (dragNode.placementType === "tabletop" && currentValidWorldPos) {
          raycaster.setFromCamera(pointer, camera);
          const intersects = raycaster.intersectObjects(scene.children, true);
          let hoverNodeId: string | null = null;

          for (const hit of intersects) {
            const hitId = hit.object.userData?.nodeId;

            if (hitId && hitId !== dragNodeId) {
              const hitNode = findNode(tree, hitId);

              if (hitNode && hitNode.placementType === "floor") {
                hoverNodeId = hitId;
                break;
              }
            }
          }

          const targetParentId = hoverNodeId || "group-1";
          let newParentSpace: THREE.Object3D | null = null;

          scene.traverse((child) => {
            if (child.userData?.nodeGroup === targetParentId) {
              newParentSpace = child;
            }
          });

          const localPos = currentValidWorldPos.clone();
          if (newParentSpace) {
            (newParentSpace as THREE.Object3D).worldToLocal(localPos);
          }

          const finalPosArray: [number, number, number] = [localPos.x, localPos.y, localPos.z];
          reparentNode(dragNodeId, targetParentId, finalPosArray);
        } else {
          updateNode(dragNodeId, {
            position: currentValidPos,
            rotation: currentValidRotation || undefined,
          });
        }
      }

      useSceneStore.getState().setIsAddingNode(false);
      stateRef.current.dragNodeId = null;
      setDragState(null, null, null, false, []);

      const controls = get().controls as unknown as { enabled: boolean } | null;
      if (controls) controls.enabled = true;
    };

    const cancelDrag = () => {
      const { dragNodeId, originalPos, originalRot } = stateRef.current;
      if (!dragNodeId) return;

      const isAdding = useSceneStore.getState().isAddingNode;

      useSceneStore.getState().cancelDragNode(dragNodeId, isAdding, originalPos, originalRot);

      stateRef.current.dragNodeId = null;

      const controls = get().controls as unknown as { enabled: boolean } | null;
      if (controls) controls.enabled = true;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
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

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("contextmenu", handleContextMenu);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("contextmenu", handleContextMenu);
    };
  }, [camera, scene, pointer, raycaster, setDragState, updateNode, reparentNode, get]);

  return null;
}

export { DragDropHandler };
