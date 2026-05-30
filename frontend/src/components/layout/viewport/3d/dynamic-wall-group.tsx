import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { checkWallVisibility } from "@/components/layout/viewport/3d/camera";
import type { WallGroupProps } from "@/types";

function DynamicWallGroup({ position, args, color, normal, children }: WallGroupProps) {
  const groupRef = useRef<THREE.Group>(null);
  const { camera } = useThree();

  useFrame(() => {
    if (!groupRef.current) return;
    groupRef.current.visible = checkWallVisibility(position, camera.position, normal);
  });

  return (
    <group ref={groupRef}>
      <mesh position={position} receiveShadow castShadow>
        <boxGeometry args={args} />
        <meshStandardMaterial color={color} side={THREE.DoubleSide} />
      </mesh>
      {children}
    </group>
  );
}

export { DynamicWallGroup };
