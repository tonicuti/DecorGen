import { Grid } from "@react-three/drei";
import { PLAN_GRID_STEP_M } from "@/lib/plan-grid";
import { useSceneStore } from "@/store/use-scene-store";

function FloorGrid3D() {
  const gridOverlay = useSceneStore((s) => s.sceneSettings.gridOverlay);
  const { width, length } = useSceneStore((s) => s.roomDimensions);

  if (!gridOverlay) return null;

  return (
    <Grid
      position={[0, 0.02, 0]}
      args={[width, length]}
      cellSize={PLAN_GRID_STEP_M}
      cellThickness={0.6}
      cellColor="#a1a1aa"
      sectionSize={1}
      sectionThickness={1.2}
      sectionColor="#71717a"
      fadeDistance={30}
      fadeStrength={1}
      infiniteGrid={false}
    />
  );
}

export { FloorGrid3D };
