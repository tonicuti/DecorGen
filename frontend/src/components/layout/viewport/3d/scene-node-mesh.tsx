import { Edges, Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { ArrowRightLeft, MoreHorizontal, RotateCcw, RotateCw, Trash2 } from "lucide-react";
import { useRef } from "react";
import * as THREE from "three";
import { checkWallVisibility } from "@/components/layout/viewport/3d/camera";
import { useSceneStore } from "@/store/use-scene-store";
import type { SceneNode, WallDef } from "@/types";

function isOpeningOnHiddenWall(
  node: SceneNode,
  walls: WallDef[],
  cameraPosition: THREE.Vector3,
  currentPos?: [number, number, number] | null
): boolean {
  if (node.placementType !== "opening" && node.placementType !== "wall") return false;
  const posToCheck = currentPos || node.position;
  if (!posToCheck) return false;

  const margin = 0.35;

  let isOnAnyHiddenWall = false;
  let isOnAnyVisibleWall = false;

  for (const wall of walls) {
    const nodeAxisVal = posToCheck[wall.axis === "x" ? 0 : 2];
    const wallAxisVal = wall.position[wall.axis === "x" ? 0 : 2];

    if (Math.abs(nodeAxisVal - wallAxisVal) < margin) {
      const wallVisible = checkWallVisibility(wall.position, cameraPosition, wall.normal);
      if (wallVisible) {
        isOnAnyVisibleWall = true;
      } else {
        isOnAnyHiddenWall = true;
      }
    }
  }

  if (isOnAnyHiddenWall && !isOnAnyVisibleWall) {
    return true;
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
  const dragRotation = useSceneStore((state) => state.dragRotation);
  const isColliding = useSceneStore((state) => state.isColliding);
  const collidingWithIds = useSceneStore((state) => state.collidingWithIds);
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

    const currentPos = isBeingDragged && dragPosition ? dragPosition : node.position;
    if ((node.placementType === "opening" || node.placementType === "wall") && currentPos) {
      const isHidden = isOpeningOnHiddenWall(
        node,
        walls,
        camera.position,
        currentPos as [number, number, number]
      );
      const isCollidingWithMe = useSceneStore.getState().collidingWithIds.includes(node.id);
      groupRef.current.visible = !isHidden || isCollidingWithMe;
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
  const flipX = scale[0] < 0 ? -1 : 1;
  const absScale = [Math.abs(scale[0]), Math.abs(scale[1]), Math.abs(scale[2])] as [
    number,
    number,
    number,
  ];
  const isDoor = node.assetId?.includes("door") || node.name.toLowerCase().includes("door");
  const currentPos = isBeingDragged && dragPosition ? dragPosition : node.position || [0, 0, 0];
  const currentRot = isBeingDragged && dragRotation ? dragRotation : node.rotation || [0, 0, 0];
  const highlightColliding = (isBeingDragged && isColliding) || collidingWithIds.includes(node.id);
  const edgeColor = highlightColliding ? "#ff0000" : "#00ffff";

  return (
    <group
      ref={groupRef}
      position={currentPos}
      rotation={currentRot}
      scale={absScale}
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

          if (isSelected && node.placementType !== "wall") {
            const setDragState = useSceneStore.getState().setDragState;
            setDragState(
              node.id,
              node.position as [number, number, number],
              node.rotation as [number, number, number],
              false,
              []
            );
          }
        }}
        receiveShadow
        castShadow
      >
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial
          color={highlightColliding ? "#ffaaaa" : node.color || "#cccccc"}
          roughness={node.roughness !== undefined ? node.roughness / 100 : 0.5}
          metalness={node.metalness !== undefined ? node.metalness / 100 : 0.5}
          transparent={highlightColliding}
          opacity={highlightColliding ? 0.8 : 1}
          polygonOffset={node.placementType === "opening" ? true : false}
          polygonOffsetFactor={node.placementType === "opening" ? -1 : 0}
          polygonOffsetUnits={node.placementType === "opening" ? -1 : 0}
        />
        {isSelected && (
          <Edges
            scale={1.02}
            threshold={15}
            color={edgeColor}
            depthTest={node.placementType === "opening"}
          />
        )}
        {isSelected && node.placementType !== "wall" && (
          <Html position={[0, h / 2, 0]} center zIndexRange={[100, 0]}>
            <div
              style={{ marginTop: "-80px" }}
              className="pointer-events-auto flex gap-1.5 rounded-full border border-zinc-200 bg-white/95 px-1.5 py-1 shadow-xl backdrop-blur-md dark:border-zinc-700/80 dark:bg-zinc-900/90"
            >
              {node.placementType !== "opening" && (
                <>
                  <button
                    type="button"
                    className="group cursor-pointer rounded-full p-2 transition-all hover:bg-violet-100 active:scale-95 dark:hover:bg-violet-500/20"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      window.dispatchEvent(
                        new CustomEvent("request-rotation", { detail: { angle: -90 } })
                      );
                    }}
                    title="Rotate Left (90°)"
                  >
                    <RotateCcw className="h-4 w-4 text-zinc-600 transition-colors group-hover:text-violet-600 dark:text-zinc-400 dark:group-hover:text-violet-400" />
                  </button>
                  <div className="my-1.5 w-px bg-zinc-200 dark:bg-zinc-700/80" />
                  <button
                    type="button"
                    className="group cursor-pointer rounded-full p-2 transition-all hover:bg-violet-100 active:scale-95 dark:hover:bg-violet-500/20"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      window.dispatchEvent(
                        new CustomEvent("request-rotation", { detail: { angle: 90 } })
                      );
                    }}
                    title="Rotate Right (90°)"
                  >
                    <RotateCw className="h-4 w-4 text-zinc-600 transition-colors group-hover:text-violet-600 dark:text-zinc-400 dark:group-hover:text-violet-400" />
                  </button>
                  <div className="my-1.5 w-px bg-zinc-200 dark:bg-zinc-700/80" />
                </>
              )}
              {isDoor && (
                <>
                  <button
                    type="button"
                    className="group cursor-pointer rounded-full p-2 transition-all hover:bg-violet-100 active:scale-95 dark:hover:bg-violet-500/20"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      window.dispatchEvent(
                        new CustomEvent("request-flip", { detail: { id: node.id } })
                      );
                    }}
                    title="Flip Door Swing"
                  >
                    <ArrowRightLeft className="h-4 w-4 text-zinc-600 transition-colors group-hover:text-violet-600 dark:text-zinc-400 dark:group-hover:text-violet-400" />
                  </button>
                  <div className="my-1.5 w-px bg-zinc-200 dark:bg-zinc-700/80" />
                </>
              )}
              <button
                type="button"
                className="group cursor-pointer rounded-full p-2 transition-all hover:bg-red-100 active:scale-95 dark:hover:bg-red-500/20"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  window.dispatchEvent(
                    new CustomEvent("request-delete", { detail: { id: node.id } })
                  );
                }}
                title="Delete Object"
              >
                <Trash2 className="h-4 w-4 text-zinc-600 transition-colors group-hover:text-red-600 dark:text-zinc-400 dark:group-hover:text-red-400" />
              </button>
              <div className="my-1.5 w-px bg-zinc-200 dark:bg-zinc-700/80" />
              <button
                type="button"
                className="group cursor-pointer rounded-full p-2 transition-all hover:bg-blue-100 active:scale-95 dark:hover:bg-blue-500/20"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  window.dispatchEvent(new CustomEvent("open-inspector"));
                }}
                title="Object Properties"
              >
                <MoreHorizontal className="h-4 w-4 text-zinc-600 transition-colors group-hover:text-blue-600 dark:text-zinc-400 dark:group-hover:text-blue-400" />
              </button>
            </div>
          </Html>
        )}
      </mesh>
      {isSelected && isDoor && (
        <group
          position={[(-w / 2) * flipX, -h / 2 + 0.01, d / 2]}
          rotation={[Math.PI / 2, 0, 0]}
          scale={[flipX, 1, 1]}
        >
          <mesh>
            <ringGeometry args={[0, w, 32, 1, 0, Math.PI / 2]} />
            <meshBasicMaterial color="#00ffff" transparent opacity={0.15} side={THREE.DoubleSide} />
          </mesh>
          <mesh>
            <ringGeometry args={[w - 0.015, w, 32, 1, 0, Math.PI / 2]} />
            <meshBasicMaterial color="#00ffff" transparent opacity={0.5} side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[0, w / 2, 0]} rotation={[0, 0, Math.PI / 2]}>
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
