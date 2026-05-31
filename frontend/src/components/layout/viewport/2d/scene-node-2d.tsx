import { useRef } from "react";
import * as THREE from "three";
import { PIXELS_PER_METER } from "@/components/layout/viewport/2d/plan-2d";
import { useSceneStore } from "@/store/use-scene-store";
import type { SceneNode2DProps } from "@/types";

function SceneNode2D({ node, parentVisible = true, legendMap }: SceneNode2DProps) {
  const selectedIds = useSceneStore((state) => state.selectedIds);
  const setSelectedIds = useSceneStore((state) => state.setSelectedIds);
  const isSelected = selectedIds.includes(node.id);
  const lastPos = useRef({ x: 0, y: 0 });

  const isVisible = parentVisible && node.visible !== false;
  if (!isVisible) return null;

  if (node.type === "camera" || node.type === "light") return null;

  const x = (node.position?.[0] || 0) * PIXELS_PER_METER;
  const y = (node.position?.[2] || 0) * PIXELS_PER_METER;
  const rotRad = node.rotation?.[1] || 0;
  const rotDeg = -THREE.MathUtils.radToDeg(rotRad);
  const scaleX = node.scale?.[0] ?? 1;
  const scaleY = node.scale?.[2] ?? 1;

  if (node.type === "group") {
    return (
      <g transform={`translate(${x}, ${y}) rotate(${rotDeg}) scale(${scaleX}, ${scaleY})`}>
        {node.children?.map((child) => (
          <SceneNode2D
            key={child.id}
            node={child}
            parentVisible={isVisible}
            legendMap={legendMap}
          />
        ))}
      </g>
    );
  }

  const w = (node.dimensions?.w || 1) * PIXELS_PER_METER;
  const h = (node.dimensions?.d || 1) * PIXELS_PER_METER;
  const isDoor = node.assetId?.includes("door") || node.name.toLowerCase().includes("door");
  const isOpening = node.placementType === "opening";

  if (node.placementType === "tabletop" || node.placementType === "ceiling") {
    return null;
  }

  let fill = "#ffffff";
  let stroke = "#000000";
  let strokeWidth = 2;

  if (isOpening) {
    fill = "#ffffff";
    stroke = "#a1a1aa";
  } else if (node.placementType === "wall") {
    fill = "#18181b";
    stroke = "none";
  }

  const legendNumber = legendMap?.get(node.id);

  const handlePointerDown = (e: React.PointerEvent) => {
    lastPos.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    const dx = Math.abs(e.clientX - lastPos.current.x);
    const dy = Math.abs(e.clientY - lastPos.current.y);

    if (dx < 5 && dy < 5) {
      if (!(e as any).hasSelectedNode) {
        (e as any).hasSelectedNode = true;
        setSelectedIds([node.id]);
      }
    }
  };

  return (
    <g
      transform={`translate(${x}, ${y}) rotate(${rotDeg}) scale(${scaleX}, ${scaleY})`}
      className="group cursor-pointer"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
    >
      {stroke !== "none" && (
        <rect
          x={-w / 2}
          y={-h / 2}
          width={w}
          height={h}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
          className="pointer-events-auto dark:fill-zinc-900 dark:stroke-zinc-400"
        />
      )}
      {isDoor && (
        <path
          d={`M ${-w / 2} ${h / 2} L ${-w / 2} ${h / 2 + w} A ${w} ${w} 0 0 0 ${w / 2} ${h / 2}`}
          fill="none"
          stroke="#000000"
          strokeWidth="1"
          strokeDasharray="4 4"
          className="pointer-events-none dark:stroke-zinc-500"
        />
      )}
      {isDoor && (
        <line
          x1={-w / 2}
          y1={h / 2}
          x2={-w / 2}
          y2={h / 2 + w}
          stroke="#000000"
          strokeWidth="2"
          className="pointer-events-none dark:stroke-zinc-400"
        />
      )}
      {node.children?.map((child) => (
        <SceneNode2D key={child.id} node={child} parentVisible={isVisible} legendMap={legendMap} />
      ))}
      {legendNumber && (
        <g pointerEvents="none" transform={`translate(0, ${isDoor ? h / 2 + w / 2 : 0})`}>
          <g transform={`rotate(${-rotDeg * scaleX * scaleY}) scale(${scaleX}, ${scaleY})`}>
            <circle
              cx="0"
              cy="0"
              r="10"
              className={`stroke-1 transition-colors ${
                isSelected
                  ? "fill-indigo-500 stroke-indigo-600 shadow-sm dark:fill-indigo-500 dark:stroke-indigo-400"
                  : "fill-indigo-100 stroke-indigo-300 dark:fill-indigo-900/80 dark:stroke-indigo-700"
              }`}
            />
            <text
              x={0}
              y={0}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize="10"
              fontWeight="bold"
              className={`font-sans transition-colors select-none ${
                isSelected ? "fill-white" : "fill-indigo-700 dark:fill-indigo-300"
              }`}
              style={{ userSelect: "none" }}
            >
              {legendNumber}
            </text>
          </g>
        </g>
      )}
    </g>
  );
}

export { SceneNode2D };
