import { PerspectiveCamera, PointerLockControls } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { PointerLockControls as PointerLockControlsImpl } from "three-stdlib";
import { getFlattenedNodesWithTransforms, getNodeWorldBounds } from "@/lib/collision";
import { viewportCameraSync } from "@/lib/viewport-camera-sync";
import { useSceneStore } from "@/store/use-scene-store";

const EYE_HEIGHT = 1.6;
const WALK_SPEED = 2.2; // m/s
const SPRINT_MULTIPLIER = 2;
const WALL_MARGIN = 0.35;
const WALKTHROUGH_FOV = 72;
const PLAYER_RADIUS = 0.25;
/** Objects shorter than this (rugs, mats) can be stepped over. */
const STEP_OVER_HEIGHT = 0.35;
const GRAVITY = 9.81; // m/s²
const JUMP_VELOCITY = 3.1; // m/s → peak ~0.5m
/** Minimum head clearance to the ceiling at the jump apex. */
const CEILING_CLEARANCE = 0.15;

interface ObstacleBox {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

/** Circle-vs-AABB resolution on the XZ plane; slides along box edges. */
function resolveObstacleCollisions(px: number, pz: number, obstacles: ObstacleBox[]) {
  for (let pass = 0; pass < 3; pass++) {
    let collided = false;

    for (const box of obstacles) {
      const closestX = Math.max(box.minX, Math.min(box.maxX, px));
      const closestZ = Math.max(box.minZ, Math.min(box.maxZ, pz));
      const dx = px - closestX;
      const dz = pz - closestZ;
      const distSq = dx * dx + dz * dz;

      if (distSq >= PLAYER_RADIUS * PLAYER_RADIUS) continue;
      collided = true;

      if (distSq > 1e-8) {
        const dist = Math.sqrt(distSq);
        const push = (PLAYER_RADIUS - dist) / dist;
        px += dx * push;
        pz += dz * push;
      } else {
        // Center inside the box: exit through the nearest face.
        const toLeft = px - (box.minX - PLAYER_RADIUS);
        const toRight = box.maxX + PLAYER_RADIUS - px;
        const toBack = pz - (box.minZ - PLAYER_RADIUS);
        const toFront = box.maxZ + PLAYER_RADIUS - pz;
        const min = Math.min(toLeft, toRight, toBack, toFront);

        if (min === toLeft) px = box.minX - PLAYER_RADIUS;
        else if (min === toRight) px = box.maxX + PLAYER_RADIUS;
        else if (min === toBack) pz = box.minZ - PLAYER_RADIUS;
        else pz = box.maxZ + PLAYER_RADIUS;
      }
    }

    if (!collided) break;
  }

  return { x: px, z: pz };
}

const MOVE_KEYS = new Set([
  "KeyW",
  "KeyA",
  "KeyS",
  "KeyD",
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
]);

/**
 * View-only first-person walkthrough: pointer-lock look, WASD movement at eye
 * height, clamped inside the room walls. Unlocking (Esc) exits the mode.
 */
function WalkthroughControls() {
  const controlsRef = useRef<PointerLockControlsImpl>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera>(null);
  const pressed = useRef<Set<string>>(new Set());
  const sprinting = useRef(false);
  const jumpOffset = useRef(0);
  const verticalVelocity = useRef(0);

  const spawn = useMemo(() => {
    const { length, height } = useSceneStore.getState().roomDimensions;
    const eyeY = Math.min(EYE_HEIGHT, height - 0.2);
    return {
      position: [0, eyeY, Math.max(0, length / 2 - WALL_MARGIN - 0.2)] as [
        number,
        number,
        number,
      ],
      eyeY,
    };
  }, []);

  // The scene tree is static while walking (view-only mode), so the furniture
  // obstacle boxes only need to be computed once on entry.
  const obstacles = useMemo<ObstacleBox[]>(() => {
    const { tree } = useSceneStore.getState();
    const boxes: ObstacleBox[] = [];

    for (const { node, worldMatrix } of getFlattenedNodesWithTransforms(tree)) {
      if (node.type !== "model" || node.visible === false) continue;
      if (node.placementType === "ceiling" || node.placementType === "opening") continue;

      const box = getNodeWorldBounds(node, worldMatrix);
      const blocksBody = box.max.y >= STEP_OVER_HEIGHT && box.min.y <= spawn.eyeY;
      if (!blocksBody) continue;

      boxes.push({ minX: box.min.x, maxX: box.max.x, minZ: box.min.z, maxZ: box.max.z });
    }

    return boxes;
  }, [spawn]);

  useEffect(() => {
    cameraRef.current?.lookAt(0, spawn.eyeY, 0);
  }, [spawn]);

  // Enter pointer lock immediately; the click on the Walkthrough button still
  // counts as user activation. If the browser rejects (e.g. Esc-relock
  // cooldown), drei's default document click handler re-locks on next click.
  useEffect(() => {
    const id = requestAnimationFrame(() => controlsRef.current?.lock());
    return () => {
      cancelAnimationFrame(id);
      if (document.pointerLockElement) document.exitPointerLock();
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (MOVE_KEYS.has(e.code)) {
        e.preventDefault();
        pressed.current.add(e.code);
      }
      if (e.code === "Space") {
        e.preventDefault();
        const grounded = jumpOffset.current === 0;
        if (grounded && controlsRef.current?.isLocked) {
          verticalVelocity.current = JUMP_VELOCITY;
        }
      }
      if (e.key === "Shift") sprinting.current = true;
    };
    const onKeyUp = (e: KeyboardEvent) => {
      pressed.current.delete(e.code);
      if (e.key === "Shift") sprinting.current = false;
    };
    const onBlur = () => {
      pressed.current.clear();
      sprinting.current = false;
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
    };
  }, []);

  useFrame((_, delta) => {
    const camera = cameraRef.current;
    if (!camera) return;

    viewportCameraSync.position.copy(camera.position);
    viewportCameraSync.quaternion.copy(camera.quaternion);

    if (!controlsRef.current?.isLocked) return;

    const keys = pressed.current;
    const forwardInput =
      (keys.has("KeyW") || keys.has("ArrowUp") ? 1 : 0) -
      (keys.has("KeyS") || keys.has("ArrowDown") ? 1 : 0);
    const rightInput =
      (keys.has("KeyD") || keys.has("ArrowRight") ? 1 : 0) -
      (keys.has("KeyA") || keys.has("ArrowLeft") ? 1 : 0);

    let nextX = camera.position.x;
    let nextZ = camera.position.z;

    if (forwardInput !== 0 || rightInput !== 0) {
      const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
      forward.y = 0;
      forward.normalize();
      const right = new THREE.Vector3().crossVectors(forward, camera.up).normalize();

      const move = forward
        .multiplyScalar(forwardInput)
        .add(right.multiplyScalar(rightInput))
        .normalize()
        .multiplyScalar(WALK_SPEED * (sprinting.current ? SPRINT_MULTIPLIER : 1) * delta);

      nextX += move.x;
      nextZ += move.z;
    }

    const resolved = resolveObstacleCollisions(nextX, nextZ, obstacles);

    const { width, length, height } = useSceneStore.getState().roomDimensions;
    const maxX = Math.max(0, width / 2 - WALL_MARGIN);
    const maxZ = Math.max(0, length / 2 - WALL_MARGIN);

    if (verticalVelocity.current !== 0 || jumpOffset.current > 0) {
      verticalVelocity.current -= GRAVITY * delta;
      jumpOffset.current += verticalVelocity.current * delta;

      const maxOffset = Math.max(0, height - CEILING_CLEARANCE - spawn.eyeY);
      if (jumpOffset.current >= maxOffset) {
        jumpOffset.current = maxOffset;
        verticalVelocity.current = Math.min(0, verticalVelocity.current);
      }
      if (jumpOffset.current <= 0) {
        jumpOffset.current = 0;
        verticalVelocity.current = 0;
      }
    }

    camera.position.x = Math.max(-maxX, Math.min(maxX, resolved.x));
    camera.position.z = Math.max(-maxZ, Math.min(maxZ, resolved.z));
    camera.position.y = spawn.eyeY + jumpOffset.current;
  });

  return (
    <>
      <PerspectiveCamera
        ref={cameraRef}
        makeDefault
        position={spawn.position}
        fov={WALKTHROUGH_FOV}
      />
      <PointerLockControls
        ref={controlsRef}
        makeDefault
        onUnlock={() => useSceneStore.getState().setWalkthroughMode(false)}
      />
    </>
  );
}

export { WalkthroughControls };
