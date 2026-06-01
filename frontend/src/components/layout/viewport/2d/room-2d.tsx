import { PIXELS_PER_METER } from "@/components/layout/viewport/2d/plan-2d";
import type { Room2DProps } from "@/types";

function Room2D({ dimensions }: Room2DProps) {
  const widthPx = dimensions.width * PIXELS_PER_METER;
  const lengthPx = dimensions.length * PIXELS_PER_METER;
  const thicknessPx = dimensions.thickness;
  const halfWidth = widthPx / 2;
  const halfLength = lengthPx / 2;

  return (
    <g className="room-2d">
      <rect
        x={-halfWidth}
        y={-halfLength}
        width={widthPx}
        height={lengthPx}
        fill="#f4f4f5"
        stroke="#e4e4e7"
        className="dark:fill-zinc-900 dark:stroke-zinc-800"
      />
      <rect
        x={-halfWidth - thicknessPx}
        y={-halfLength - thicknessPx}
        width={widthPx + thicknessPx * 2}
        height={thicknessPx}
        fill="#18181b"
        className="dark:fill-zinc-100"
      />
      <rect
        x={-halfWidth - thicknessPx}
        y={halfLength}
        width={widthPx + thicknessPx * 2}
        height={thicknessPx}
        fill="#18181b"
        className="dark:fill-zinc-100"
      />
      <rect
        x={-halfWidth - thicknessPx}
        y={-halfLength}
        width={thicknessPx}
        height={lengthPx}
        fill="#18181b"
        className="dark:fill-zinc-100"
      />
      <rect
        x={halfWidth}
        y={-halfLength}
        width={thicknessPx}
        height={lengthPx}
        fill="#18181b"
        className="dark:fill-zinc-100"
      />
      <text
        x={0}
        y={-halfLength - thicknessPx - 10}
        textAnchor="middle"
        fontSize="12"
        fill="#71717a"
        className="font-mono dark:fill-zinc-400"
      >
        {dimensions.width.toFixed(2)}m
      </text>
      <text
        x={halfWidth + thicknessPx + 10}
        y={0}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="12"
        fill="#71717a"
        transform={`rotate(90 ${halfWidth + thicknessPx + 10} 0)`}
        className="font-mono dark:fill-zinc-400"
      >
        {dimensions.length.toFixed(2)}m
      </text>
    </g>
  );
}

export { Room2D };
