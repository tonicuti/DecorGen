import * as THREE from "three";
import { buildLegendItems, buildLegendMap } from "@/lib/plan-legend";
import { renderPlanGridSvg } from "@/lib/plan-grid";
import { useSceneStore } from "@/store/use-scene-store";
import type { SceneDimensions, SceneNode } from "@/types";

export const PIXELS_PER_METER = 100;

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderRoomSvg(dimensions: SceneDimensions): string {
  const widthPx = dimensions.width * PIXELS_PER_METER;
  const lengthPx = dimensions.length * PIXELS_PER_METER;
  const thicknessPx = dimensions.thickness;
  const halfWidth = widthPx / 2;
  const halfLength = lengthPx / 2;

  return `
    <g>
      <rect x="${-halfWidth}" y="${-halfLength}" width="${widthPx}" height="${lengthPx}" fill="#f4f4f5" stroke="#e4e4e7"/>
      <rect x="${-halfWidth - thicknessPx}" y="${-halfLength - thicknessPx}" width="${widthPx + thicknessPx * 2}" height="${thicknessPx}" fill="#27272a"/>
      <rect x="${-halfWidth - thicknessPx}" y="${halfLength}" width="${widthPx + thicknessPx * 2}" height="${thicknessPx}" fill="#27272a"/>
      <rect x="${-halfWidth - thicknessPx}" y="${-halfLength}" width="${thicknessPx}" height="${lengthPx}" fill="#27272a"/>
      <rect x="${halfWidth}" y="${-halfLength}" width="${thicknessPx}" height="${lengthPx}" fill="#27272a"/>
      <text x="0" y="${-halfLength - thicknessPx - 10}" text-anchor="middle" font-size="12" fill="#71717a" font-family="monospace">${dimensions.width.toFixed(1)}m</text>
      <text x="${halfWidth + thicknessPx + 14}" y="0" text-anchor="middle" font-size="12" fill="#71717a" font-family="monospace" transform="rotate(90 ${halfWidth + thicknessPx + 14} 0)">${dimensions.length.toFixed(1)}m</text>
    </g>
  `;
}

function renderNodeSvg(node: SceneNode, legendMap: Map<string, number>, parentVisible = true): string {
  if (!parentVisible || node.visible === false) return "";
  if (node.type === "camera" || node.type === "light") return "";

  if (node.type === "group") {
    const x = (node.position?.[0] || 0) * PIXELS_PER_METER;
    const y = (node.position?.[2] || 0) * PIXELS_PER_METER;
    const rotRad = node.rotation?.[1] || 0;
    const rotDeg = -THREE.MathUtils.radToDeg(rotRad);
    const scaleX = node.scale?.[0] ?? 1;
    const scaleY = node.scale?.[2] ?? 1;
    const children = (node.children || [])
      .map((child) => renderNodeSvg(child, legendMap, true))
      .join("");
    return `<g transform="translate(${x},${y}) rotate(${rotDeg}) scale(${scaleX},${scaleY})">${children}</g>`;
  }

  if (node.placementType === "tabletop" || node.placementType === "ceiling") return "";

  const x = (node.position?.[0] || 0) * PIXELS_PER_METER;
  const y = (node.position?.[2] || 0) * PIXELS_PER_METER;
  const rotRad = node.rotation?.[1] || 0;
  const rotDeg = -THREE.MathUtils.radToDeg(rotRad);
  const scaleX = node.scale?.[0] ?? 1;
  const scaleY = node.scale?.[2] ?? 1;
  const w = (node.dimensions?.w || 1) * PIXELS_PER_METER;
  const h = (node.dimensions?.d || 1) * PIXELS_PER_METER;
  const isDoor = node.assetId?.includes("door") || node.name.toLowerCase().includes("door");
  const isOpening = node.placementType === "opening";

  let fill = "#ffffff";
  let stroke = "#000000";
  let strokeWidth = 2;
  if (isOpening) {
    fill = "#ffffff";
    stroke = "#a1a1aa";
  } else if (node.placementType === "wall") {
    fill = "transparent";
    stroke = "#71717a";
    strokeWidth = 1;
  }

  const legendNumber = legendMap.get(node.id);
  const children = (node.children || [])
    .map((child) => renderNodeSvg(child, legendMap, true))
    .join("");

  let doorSvg = "";
  if (isDoor) {
    doorSvg = `
      <path d="M ${-w / 2} ${h / 2} L ${-w / 2} ${h / 2 + w} A ${w} ${w} 0 0 0 ${w / 2} ${h / 2}" fill="none" stroke="#000000" stroke-width="1" stroke-dasharray="4 4"/>
      <line x1="${-w / 2}" y1="${h / 2}" x2="${-w / 2}" y2="${h / 2 + w}" stroke="#000000" stroke-width="2"/>
    `;
  }

  let badgeSvg = "";
  if (legendNumber) {
    const badgeY = isDoor ? h / 2 + w / 2 : 0;
    badgeSvg = `
      <g transform="translate(0,${badgeY})">
        <g transform="rotate(${-rotDeg * scaleX * scaleY}) scale(${scaleX},${scaleY})">
          <circle cx="0" cy="0" r="10" fill="#e0e7ff" stroke="#a5b4fc"/>
          <text x="0" y="4" text-anchor="middle" font-size="10" font-weight="bold" fill="#4338ca" font-family="sans-serif">${legendNumber}</text>
        </g>
      </g>
    `;
  }

  const rectSvg =
    stroke !== "none"
      ? `<rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}"/>`
      : "";

  return `
    <g transform="translate(${x},${y}) rotate(${rotDeg}) scale(${scaleX},${scaleY})">
      ${rectSvg}
      ${doorSvg}
      ${children}
      ${badgeSvg}
    </g>
  `;
}

