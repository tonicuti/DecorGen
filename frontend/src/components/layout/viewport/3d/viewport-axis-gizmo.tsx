import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { viewportCameraSync } from "@/lib/viewport-camera-sync";

/** Compact axes so X/Y/Z labels all fit inside the gizmo viewport. */
const AXIS_LEN = 0.5;
const SHAFT_RADIUS = 0.028;
const CONE_RADIUS = 0.065;
const CONE_HEIGHT = 0.1;
const LABEL_OFFSET = 0.05;
const LABEL_SCALE = 0.24;
const GIZMO_CAMERA_DISTANCE = 2.8;

const AXES: {
  dir: THREE.Vector3;
  color: string;
  label: string;
}[] = [
  { dir: new THREE.Vector3(1, 0, 0), color: "#ff4d4d", label: "X" },
  { dir: new THREE.Vector3(0, 1, 0), color: "#5ae05a", label: "Y" },
  { dir: new THREE.Vector3(0, 0, 1), color: "#5aabff", label: "Z" },
];

const labelTextureCache = new Map<string, THREE.CanvasTexture>();

function getLabelTexture(letter: string): THREE.CanvasTexture {
  const cached = labelTextureCache.get(letter);
  if (cached) return cached;

  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    const fallback = new THREE.CanvasTexture(canvas);
    labelTextureCache.set(letter, fallback);
    return fallback;
  }

  ctx.clearRect(0, 0, size, size);
  ctx.font = "bold 80px system-ui, -apple-system, Segoe UI, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineWidth = 8;
  ctx.strokeStyle = "rgba(0,0,0,0.85)";
  ctx.strokeText(letter, size / 2, size / 2);
  ctx.fillStyle = "#ffffff";
  ctx.fillText(letter, size / 2, size / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  labelTextureCache.set(letter, texture);
  return texture;
}

function AxisLabel({ letter }: { letter: string }) {
  const texture = useMemo(() => getLabelTexture(letter), [letter]);

  return (
    <sprite position={[0, AXIS_LEN + LABEL_OFFSET, 0]} scale={[LABEL_SCALE, LABEL_SCALE, 1]} renderOrder={10}>
      <spriteMaterial map={texture} transparent depthTest={false} toneMapped={false} />
    </sprite>
  );
}

function AxisArrow({
  dir,
  color,
  label,
}: {
  dir: THREE.Vector3;
  color: string;
  label: string;
}) {
  const shaftLength = AXIS_LEN - CONE_HEIGHT;
  const quaternion = useMemo(() => {
    const q = new THREE.Quaternion();
    q.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
    return q;
  }, [dir]);

  return (
    <group quaternion={quaternion}>
      <mesh position={[0, shaftLength / 2, 0]}>
        <cylinderGeometry args={[SHAFT_RADIUS, SHAFT_RADIUS, shaftLength, 10]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
      <mesh position={[0, shaftLength + CONE_HEIGHT / 2, 0]}>
        <coneGeometry args={[CONE_RADIUS, CONE_HEIGHT, 12]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
      <AxisLabel letter={label} />
    </group>
  );
}

function AxisGizmoScene() {
  const { camera } = useThree();
  const viewDir = useRef(new THREE.Vector3());

  useFrame(() => {
    viewDir.current.subVectors(viewportCameraSync.position, viewportCameraSync.target);
    if (viewDir.current.lengthSq() < 1e-8) return;

    viewDir.current.normalize();
    camera.position.copy(viewDir.current).multiplyScalar(GIZMO_CAMERA_DISTANCE);
    camera.lookAt(0, 0, 0);
    camera.updateMatrixWorld();
  });

  return (
    <group>
      {AXES.map((axis) => (
        <AxisArrow key={axis.label} dir={axis.dir} color={axis.color} label={axis.label} />
      ))}
    </group>
  );
}

function ViewportAxisGizmo() {
  return (
    <div
      className="pointer-events-none absolute right-5 bottom-[4.25rem] z-40 h-36 w-36 drop-shadow-[0_2px_14px_rgba(0,0,0,0.5)]"
      title="World axes (X red, Y green, Z blue)"
      aria-label="Orientation gizmo: X red, Y green, Z blue"
    >
      <Canvas
        orthographic
        camera={{ position: [0, 0, 2.8], zoom: 108, near: 0.1, far: 20 }}
        className="h-full w-full"
        gl={{ alpha: true, antialias: true }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0);
        }}
      >
        <ambientLight intensity={1.5} />
        <AxisGizmoScene />
      </Canvas>
    </div>
  );
}

export { ViewportAxisGizmo };
