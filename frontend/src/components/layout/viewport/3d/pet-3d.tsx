import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import {
  collectObstacleBoxes,
  isCircleBlocked,
  resolveCircleObstacleCollisions,
} from "@/lib/circle-collision";
import { useSceneStore } from "@/store/use-scene-store";

const PET_RADIUS = 0.14;
const PET_SPEED = 0.55; // m/s
const WALL_MARGIN = 0.2;
/** Probe distance ahead of the nose used to detect upcoming collisions. */
const LOOKAHEAD = 0.22;
const TURN_SPEED = 4; // rad/s
/** Furniture taller than this blocks the pet (rugs/mats stay walkable). */
const PET_STEP_OVER = 0.08;
/** The pet never walks under anything lower than its back. */
const PET_BACK_HEIGHT = 0.3;

const BODY_COLOR = "#d9904a";
const ACCENT_COLOR = "#f5e6cf";
const DARK_COLOR = "#3f2d20";

interface PetBrain {
  mode: "walk" | "idle";
  /** Seconds until the next mode/heading decision. */
  timer: number;
  heading: number;
  targetHeading: number;
  /** Gait cycle driving the leg swing and body bob. */
  phase: number;
}

const randomBetween = (min: number, max: number) => min + Math.random() * (max - min);

const shortestAngleDiff = (from: number, to: number) => {
  const diff = (to - from + Math.PI * 3) % (Math.PI * 2) - Math.PI;
  return diff;
};

function Leg({
  position,
  swingRef,
}: {
  position: [number, number, number];
  swingRef: (group: THREE.Group | null) => void;
}) {
  return (
    <group ref={swingRef} position={position}>
      <mesh position={[0, -0.055, 0]} castShadow>
        <boxGeometry args={[0.05, 0.11, 0.05]} />
        <meshStandardMaterial color={BODY_COLOR} roughness={0.9} />
      </mesh>
    </group>
  );
}

/**
 * Blocky companion dog that wanders the floor, swings its legs, wags its
 * tail and steers away from furniture bounding boxes before touching them.
 */
