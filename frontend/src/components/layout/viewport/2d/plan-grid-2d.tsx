import { PLAN_GRID_PPM, PLAN_GRID_STEP_M } from "@/lib/plan-grid";
import type { SceneDimensions } from "@/types";

interface PlanGrid2DProps {
  dimensions: SceneDimensions;
}

function PlanGrid2D({ dimensions }: PlanGrid2DProps) {
  const stepPx = PLAN_GRID_STEP_M * PLAN_GRID_PPM;
  const halfW = (dimensions.width * PLAN_GRID_PPM) / 2;
  const halfL = (dimensions.length * PLAN_GRID_PPM) / 2;

  const verticalLines: number[] = [];
  for (let x = -halfW; x <= halfW + 0.001; x += stepPx) {
    verticalLines.push(x);
  }

  const horizontalLines: number[] = [];
  for (let y = -halfL; y <= halfL + 0.001; y += stepPx) {
    horizontalLines.push(y);
  }

  return (
    <g className="plan-grid-2d pointer-events-none" aria-hidden>
      {verticalLines.map((x) => (
        <line
          key={`v-${x}`}
          x1={x}
          y1={-halfL}
          x2={x}
          y2={halfL}
          stroke="currentColor"
          strokeWidth={x === 0 ? 1.25 : 0.75}
          className={
            x === 0
              ? "text-zinc-400/70 dark:text-zinc-500/80"
              : "text-zinc-300/60 dark:text-zinc-600/70"
          }
        />
      ))}
      {horizontalLines.map((y) => (
        <line
          key={`h-${y}`}
          x1={-halfW}
          y1={y}
          x2={halfW}
          y2={y}
          stroke="currentColor"
          strokeWidth={y === 0 ? 1.25 : 0.75}
          className={
            y === 0
              ? "text-zinc-400/70 dark:text-zinc-500/80"
              : "text-zinc-300/60 dark:text-zinc-600/70"
          }
        />
      ))}
    </g>
  );
}

export { PlanGrid2D };
