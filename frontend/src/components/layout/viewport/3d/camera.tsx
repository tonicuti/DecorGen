import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { viewportCameraSync } from "@/lib/viewport-camera-sync";
import { useSceneStore } from "@/store/use-scene-store";

const FOV_MIN = 30;
const FOV_MAX = 90;

function clampFov(fov: number): number {
  return Math.round(Math.min(FOV_MAX, Math.max(FOV_MIN, fov)));
}

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
  const { gl } = useThree();
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera>(null);
  const [animatingHome, setAnimatingHome] = useState(false);
  const lastState = useRef({ position: cameraState.position, target: cameraState.target });

  const applyCameraFov = useCallback((next: number) => {
    const clamped = clampFov(next);
    const { sceneSettings: settings, setSceneSettings, updateNode } = useSceneStore.getState();

    if (settings.cameraFov !== clamped) {
      setSceneSettings({ cameraFov: clamped });
      updateNode("cam-1", { fov: clamped });
    }

    if (cameraRef.current && cameraRef.current.fov !== clamped) {
      cameraRef.current.fov = clamped;
      cameraRef.current.updateProjectionMatrix();
    }

    return clamped;
  }, []);

  useEffect(() => {
    const onHome = () => {
      setAnimatingHome(true);
    };

    const onZoom = (e: CustomEvent<number>) => {
      setAnimatingHome(false);
      applyCameraFov(useSceneStore.getState().sceneSettings.cameraFov - e.detail * 2);
    };

    window.addEventListener("camera-home", onHome as EventListener);
    window.addEventListener("camera-zoom", onZoom as EventListener);

    return () => {
      window.removeEventListener("camera-home", onHome as EventListener);
      window.removeEventListener("camera-zoom", onZoom as EventListener);
    };
  }, [applyCameraFov]);

  useEffect(() => {
    const dom = gl.domElement;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      setAnimatingHome(false);
      // Scroll up (deltaY < 0) → zoom in (lower FOV); scroll down → zoom out.
      const step = e.deltaY < 0 ? -2 : 2;
      applyCameraFov(useSceneStore.getState().sceneSettings.cameraFov + step);
    };

    dom.addEventListener("wheel", onWheel, { passive: false });
    return () => dom.removeEventListener("wheel", onWheel);
  }, [gl, applyCameraFov]);

  useEffect(() => {
    if (cameraRef.current) {
      cameraRef.current.fov = cameraFov;
      cameraRef.current.updateProjectionMatrix();
    }
  }, [cameraFov]);

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

    viewportCameraSync.position.copy(cameraRef.current.position);
    viewportCameraSync.quaternion.copy(cameraRef.current.quaternion);
    if (controlsRef.current) {
      viewportCameraSync.target.copy(controlsRef.current.target);
    }

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
        enableZoom={false}
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

