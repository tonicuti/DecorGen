import type { DetectedObject } from "@/types";

const API_BASE_URL = "http://127.0.0.1:8000";

type FloorPlanItem = {
  label?: string;
  coordinates?: {
    x?: number;
    y?: number;
    width?: number;
    height?: number;
  };
  rotate?: number;
  ocr_confidence?: number;
};

export type FloorPlanAnalysisResponse = {
  room?: {
    axes?: {
      Ox?: unknown;
      Oy?: unknown;
    };
  } | null;
  items?: FloorPlanItem[];
  warnings?: string[];
  source?: string;
};

function titleCase(value: string) {
  return value
    .replace(/[_-]+/g, " ")
    .trim()
    .replace(/\w\S*/g, (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
}

function toDetectedCategory(label: string): DetectedObject["category"] {
  const normalized = label.toLowerCase();
  if (normalized.includes("room")) return "room";
  if (
    normalized.includes("door") ||
    normalized.includes("window") ||
    normalized.includes("opening")
  ) {
    return "opening";
  }
  return "furniture";
}

function getCoordinates(item: FloorPlanItem) {
  const coordinates = item.coordinates;
  if (
    !coordinates ||
    typeof coordinates.x !== "number" ||
    typeof coordinates.y !== "number"
  ) {
    return undefined;
  }

  return {
    x: coordinates.x,
    y: coordinates.y,
    width: coordinates.width,
    height: coordinates.height,
  };
}

function formatDetails(item: FloorPlanItem) {
  const details: string[] = [];
  const coordinates = getCoordinates(item);

  if (typeof item.rotate === "number") {
    details.push(`Rotate: ${item.rotate}deg`);
  }

  if (typeof item.ocr_confidence === "number") {
    details.push(`OCR: ${Math.round(item.ocr_confidence)}%`);
  }

  if (coordinates) {
    details.push(`x: ${coordinates.x}, y: ${coordinates.y}`);
  }

  return details.join(" | ") || undefined;
}

export function mapFloorPlanToDetectedObjects(
  analysis: FloorPlanAnalysisResponse
): DetectedObject[] {
  const objects: DetectedObject[] = [];

  if (analysis.room) {
    objects.push({
      id: "room-1",
      name: "Room",
      selected: true,
      category: "room",
    });
  }

  for (const [index, item] of (analysis.items || []).entries()) {
    const label = item.label?.trim() || `Object ${index + 1}`;
    const coordinates = getCoordinates(item);
    objects.push({
      id: `floor-plan-item-${index + 1}`,
      name: titleCase(label),
      selected: true,
      details: formatDetails(item),
      category: toDetectedCategory(label),
      floorPlan: {
        label,
        coordinates,
        rotate: item.rotate,
        ocrConfidence: item.ocr_confidence,
      },
    });
  }

  return objects;
}

export async function analyzeFloorPlan(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/api/floor-plan/analyze`, {
    method: "POST",
    body: formData,
  });

  const data = (await response.json()) as FloorPlanAnalysisResponse & { error?: string };

  if (!response.ok) {
    throw new Error(data.error || `Floor-plan analysis failed: ${response.status}`);
  }

  return {
    raw: data,
    objects: mapFloorPlanToDetectedObjects(data),
  };
}
