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
    currentValidWorldPos: null as THREE.Vector3 | null,
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
          stateRef.current.currentValidWorldPos = new THREE.Vector3(...node.position);
        } else {
          stateRef.current.currentValidPos = null;
          stateRef.current.currentValidWorldPos = null;
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

      const floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
      const intersectPoint = new THREE.Vector3();
      raycaster.ray.intersectPlane(floorPlane, intersectPoint);

      if (intersectPoint) {
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

        const worldPos = new THREE.Vector3(intersectPoint.x, newY, intersectPoint.z);

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

        const targetWorldMatrix = new THREE.Matrix4();
        const euler = new THREE.Euler(...(dragNode.rotation || [0, 0, 0]));
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
          stateRef.current.currentValidWorldPos = worldPos.clone();
        }

        setDragState(dragNodeId, newPosArray, !validation.isValid);
      }
    };

    const handlePointerUp = () => {
      const { dragNodeId, isColliding, currentValidPos, currentValidWorldPos, tree, hasMoved } =
        stateRef.current;
      if (!dragNodeId) return;

      const dragNode = findNode(tree, dragNodeId);

      if (dragNode && currentValidPos && !isColliding && hasMoved) {
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
          updateNode(dragNodeId, { position: currentValidPos });
        }
      }

      stateRef.current.dragNodeId = null;
      stateRef.current.isColliding = false;
      setDragState(null, null, false);

      const controls = get().controls as unknown as { enabled: boolean } | null;
      if (controls) controls.enabled = true;
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [camera, scene, pointer, raycaster, setDragState, updateNode, reparentNode, get]);

  return null;
}

export { DragDropHandler };