function renderLegendSvg(legendItems: SceneNode[], startX: number, startY: number): string {
  const rowHeight = 36;
  const items = legendItems
    .map((item, index) => {
      const num = index + 1;
      const dims = item.dimensions;
      const dimText = dims
        ? `${dims.w.toFixed(2)}W × ${dims.d.toFixed(2)}D × ${dims.h.toFixed(2)}H`
        : "";
      return `
        <g transform="translate(0, ${index * rowHeight})">
          <circle cx="12" cy="12" r="10" fill="#e0e7ff" stroke="#a5b4fc"/>
          <text x="12" y="16" text-anchor="middle" font-size="10" font-weight="bold" fill="#4338ca" font-family="sans-serif">${num}</text>
          <text x="32" y="10" font-size="11" font-weight="600" fill="#18181b" font-family="sans-serif">${escapeXml(item.name)}</text>
          <text x="32" y="24" font-size="9" fill="#71717a" font-family="monospace">${escapeXml(dimText)}</text>
        </g>
      `;
    })
    .join("");

  const legendHeight = legendItems.length * rowHeight + 28;
  return `
    <g transform="translate(${startX}, ${startY})">
      <rect x="0" y="0" width="220" height="${legendHeight}" fill="#ffffff" stroke="#e4e4e7" rx="8"/>
      <text x="12" y="20" font-size="12" font-weight="600" fill="#18181b" font-family="sans-serif">Legend</text>
      <g transform="translate(8, 28)">${items}</g>
    </g>
  `;
}

function buildPlanSvg(
  tree: SceneNode[],
  roomDimensions: SceneDimensions,
  gridOverlay: boolean
): { svg: string; width: number; height: number } {
  const legendItems = buildLegendItems(tree);
  const legendMap = buildLegendMap(tree);

  const contentWidth = roomDimensions.width * PIXELS_PER_METER + roomDimensions.thickness * 2 + 80;
  const contentHeight = roomDimensions.length * PIXELS_PER_METER + roomDimensions.thickness * 2 + 80;
  const legendWidth = 240;
  const padding = 40;
  const width = contentWidth + legendWidth + padding * 3;
  const height = Math.max(contentHeight + padding * 2, legendItems.length * 36 + 80);

  const centerX = padding + contentWidth / 2;
  const centerY = padding + contentHeight / 2;

  const roomSvg = renderRoomSvg(roomDimensions);
  const gridSvg = gridOverlay ? renderPlanGridSvg(roomDimensions) : "";
  const nodesSvg = tree.map((node) => renderNodeSvg(node, legendMap)).join("");
  const legendSvg = renderLegendSvg(legendItems, width - legendWidth - padding, padding);

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="100%" height="100%" fill="#ffffff"/>
  <g transform="translate(${centerX}, ${centerY})">
    ${roomSvg}
    ${gridSvg}
    ${nodesSvg}
  </g>
  ${legendSvg}
</svg>`;

  return { svg, width, height };
}

function downloadDataUrl(dataUrl: string, filename: string) {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export async function exportPlan2DPng(): Promise<void> {
  const { tree, roomDimensions, sceneSettings } = useSceneStore.getState();
  const { svg, width, height } = buildPlanSvg(tree, roomDimensions, sceneSettings.gridOverlay);

  const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = width * 2;
      canvas.height = height * 2;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error("Canvas not supported"));
        return;
      }
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.scale(2, 2);
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      downloadDataUrl(canvas.toDataURL("image/png"), "blueprint-2d.png");
      resolve();
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to render blueprint SVG"));
    };
    img.src = url;
  });
}
