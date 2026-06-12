import { Edges, Html, useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import {
  ArrowRightLeft,
  FlipHorizontal2,
  MoreHorizontal,
  RotateCcw,
  RotateCw,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { clone } from "three/examples/jsm/utils/SkeletonUtils.js";
import { checkWallVisibility } from "@/components/layout/viewport/3d/camera";
import { Button } from "@/components/ui/button";
import { beginSceneHistoryGesture, useSceneStore } from "@/store/use-scene-store";
import type { SceneNode, WallDef } from "@/types";

type Dimensions = NonNullable<SceneNode["dimensions"]>;

const DRAG_START_THRESHOLD_PX = 5;

function canLoadGlbUrl(url?: string): url is string {
  if (!url) return false;
  if (!url.toLowerCase().endsWith(".glb")) return false;

  // The mock data still points to /models/..., which is not served by this app.
  // Backend search results point to served /inputs/... assets or /outputs/template/... rooms.
  return (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("/inputs/") ||
    url.startsWith("/outputs/template/")
  );
}

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

function getModelFitTransform(model: THREE.Object3D, dimensions: Dimensions) {
  model.updateWorldMatrix(true, true);

  const box = new THREE.Box3().setFromObject(model);
  const sourceSize = box.getSize(new THREE.Vector3());
  const sourceCenter = box.getCenter(new THREE.Vector3());

  const safeSize = {
    x: sourceSize.x > 0 ? sourceSize.x : 1,
    y: sourceSize.y > 0 ? sourceSize.y : 1,
    z: sourceSize.z > 0 ? sourceSize.z : 1,
  };

  const scale = new THREE.Vector3(
    dimensions.w / safeSize.x,
    dimensions.h / safeSize.y,
    dimensions.d / safeSize.z
  );
  const offset = sourceCenter.multiply(scale).multiplyScalar(-1);

  return {
    offset,
    scale: [scale.x, scale.y, scale.z] as [number, number, number],
  };
}

function GlbModel({ url, dimensions }: { url: string; dimensions: Dimensions }) {
  const gltf = useGLTF(url);

  const { scene, offset, scale } = useMemo(() => {
    const cloned = clone(gltf.scene);

    cloned.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.castShadow = true;
        object.receiveShadow = true;
      }
    });

    return { scene: cloned, ...getModelFitTransform(cloned, dimensions) };
  }, [gltf.scene, dimensions.d, dimensions.h, dimensions.w]);

  return <primitive object={scene} position={offset} scale={scale} />;
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
  const isAddingNode = useSceneStore((state) => state.isAddingNode);
  const isSelected = selectedIds.includes(node.id);
  const isBeingDragged = dragNodeId === node.id;
  const showFloatingToolbar = isSelected && !(isAddingNode && isBeingDragged);
  const groupRef = useRef<THREE.Group>(null);
  const pointerSessionRef = useRef<{ moved: boolean; cleanup: () => void } | null>(null);

  const clearPointerSession = () => {
    pointerSessionRef.current?.cleanup();
    pointerSessionRef.current = null;
  };

  useEffect(() => () => clearPointerSession(), []);

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
  const isOpening = node.placementType === "opening";
  const isWall = node.placementType === "wall";
  const isDoor = node.assetId?.includes("door") || node.name.toLowerCase().includes("door");
  const currentPos = isBeingDragged && dragPosition ? dragPosition : node.position || [0, 0, 0];
  const currentRot = isBeingDragged && dragRotation ? dragRotation : node.rotation || [0, 0, 0];
  const highlightColliding = (isBeingDragged && isColliding) || collidingWithIds.includes(node.id);
  const edgeColor = highlightColliding ? "#ff0000" : "#00ffff";
  const glbUrl = canLoadGlbUrl(node.glbUrl) ? node.glbUrl : null;
  const showPlaceholder = !glbUrl || highlightColliding;

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
          if (useSceneStore.getState().walkthroughMode) return;
          e.stopPropagation();

          const moved = pointerSessionRef.current?.moved ?? false;
          const activeDragId = useSceneStore.getState().dragNodeId;
          clearPointerSession();

          if (moved || activeDragId === node.id) return;

          setSelectedIds([node.id]);
        }}
        onPointerDown={(e) => {
          if (!groupRef.current?.visible) return;
          if (useSceneStore.getState().walkthroughMode) return;
          e.stopPropagation();
          clearPointerSession();

          if (!isSelected || node.locked) return;

          const startX = e.clientX;
          const startY = e.clientY;

          const onPointerMove = (ev: PointerEvent) => {
            if (pointerSessionRef.current?.moved) return;
            const dist = Math.hypot(ev.clientX - startX, ev.clientY - startY);
            if (dist < DRAG_START_THRESHOLD_PX) return;

            if (pointerSessionRef.current) {
              pointerSessionRef.current.moved = true;
            }

            clearPointerSession();
            beginSceneHistoryGesture();
            useSceneStore.getState().setDragState(
              node.id,
              node.position as [number, number, number],
              node.rotation as [number, number, number],
              false,
              []
            );
          };

          const onPointerUp = () => clearPointerSession();

          window.addEventListener("pointermove", onPointerMove);
          window.addEventListener("pointerup", onPointerUp, { once: true });

          pointerSessionRef.current = {
            moved: false,
            cleanup: () => {
              window.removeEventListener("pointermove", onPointerMove);
              window.removeEventListener("pointerup", onPointerUp);
            },
          };
        }}
        receiveShadow
        castShadow
      >
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial
          color={highlightColliding ? "#ffaaaa" : node.color || "#cccccc"}
          roughness={node.roughness !== undefined ? node.roughness / 100 : 0.5}
          metalness={node.metalness !== undefined ? node.metalness / 100 : 0.5}
          transparent={!showPlaceholder || highlightColliding}
          opacity={showPlaceholder ? (highlightColliding ? 0.35 : 1) : 0}
          depthWrite={showPlaceholder}
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
        {showFloatingToolbar && (
          <Html position={[0, h / 2, 0]} center zIndexRange={[100, 0]}>
            <div
              style={{ marginTop: "-80px" }}
              className="pointer-events-auto flex gap-1.5 rounded-full border border-zinc-200 bg-white/95 px-1.5 py-1 shadow-xl backdrop-blur-md dark:border-zinc-700/80 dark:bg-zinc-900/90"
            >
              {!isOpening && !isWall && (
                <>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="group rounded-full hover:bg-violet-100 dark:hover:bg-violet-500/20"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      window.dispatchEvent(
                        new CustomEvent("request-rotation", { detail: { angle: -90 } })
                      );
                    }}
                    title="Rotate Left (90°)"
                  >
                    <RotateCcw className="h-4 w-4 text-zinc-600 group-hover:text-violet-600 dark:text-zinc-400 dark:group-hover:text-violet-400" />
                  </Button>
                  <div className="my-1.5 w-px bg-zinc-200 dark:bg-zinc-700/80" />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="group rounded-full hover:bg-violet-100 dark:hover:bg-violet-500/20"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      window.dispatchEvent(
                        new CustomEvent("request-rotation", { detail: { angle: 90 } })
                      );
                    }}
                    title="Rotate Right (90°)"
                  >
                    <RotateCw className="h-4 w-4 text-zinc-600 group-hover:text-violet-600 dark:text-zinc-400 dark:group-hover:text-violet-400" />
                  </Button>
                  <div className="my-1.5 w-px bg-zinc-200 dark:bg-zinc-700/80" />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="group rounded-full hover:bg-violet-100 dark:hover:bg-violet-500/20"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      window.dispatchEvent(
                        new CustomEvent("request-rotation", { detail: { angle: 180 } })
                      );
                    }}
                    title="Flip 180° (F)"
                  >
                    <FlipHorizontal2 className="h-4 w-4 text-zinc-600 group-hover:text-violet-600 dark:text-zinc-400 dark:group-hover:text-violet-400" />
                  </Button>
                  <div className="my-1.5 w-px bg-zinc-200 dark:bg-zinc-700/80" />
                </>
              )}
              {(isDoor || isWall) && (
                <>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="group rounded-full hover:bg-violet-100 dark:hover:bg-violet-500/20"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      window.dispatchEvent(
                        new CustomEvent("request-flip", { detail: { id: node.id } })
                      );
                    }}
                    title={isDoor ? "Flip Door Swing" : "Flip Object"}
                  >
                    <ArrowRightLeft className="h-4 w-4 text-zinc-600 group-hover:text-violet-600 dark:text-zinc-400 dark:group-hover:text-violet-400" />
                  </Button>
                  <div className="my-1.5 w-px bg-zinc-200 dark:bg-zinc-700/80" />
                </>
              )}
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="group rounded-full hover:bg-red-100 dark:hover:bg-red-500/20"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  window.dispatchEvent(
                    new CustomEvent("request-delete", { detail: { id: node.id } })
                  );
                }}
                title="Delete Object"
              >
                <Trash2 className="h-4 w-4 text-zinc-600 group-hover:text-red-600 dark:text-zinc-400 dark:group-hover:text-red-400" />
              </Button>
              <div className="my-1.5 w-px bg-zinc-200 dark:bg-zinc-700/80" />
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="group rounded-full hover:bg-blue-100 dark:hover:bg-blue-500/20"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  window.dispatchEvent(new CustomEvent("open-inspector"));
                }}
                title="Object Properties"
              >
                <MoreHorizontal className="h-4 w-4 text-zinc-600 group-hover:text-blue-600 dark:text-zinc-400 dark:group-hover:text-blue-400" />
              </Button>
            </div>
          </Html>
        )}
      </mesh>
      {glbUrl && (
        <group rotation={node.assetId === "wooden_door" ? [0, Math.PI, 0] : [0, 0, 0]}>
          <GlbModel url={glbUrl} dimensions={{ w, h, d }} />
        </group>
      )}
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