function Pet3D() {
  const tree = useSceneStore((state) => state.tree);
  const roomDimensions = useSceneStore((state) => state.roomDimensions);

  const rootRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Group>(null);
  const tailRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const legRefs = useRef<(THREE.Group | null)[]>([null, null, null, null]);
  const brain = useRef<PetBrain>({
    mode: "walk",
    timer: randomBetween(2, 4),
    heading: Math.random() * Math.PI * 2,
    targetHeading: 0,
    phase: 0,
  });
  const clock = useRef(0);

  const obstacles = useMemo(
    () => collectObstacleBoxes(tree, PET_STEP_OVER, PET_BACK_HEIGHT),
    [tree]
  );

  const bounds = useMemo(
    () => ({
      maxX: Math.max(0, roomDimensions.width / 2 - WALL_MARGIN),
      maxZ: Math.max(0, roomDimensions.length / 2 - WALL_MARGIN),
    }),
    [roomDimensions]
  );

  const spawn = useMemo(() => {
    for (let attempt = 0; attempt < 40; attempt++) {
      const x = attempt === 0 ? 0 : randomBetween(-bounds.maxX, bounds.maxX);
      const z = attempt === 0 ? 0 : randomBetween(-bounds.maxZ, bounds.maxZ);
      if (!isCircleBlocked(x, z, PET_RADIUS, obstacles)) {
        return new THREE.Vector3(x, 0, z);
      }
    }
    return new THREE.Vector3(0, 0, 0);
    // Spawn once on summon; later tree edits are handled by frame push-out.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isFreeAhead = (x: number, z: number, heading: number) => {
    const px = x + Math.sin(heading) * (PET_RADIUS + LOOKAHEAD);
    const pz = z + Math.cos(heading) * (PET_RADIUS + LOOKAHEAD);
    if (Math.abs(px) > bounds.maxX || Math.abs(pz) > bounds.maxZ) return false;
    return !isCircleBlocked(px, pz, PET_RADIUS, obstacles);
  };

  const pickFreeHeading = (x: number, z: number) => {
    for (let attempt = 0; attempt < 16; attempt++) {
      const candidate = Math.random() * Math.PI * 2;
      if (isFreeAhead(x, z, candidate)) return candidate;
    }
    return null;
  };

  useFrame((_, delta) => {
    const root = rootRef.current;
    if (!root) return;

    const state = brain.current;
    clock.current += delta;
    state.timer -= delta;

    // --- decisions ---
    if (state.timer <= 0) {
      if (state.mode === "walk" && Math.random() < 0.35) {
        state.mode = "idle";
        state.timer = randomBetween(1, 2.5);
      } else {
        state.mode = "walk";
        state.timer = randomBetween(1.5, 3.5);
        const next = pickFreeHeading(root.position.x, root.position.z);
        if (next !== null) {
          state.targetHeading = next;
        } else {
          state.mode = "idle";
          state.timer = randomBetween(1, 2);
        }
      }
    }

    let walking = state.mode === "walk";

    if (walking) {
      // Obstacle ahead: steer to a new free direction before touching it.
      if (!isFreeAhead(root.position.x, root.position.z, state.heading)) {
        const next = pickFreeHeading(root.position.x, root.position.z);
        if (next !== null) {
          state.targetHeading = next;
        } else {
          state.mode = "idle";
          state.timer = randomBetween(1, 2);
          walking = false;
        }
      }

      const diff = shortestAngleDiff(state.heading, state.targetHeading);
      state.heading += diff * Math.min(1, TURN_SPEED * delta);

      // Hold position while turning sharply so it pivots instead of drifting.
      const moving = Math.abs(diff) < Math.PI / 3;
      if (moving) {
        const nx = root.position.x + Math.sin(state.heading) * PET_SPEED * delta;
        const nz = root.position.z + Math.cos(state.heading) * PET_SPEED * delta;
        const resolved = resolveCircleObstacleCollisions(nx, nz, PET_RADIUS, obstacles);
        root.position.x = Math.max(-bounds.maxX, Math.min(bounds.maxX, resolved.x));
        root.position.z = Math.max(-bounds.maxZ, Math.min(bounds.maxZ, resolved.z));
      }
    } else {
      // Furniture may have been moved onto the idle pet; push it out.
      const resolved = resolveCircleObstacleCollisions(
        root.position.x,
        root.position.z,
        PET_RADIUS,
        obstacles
      );
      root.position.x = Math.max(-bounds.maxX, Math.min(bounds.maxX, resolved.x));
      root.position.z = Math.max(-bounds.maxZ, Math.min(bounds.maxZ, resolved.z));
    }

    root.rotation.y = state.heading;

    // --- animation ---
    state.phase = walking ? state.phase + delta * 9 : 0;
    const swing = walking ? Math.sin(state.phase) * 0.55 : 0;

    const [fl, fr, bl, br] = legRefs.current;
    if (fl) fl.rotation.x = swing;
    if (br) br.rotation.x = swing;
    if (fr) fr.rotation.x = -swing;
    if (bl) bl.rotation.x = -swing;

    if (bodyRef.current) {
      bodyRef.current.position.y = walking ? Math.abs(Math.sin(state.phase)) * 0.012 : 0;
    }
    if (tailRef.current) {
      const wagSpeed = walking ? 12 : 5;
      const wagAmp = walking ? 0.55 : 0.3;
      tailRef.current.rotation.y = Math.sin(clock.current * wagSpeed) * wagAmp;
    }
    if (headRef.current) {
      headRef.current.rotation.x = walking ? 0 : Math.sin(clock.current * 1.5) * 0.08;
    }
  });

  return (
    <group ref={rootRef} position={spawn}>
      <group ref={bodyRef}>
        {/* body */}
        <mesh position={[0, 0.17, -0.02]} castShadow>
          <boxGeometry args={[0.16, 0.13, 0.3]} />
          <meshStandardMaterial color={BODY_COLOR} roughness={0.9} />
        </mesh>
        {/* chest patch */}
        <mesh position={[0, 0.14, 0.1]} castShadow>
          <boxGeometry args={[0.12, 0.08, 0.08]} />
          <meshStandardMaterial color={ACCENT_COLOR} roughness={0.9} />
        </mesh>
        {/* head */}
        <group ref={headRef} position={[0, 0.29, 0.16]}>
          <mesh castShadow>
            <boxGeometry args={[0.15, 0.13, 0.13]} />
            <meshStandardMaterial color={BODY_COLOR} roughness={0.9} />
          </mesh>
          {/* snout */}
          <mesh position={[0, -0.025, 0.085]} castShadow>
            <boxGeometry args={[0.07, 0.05, 0.05]} />
            <meshStandardMaterial color={ACCENT_COLOR} roughness={0.9} />
          </mesh>
          {/* nose */}
          <mesh position={[0, -0.012, 0.112]}>
            <boxGeometry args={[0.025, 0.02, 0.01]} />
            <meshStandardMaterial color={DARK_COLOR} roughness={0.6} />
          </mesh>
          {/* eyes */}
          <mesh position={[-0.04, 0.02, 0.066]}>
            <boxGeometry args={[0.02, 0.025, 0.01]} />
            <meshStandardMaterial color={DARK_COLOR} roughness={0.4} />
          </mesh>
          <mesh position={[0.04, 0.02, 0.066]}>
            <boxGeometry args={[0.02, 0.025, 0.01]} />
            <meshStandardMaterial color={DARK_COLOR} roughness={0.4} />
          </mesh>
          {/* ears */}
          <mesh position={[-0.048, 0.082, -0.02]} castShadow>
            <boxGeometry args={[0.04, 0.05, 0.03]} />
            <meshStandardMaterial color="#b9763a" roughness={0.9} />
          </mesh>
          <mesh position={[0.048, 0.082, -0.02]} castShadow>
            <boxGeometry args={[0.04, 0.05, 0.03]} />
            <meshStandardMaterial color="#b9763a" roughness={0.9} />
          </mesh>
        </group>
        {/* legs: FL, FR, BL, BR */}
        <Leg position={[-0.055, 0.11, 0.1]} swingRef={(g) => (legRefs.current[0] = g)} />
        <Leg position={[0.055, 0.11, 0.1]} swingRef={(g) => (legRefs.current[1] = g)} />
        <Leg position={[-0.055, 0.11, -0.12]} swingRef={(g) => (legRefs.current[2] = g)} />
        <Leg position={[0.055, 0.11, -0.12]} swingRef={(g) => (legRefs.current[3] = g)} />
        {/* tail */}
        <group ref={tailRef} position={[0, 0.225, -0.17]}>
          <mesh position={[0, 0.03, -0.045]} rotation={[-0.7, 0, 0]} castShadow>
            <boxGeometry args={[0.045, 0.045, 0.12]} />
            <meshStandardMaterial color={BODY_COLOR} roughness={0.9} />
          </mesh>
        </group>
      </group>
    </group>
  );
}

export { Pet3D };
