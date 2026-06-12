import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { checkWallVisibility } from "@/components/layout/viewport/3d/camera";
import { useSceneStore } from "@/store/use-scene-store";
import type { WallGroupProps } from "@/types";

function DynamicWallGroup({ position, args, color, normal, children }: WallGroupProps) {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const { camera } = useThree();

  useFrame(() => {
    if (!groupRef.current || !meshRef.current) return;

    // In walkthrough the camera is inside the room, so never hide walls.
    const isVisible =
      useSceneStore.getState().walkthroughMode ||
      checkWallVisibility(position, camera.position, normal);

    groupRef.current.visible = isVisible;
    meshRef.current.visible = isVisible;
  });

  return (
    <group ref={groupRef}>
      <mesh
        ref={meshRef}
        position={position}
        receiveShadow
        castShadow
        userData={{
          isWall: true,
          wallNormal: normal,
          wallPosition: position,
          wallAxis: normal.x !== 0 ? "x" : "z",
        }}
      >
        <boxGeometry args={args} />
        <meshStandardMaterial color={color} side={THREE.DoubleSide} />
      </mesh>
      {children}
    </group>
  );
}

export { DynamicWallGroup };