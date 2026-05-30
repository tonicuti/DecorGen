import { Edges } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { checkWallVisibility } from "@/components/layout/viewport/3d/camera";
import { useSceneStore } from "@/store/use-scene-store";
import type { SceneNode, WallDef } from "@/types";

function isOpeningOnHiddenWall(
  node: SceneNode,
  walls: WallDef[],
  cameraPosition: THREE.Vector3
): boolean {
  if (node.placementType !== "opening" && node.placementType !== "wall") return false;
  if (!node.position) return false;

  const margin = 0.35;

  for (const wall of walls) {
    const nodeAxisVal = node.position[wall.axis === "x" ? 0 : 2];
    const wallAxisVal = wall.position[wall.axis === "x" ? 0 : 2];

    if (Math.abs(nodeAxisVal - wallAxisVal) < margin) {
      const wallVisible = checkWallVisibility(wall.position, cameraPosition, wall.normal);
      if (!wallVisible) return true;
    }
  }

  return false;
}

function SceneNodeMesh({
  node,
  parentVisible = true,
  walls,
}: {
  node: SceneNode;
  parentVisible?: boolean;
  walls: WallDef[];
}) {
  const selectedIds = useSceneStore((state) => state.selectedIds);
  const setSelectedIds = useSceneStore((state) => state.setSelectedIds);
  const dragNodeId = useSceneStore((state) => state.dragNodeId);
  const dragPosition = useSceneStore((state) => state.dragPosition);
  const isColliding = useSceneStore((state) => state.isColliding);
  const isSelected = selectedIds.includes(node.id);
  const isBeingDragged = dragNodeId === node.id;
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ camera }) => {
    if (!groupRef.current) return;

    const isVisible = parentVisible && node.visible;

    if (!isVisible) {
      groupRef.current.visible = false;
      return;
    }

    if ((node.placementType === "opening" || node.placementType === "wall") && node.position) {
      groupRef.current.visible = !isOpeningOnHiddenWall(node, walls, camera.position);
    } else {
      groupRef.current.visible = true;
    }
  });

  if (node.type === "camera" || node.type === "light") {
    return null;
  }

  if (node.type === "group") {
    return (
      <group
        ref={groupRef}
        position={node.position || [0, 0, 0]}
        rotation={node.rotation || [0, 0, 0]}
        userData={{ nodeGroup: node.id }}
      >
        {node.children?.map((child) => (
          <SceneNodeMesh
            key={child.id}
            node={child}
            parentVisible={parentVisible && node.visible}
            walls={walls}
          />
        ))}
      </group>
    );
  }

  const w = node.dimensions?.w || 1;
  const h = node.dimensions?.h || 1;
  const d = node.dimensions?.d || 1;
  const scale = node.scale || [1, 1, 1];
  const isDoor = node.assetId?.includes("door") || node.name.toLowerCase().includes("door");
  const currentPos = isBeingDragged && dragPosition ? dragPosition : node.position || [0, 0, 0];
  const highlightColliding = isBeingDragged && isColliding;
  const edgeColor = highlightColliding ? "#ff0000" : "#00ffff";

  return (
    <group
      ref={groupRef}
      position={currentPos}
      rotation={node.rotation || [0, 0, 0]}
      scale={scale}
      userData={{ nodeGroup: node.id }}
    >
      <mesh
        userData={{ nodeId: node.id }}
        onClick={(e) => {
          if (!groupRef.current?.visible) return;
          e.stopPropagation();
          setSelectedIds([node.id]);
        }}
        onPointerDown={(e) => {
          if (!groupRef.current?.visible) return;

          e.stopPropagation();

          if (isSelected && node.placementType !== "wall" && node.placementType !== "opening") {
            const setDragState = useSceneStore.getState().setDragState;
            setDragState(node.id, node.position as [number, number, number], false);
          }
        }}
        receiveShadow
        castShadow
      >
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial
          color={highlightColliding ? "#ffaaaa" : node.color || "#cccccc"}
          transparent={highlightColliding}
          opacity={highlightColliding ? 0.8 : 1}
        />
        {isSelected && <Edges scale={1.02} threshold={15} color={edgeColor} depthTest={false} />}
      </mesh>
      {isSelected && isDoor && (
        <group position={[-w / 2, -h / 2 + 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <mesh>
            <ringGeometry args={[0, w, 32, 1, 0, Math.PI / 2]} />
            <meshBasicMaterial color="#00ffff" transparent opacity={0.15} side={THREE.DoubleSide} />
          </mesh>
          <mesh>
            <ringGeometry args={[w - 0.015, w, 32, 1, 0, Math.PI / 2]} />
            <meshBasicMaterial color="#00ffff" transparent opacity={0.5} side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[w / 2, 0, 0]} rotation={[0, 0, 0]}>
            <boxGeometry args={[w, 0.01, 0.001]} />
            <meshBasicMaterial color="#00ffff" transparent opacity={0.5} />
          </mesh>
        </group>
      )}
      {node.children?.map((child) => (
        <SceneNodeMesh
          key={child.id}
          node={child}
          parentVisible={parentVisible && node.visible}
          walls={walls}
        />
      ))}
    </group>
  );
}

export { SceneNodeMesh };
