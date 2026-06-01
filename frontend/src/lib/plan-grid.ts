import type { SceneDimensions } from "@/types";

export const PLAN_GRID_STEP_M = 0.5;
export const PLAN_GRID_PPM = 100;

export function renderPlanGridSvg(dimensions: SceneDimensions): string {
  const stepPx = PLAN_GRID_STEP_M * PLAN_GRID_PPM;
  const halfW = (dimensions.width * PLAN_GRID_PPM) / 2;
  const halfL = (dimensions.length * PLAN_GRID_PPM) / 2;

  const lines: string[] = [];

  for (let x = -halfW; x <= halfW + 0.001; x += stepPx) {
    const stroke = x === 0 ? "#a1a1aa" : "#d4d4d8";
    const sw = x === 0 ? 1.25 : 0.75;
    lines.push(
      `<line x1="${x}" y1="${-halfL}" x2="${x}" y2="${halfL}" stroke="${stroke}" stroke-width="${sw}"/>`
    );
  }

  for (let y = -halfL; y <= halfL + 0.001; y += stepPx) {
    const stroke = y === 0 ? "#a1a1aa" : "#d4d4d8";
    const sw = y === 0 ? 1.25 : 0.75;
    lines.push(
      `<line x1="${-halfW}" y1="${y}" x2="${halfW}" y2="${y}" stroke="${stroke}" stroke-width="${sw}"/>`
    );
  }

  return `<g class="plan-grid">${lines.join("")}</g>`;
}
