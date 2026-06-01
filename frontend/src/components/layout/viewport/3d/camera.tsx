import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { useSceneStore } from "@/store/use-scene-store";

function checkWallVisibility(
  wallPosition: [number, number, number] | THREE.Vector3,
  cameraPosition: THREE.Vector3,
  wallNormal: THREE.Vector3
): boolean {
  const wallPos =
    wallPosition instanceof THREE.Vector3
      ? wallPosition.clone()
      : new THREE.Vector3(...wallPosition);

  const viewVector = wallPos.sub(cameraPosition).normalize();
  const isOutside = viewVector.dot(wallNormal) > 0;

  return !isOutside;
}

function CameraRig() {
  const { cameraState, setCameraState, sceneSettings } = useSceneStore();
  const cameraFov = sceneSettings.cameraFov;
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera>(null);
  const [animatingHome, setAnimatingHome] = useState(false);
  const targetZoom = useRef<number>(0);
  const lastState = useRef({ position: cameraState.position, target: cameraState.target });

  useEffect(() => {
    const onHome = () => {
      setAnimatingHome(true);
      targetZoom.current = 0;
    };

    const onZoom = (e: CustomEvent<number>) => {
      setAnimatingHome(false);
      targetZoom.current += e.detail * 1.5;
    };

    window.addEventListener("camera-home", onHome as EventListener);
    window.addEventListener("camera-zoom", onZoom as EventListener);

    return () => {
      window.removeEventListener("camera-home", onHome as EventListener);
      window.removeEventListener("camera-zoom", onZoom as EventListener);
    };
  }, []);

  useEffect(() => {
    return () => {
      setCameraState(
        lastState.current.position as [number, number, number],
        lastState.current.target as [number, number, number]
      );
    };
  }, [setCameraState]);

  useFrame(() => {
    if (!controlsRef.current || !cameraRef.current) return;

    if (animatingHome) {
      const defaultPos = new THREE.Vector3(0, 4, 6);
      const defaultTarget = new THREE.Vector3(0, 1.4, 0);

      cameraRef.current.position.lerp(defaultPos, 0.05);
      controlsRef.current.target.lerp(defaultTarget, 0.05);
      controlsRef.current.update();

      if (cameraRef.current.position.distanceTo(defaultPos) < 0.01) {
        setAnimatingHome(false);
      }
    }

    if (Math.abs(targetZoom.current) > 0.01) {
      const dir = new THREE.Vector3().subVectors(
        controlsRef.current.target,
        cameraRef.current.position
      );
      const step = targetZoom.current * 0.1;

      if (dir.length() > 1 || step < 0) {
        cameraRef.current.position.add(dir.normalize().multiplyScalar(step));
        controlsRef.current.update();
      }

      targetZoom.current *= 0.8;
      if (Math.abs(targetZoom.current) < 0.01) {
        targetZoom.current = 0;
      }
    }
  });

  return (
    <>
      <PerspectiveCamera ref={cameraRef} makeDefault position={cameraState.position} fov={cameraFov} />
      <OrbitControls
        ref={controlsRef}
        target={cameraState.target}
        makeDefault
        maxPolarAngle={Math.PI / 2}
        enableDamping={true}
        dampingFactor={0.05}
        panSpeed={0.5}
        rotateSpeed={0.5}
        zoomSpeed={0.5}
        onChange={() => {
          if (cameraRef.current && controlsRef.current) {
            lastState.current.position = cameraRef.current.position.toArray();
            lastState.current.target = controlsRef.current.target.toArray();
          }
        }}
      />
    </>
  );
}

export { checkWallVisibility, CameraRig };
