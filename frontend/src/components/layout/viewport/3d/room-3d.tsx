import { useMemo } from "react";
import * as THREE from "three";
import { DynamicWallGroup } from "@/components/layout/viewport/3d/dynamic-wall-group";
import { SceneNodeMesh } from "@/components/layout/viewport/3d/scene-node-mesh";
import { useSceneStore } from "@/store/use-scene-store";
import type { WallDef } from "@/types";

function Room3D() {
  const { width, length, height, thickness } = useSceneStore((state) => state.roomDimensions);
  const { wallColor, floorColor } = useSceneStore((state) => state.roomMaterials);
  const tree = useSceneStore((state) => state.tree);
  const setSelectedIds = useSceneStore((state) => state.setSelectedIds);

  const tMeters = thickness / 100;

  const floorPosition: [number, number, number] = [0, -tMeters / 2, 0];
  const floorArgs: [number, number, number] = [width + tMeters * 2, tMeters, length + tMeters * 2];

  const leftPos: [number, number, number] = [-width / 2 - tMeters / 2, height / 2, 0];
  const leftArgs: [number, number, number] = [tMeters, height, length + tMeters * 2];
  const leftNormal = useMemo(() => new THREE.Vector3(1, 0, 0), []);

  const rightPos: [number, number, number] = [width / 2 + tMeters / 2, height / 2, 0];
  const rightArgs: [number, number, number] = [tMeters, height, length + tMeters * 2];
  const rightNormal = useMemo(() => new THREE.Vector3(-1, 0, 0), []);

  const backPos: [number, number, number] = [0, height / 2, -length / 2 - tMeters / 2];
  const backArgs: [number, number, number] = [width, height, tMeters];
  const backNormal = useMemo(() => new THREE.Vector3(0, 0, 1), []);

  const frontPos: [number, number, number] = [0, height / 2, length / 2 + tMeters / 2];
  const frontArgs: [number, number, number] = [width, height, tMeters];
  const frontNormal = useMemo(() => new THREE.Vector3(0, 0, -1), []);

  const walls: WallDef[] = useMemo(
    () => [
      { position: leftPos, normal: leftNormal, threshold: leftPos[0], axis: "x" },
      { position: rightPos, normal: rightNormal, threshold: rightPos[0], axis: "x" },
      { position: backPos, normal: backNormal, threshold: backPos[2], axis: "z" },
      { position: frontPos, normal: frontNormal, threshold: frontPos[2], axis: "z" },
    ],
    [leftPos, rightPos, backPos, frontPos, leftNormal, rightNormal, backNormal, frontNormal]
  );

  return (
    <group
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          setSelectedIds([]);
        }
      }}
    >
      <group>
        <mesh
          position={floorPosition}
          receiveShadow
          onClick={(e) => {
            e.stopPropagation();
            setSelectedIds([]);
          }}
        >
          <boxGeometry args={floorArgs} />
          <meshStandardMaterial color={floorColor} />
        </mesh>
      </group>
      <DynamicWallGroup position={leftPos} args={leftArgs} color={wallColor} normal={leftNormal} />
      <DynamicWallGroup
        position={rightPos}
        args={rightArgs}
        color={wallColor}
        normal={rightNormal}
      />
      <DynamicWallGroup position={backPos} args={backArgs} color={wallColor} normal={backNormal} />
      <DynamicWallGroup
        position={frontPos}
        args={frontArgs}
        color={wallColor}
        normal={frontNormal}
      />
      {tree.map((node) => (
        <SceneNodeMesh key={node.id} node={node} walls={walls} />
      ))}
    </group>
  );
}

export { Room3D };
